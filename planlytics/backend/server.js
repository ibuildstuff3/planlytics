const express = require("express");
const cors = require("cors");
const sqlite3 = require("sqlite3").verbose();
const { spawn } = require("child_process");
const path = require("path");

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

const dbPath = path.join(__dirname, "planlytics.db");
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS predictions (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      input      TEXT    NOT NULL,
      output     TEXT    NOT NULL,
      status     TEXT    DEFAULT 'in_progress',
      created_at TEXT    DEFAULT CURRENT_TIMESTAMP
    )
  `);
});

function runPythonPrediction(projectInput) {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(__dirname, "ml", "predict_model.py");
    const pythonCmd = process.platform === "win32" ? "python" : "python3";
    const pyProcess = spawn(pythonCmd, [scriptPath]);

    let stdoutData = "";
    let stderrData = "";

    pyProcess.stdout.on("data", (data) => { stdoutData += data.toString(); });
    pyProcess.stderr.on("data", (data) => { stderrData += data.toString(); });

    pyProcess.on("close", (code) => {
      if (code !== 0) {
        return reject(new Error(stderrData || "Python script failed"));
      }
      try {
        resolve(JSON.parse(stdoutData));
      } catch (err) {
        reject(err);
      }
    });

    pyProcess.stdin.write(JSON.stringify(projectInput));
    pyProcess.stdin.end();
  });
}

app.post("/api/predict", async (req, res) => {
  try {
    const inputData = req.body;
    const outputData = await runPythonPrediction(inputData);
    const status = inputData.status || "in_progress";
    const createdAt = new Date().toISOString();

    db.run(
      `INSERT INTO predictions (input, output, status, created_at) VALUES (?, ?, ?, ?)`,
      [JSON.stringify(inputData), JSON.stringify(outputData), status, createdAt],
      function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID, input: inputData, output: outputData, status, created_at: createdAt });
      }
    );
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/projects", (req, res) => {
  db.all(`SELECT * FROM predictions ORDER BY id DESC`, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows.map((r) => ({
      id: r.id,
      input: JSON.parse(r.input),
      output: JSON.parse(r.output),
      status: r.status,
      created_at: r.created_at
    })));
  });
});

app.patch("/api/projects/:id/status", (req, res) => {
  const { status } = req.body;
  db.run(
    `UPDATE predictions SET status = ? WHERE id = ?`,
    [status, req.params.id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ updated: this.changes });
    }
  );
});

app.delete("/api/projects/:id", (req, res) => {
  db.run(`DELETE FROM predictions WHERE id = ?`, [req.params.id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ deleted: this.changes });
  });
});

app.post("/api/seed", async (req, res) => {
  const sampleProjects = [
    { project_name: "Toshiba Solution", project_type: "Substation",       location: "Pune",      terrain: "Urban",   estimated_cost: 30000000, estimated_duration_months: 40, labor_cost: 3000000, vendor_rating: 4.2, weather_impact: "Low",      start_date: "2025-11-24" },
    { project_name: "Roadways",         project_type: "Underground Cable", location: "Mumbai",    terrain: "Urban",   estimated_cost: 15000000, estimated_duration_months: 24, labor_cost: 1800000, vendor_rating: 3.9, weather_impact: "High",     start_date: "2025-11-24" },
    { project_name: "Karnataka Govt",   project_type: "Overhead Line",     location: "Mangalore", terrain: "Coastal", estimated_cost: 18000000, estimated_duration_months: 36, labor_cost: 2100000, vendor_rating: 4.0, weather_impact: "High",     start_date: "2025-11-24" },
    { project_name: "L&TT",            project_type: "Underground Cable", location: "Delhi",     terrain: "Urban",   estimated_cost: 50000000, estimated_duration_months: 56, labor_cost: 5000000, vendor_rating: 4.6, weather_impact: "Low",      start_date: "2025-11-24" },
    { project_name: "Powerline. Co",    project_type: "Substation",       location: "Hyderabad", terrain: "Urban",   estimated_cost: 25000000, estimated_duration_months: 38, labor_cost: 2500000, vendor_rating: 4.1, weather_impact: "Moderate", start_date: "2025-11-24" },
    { project_name: "Reliance Power",   project_type: "Substation",       location: "Nagpur",    terrain: "Urban",   estimated_cost: 10000000, estimated_duration_months: 34, labor_cost: 1200000, vendor_rating: 3.4, weather_impact: "Moderate", start_date: "2025-11-24" },
    { project_name: "Coinstart",        project_type: "Substation",       location: "Ahmedabad", terrain: "Urban",   estimated_cost: 35000000, estimated_duration_months: 45, labor_cost: 3500000, vendor_rating: 4.5, weather_impact: "Moderate", start_date: "2025-11-24" },
    { project_name: "Debris",           project_type: "Overhead Line",     location: "Kolkata",   terrain: "Urban",   estimated_cost:  8000000, estimated_duration_months: 29, labor_cost:  950000, vendor_rating: 3.2, weather_impact: "High",     start_date: "2025-11-24" },
    { project_name: "E%C pvt ltd",      project_type: "Underground Cable", location: "Satara",    terrain: "Rural",   estimated_cost: 17000000, estimated_duration_months: 53, labor_cost: 1900000, vendor_rating: 3.5, weather_impact: "Moderate", start_date: "2025-11-24" },
    { project_name: "Tata",             project_type: "Overhead Line",     location: "Lonavala",  terrain: "Hilly",   estimated_cost: 10000000, estimated_duration_months: 28, labor_cost: 1100000, vendor_rating: 3.6, weather_impact: "High",     start_date: "2025-11-24" }
  ];

  try {
    await new Promise((resolve, reject) => {
      db.run(`DELETE FROM predictions`, (err) => (err ? reject(err) : resolve()));
    });

    for (const proj of sampleProjects) {
      const output = await runPythonPrediction(proj);
      await new Promise((resolve, reject) => {
        db.run(
          `INSERT INTO predictions (input, output, status, created_at) VALUES (?, ?, ?, ?)`,
          [JSON.stringify(proj), JSON.stringify(output), "in_progress", new Date().toISOString()],
          (err) => (err ? reject(err) : resolve())
        );
      });
    }
    res.json({ message: "10 sample projects loaded successfully." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Planlytics backend running on http://localhost:${PORT}`);
});
