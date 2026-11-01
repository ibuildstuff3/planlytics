import React, { useState, useEffect, useCallback } from "react";

const API_BASE = "http://localhost:5000/api";

/* ── Helpers ───────────────────────────────────────────── */
function formatCrores(rupees) {
  const cr = Number(rupees) / 10_000_000;
  return `₹${cr.toFixed(2)} Cr`;
}

function formatLakhs(rupees) {
  const lk = Number(rupees) / 100_000;
  return lk >= 100 ? formatCrores(rupees) : `₹${lk.toFixed(1)} L`;
}

/* ── Toast ───────────────────────────────────────────────── */
function Toast({ msg, icon = "✓" }) {
  return (
    <div className="toast">
      <span>{icon}</span>
      {msg}
    </div>
  );
}

/* ── Project Modal ──────────────────────────────────────── */
function ProjectModal({ project, onClose, onToggleStatus, onDelete }) {
  const { input: inp, output: out } = project;
  const riskColor = { High: "#b91c1c", Medium: "#92400e", Low: "#065f46" };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <div className="modal-title">{inp.project_name}</div>
            <div style={{ color: "#64748b", fontSize: 13, marginTop: 4 }}>
              📍 {inp.location} &nbsp;·&nbsp;
              <span className={`risk-badge ${out.risk_level}`}>{out.risk_level} RISK</span>
            </div>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {/* Input Parameters */}
        <div className="modal-section">
          <div className="modal-section-title">📋 Project Parameters</div>
          <div className="modal-grid">
            <div className="modal-field">
              <div className="modal-field-label">Project Type</div>
              <div className="modal-field-value">{inp.project_type}</div>
            </div>
            <div className="modal-field">
              <div className="modal-field-label">Terrain</div>
              <div className="modal-field-value">{inp.terrain}</div>
            </div>
            <div className="modal-field">
              <div className="modal-field-label">Estimated Cost</div>
              <div className="modal-field-value">{formatCrores(inp.estimated_cost)}</div>
            </div>
            <div className="modal-field">
              <div className="modal-field-label">Duration (Estimated)</div>
              <div className="modal-field-value">{inp.estimated_duration_months} months</div>
            </div>
            <div className="modal-field">
              <div className="modal-field-label">Vendor Rating</div>
              <div className="modal-field-value">{inp.vendor_rating} / 5.0</div>
            </div>
            <div className="modal-field">
              <div className="modal-field-label">Weather Impact</div>
              <div className="modal-field-value">{inp.weather_impact}</div>
            </div>
          </div>
        </div>

        {/* Prediction Results */}
        <div className="modal-section">
          <div className="modal-section-title">📊 ML Prediction Results</div>
          <div className={`risk-banner ${out.risk_level}`} style={{ marginBottom: 14 }}>
            <div className="risk-banner-title">⚠️ {out.risk_level.toUpperCase()} RISK — Confidence: {out.confidence}%</div>
          </div>
          <div className="modal-grid">
            <div className="modal-field">
              <div className="modal-field-label">Predicted Total Cost</div>
              <div className="modal-field-value">{formatCrores(out.predicted_total_cost)}</div>
              <div style={{ fontSize: 12, color: "#dc2626", fontWeight: 600, marginTop: 2 }}>
                +{formatLakhs(out.predicted_cost_overrun)} ({out.predicted_cost_overrun_pct}%)
              </div>
            </div>
            <div className="modal-field">
              <div className="modal-field-label">Predicted Duration</div>
              <div className="modal-field-value">{out.predicted_total_duration} months</div>
              <div style={{ fontSize: 12, color: "#dc2626", fontWeight: 600, marginTop: 2 }}>
                +{out.predicted_time_overrun} months ({out.predicted_time_overrun_pct}%)
              </div>
            </div>
          </div>
        </div>

        {/* Key Risk Factors */}
        {out.key_risk_factors && out.key_risk_factors.length > 0 && (
          <div className="modal-section">
            <div className="modal-section-title">⚠️ Key Risk Factors</div>
            {out.key_risk_factors.map((rf, i) => (
              <div key={i} className="factor-item">
                <div className="factor-item-title">{rf.title}</div>
                <div className="factor-item-desc">{rf.description}</div>
              </div>
            ))}
          </div>
        )}

        <div className="modal-actions">
          <button
            className="btn-toggle"
            onClick={() => { onToggleStatus(project); onClose(); }}
          >
            {project.status === "completed" ? "↩ Mark In Progress" : "✓ Mark Completed"}
          </button>
          <button
            className="btn-delete"
            onClick={() => { onDelete(project.id); onClose(); }}
          >
            🗑 Delete
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Main App ─────────────────────────────────────────────── */
export default function App() {
  const [activeTab, setActiveTab]           = useState("dashboard");
  const [projects, setProjects]             = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [latestPrediction, setLatestPrediction] = useState(null);
  const [loading, setLoading]               = useState(false);
  const [toast, setToast]                   = useState(null);

  const [formData, setFormData] = useState({
    project_name:               "Toshiba Solution",
    project_type:               "Substation",
    location:                   "Pune",
    terrain:                    "Urban",
    estimated_cost:             30000000,
    estimated_duration_months:  40,
    labor_cost:                 3000000,
    vendor_rating:              4.2,
    weather_impact:             "Low",
    start_date:                 "2025-11-24"
  });

  /* ── Toast helper ─────────────────────────────────────── */
  const showToast = (msg, icon) => {
    setToast({ msg, icon });
    setTimeout(() => setToast(null), 3000);
  };

  /* ── Fetch all projects ───────────────────────────────── */
  const fetchProjects = useCallback(async () => {
    try {
      const res  = await fetch(`${API_BASE}/projects`);
      const data = await res.json();
      setProjects(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch projects:", err);
    }
  }, []);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  /* ── Seed 10 benchmark projects ──────────────────────── */
  const handleSeedSampleData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/seed`, { method: "POST" });
      if (!res.ok) throw new Error("Seed failed");
      await fetchProjects();
      setActiveTab("dashboard");
      showToast("Loaded 10 sample projects!", "⚡");
    } catch (e) {
      showToast("Error seeding data. Ensure backend is running on port 5000.", "✕");
    }
    setLoading(false);
  };

  /* ── Submit prediction ───────────────────────────────── */
  const handlePredictSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res  = await fetch(`${API_BASE}/predict`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(formData)
      });
      if (!res.ok) throw new Error("Prediction failed");
      const saved = await res.json();
      setLatestPrediction(saved.output);
      await fetchProjects();
      showToast("Prediction generated successfully!", "✓");
    } catch (err) {
      showToast("Prediction failed. Ensure Node.js & Python backend is running.", "✕");
    }
    setLoading(false);
  };

  /* ── Toggle status ───────────────────────────────────── */
  const toggleStatus = async (proj) => {
    const nextStatus = proj.status === "completed" ? "in_progress" : "completed";
    await fetch(`${API_BASE}/projects/${proj.id}/status`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ status: nextStatus })
    });
    fetchProjects();
    showToast(`Project marked as ${nextStatus === "completed" ? "Completed" : "In Progress"}`, "✓");
  };

  /* ── Delete project ──────────────────────────────────── */
  const deleteProject = async (id) => {
    await fetch(`${API_BASE}/projects/${id}`, { method: "DELETE" });
    fetchProjects();
    showToast("Project deleted.", "🗑");
  };

  /* ── Dashboard calculations ──────────────────────────── */
  const totalProjects  = projects.length;
  const completedCount = projects.filter((p) => p.status === "completed").length;
  const inProgressCount = totalProjects - completedCount;
  const avgCostOverrun = totalProjects > 0
    ? (projects.reduce((s, p) => s + Number(p.output.predicted_cost_overrun_pct || 0), 0) / totalProjects).toFixed(2)
    : "0.00";

  const typeCounts = projects.reduce((acc, p) => {
    const t = p.input.project_type || "Substation";
    acc[t] = (acc[t] || 0) + 1;
    return acc;
  }, {});

  const riskCounts = {
    Low:    projects.filter((p) => p.output.risk_level === "Low").length,
    Medium: projects.filter((p) => p.output.risk_level === "Medium").length,
    High:   projects.filter((p) => p.output.risk_level === "High").length
  };

  const highRiskProjects = projects.filter((p) => p.output.risk_level === "High");

  const typeColors = { "Substation": "#4f67d8", "Overhead Line": "#10b981", "Underground Cable": "#f59e0b" };

  /* ── Field setter helper ─────────────────────────────── */
  const setField = (key) => (e) => {
    const val = e.target.type === "number" ? Number(e.target.value) : e.target.value;
    setFormData((prev) => ({ ...prev, [key]: val }));
  };

  /* ════════════════════════════════════════════════════════
     RENDER
  ════════════════════════════════════════════════════════ */
  return (
    <div>
      {/* ── Top Header ──────────────────────────────────── */}
      <header className="top-header">
        <div className="brand-block">
          <div className="brand-icon">📊</div>
          <div>
            <div className="brand-title">Planlytics</div>
            <div className="brand-subtitle">ML-Powered Project Cost &amp; Timeline Predictor</div>
          </div>
        </div>
        <div className="header-right">
          <button className="seed-btn" onClick={handleSeedSampleData} disabled={loading}>
            {loading ? <><span className="spinner" /> &nbsp;Loading…</> : "⚡ Load Sample Projects"}
          </button>
        </div>
      </header>

      <div className="layout-container">
        {/* ── Sidebar ───────────────────────────────────── */}
        <aside className="sidebar">
          <div className="sidebar-section-label">Navigation</div>
          {[
            { id: "dashboard", icon: "📈", label: "Dashboard" },
            { id: "projects",  icon: "📂", label: "Projects" },
            { id: "predict",   icon: "↗️",  label: "Predict" },
            { id: "hotspots",  icon: "⚠️",  label: "Risk Hotspots" }
          ].map(({ id, icon, label }) => (
            <button
              key={id}
              className={`nav-btn ${activeTab === id ? "active" : ""}`}
              onClick={() => setActiveTab(id)}
            >
              <span className="nav-icon">{icon}</span> {label}
              {id === "hotspots" && highRiskProjects.length > 0 && (
                <span style={{ marginLeft: "auto", background: "#ef4444", color: "#fff", fontSize: 11, fontWeight: 800, borderRadius: 99, padding: "2px 7px" }}>
                  {highRiskProjects.length}
                </span>
              )}
            </button>
          ))}
        </aside>

        {/* ── Main Content ──────────────────────────────── */}
        <main className="main-content">

          {/* ══════════════════════════════════════════════
              TAB 1 — DASHBOARD
          ══════════════════════════════════════════════ */}
          {activeTab === "dashboard" && (
            <div>
              <h1 className="page-heading">Dashboard Overview</h1>
              <p className="page-subheading">Planlytics prediction analytics — powered by Gradient Boosting &amp; Random Forest</p>

              {/* 4 Summary Cards */}
              <div className="summary-grid">
                <div className="summary-card">
                  <div className="summary-icon">🏗</div>
                  <div className="summary-label">Total Projects</div>
                  <div className="summary-value">{totalProjects}</div>
                  <div className="summary-delta">All tracked projects</div>
                </div>
                <div className="summary-card green">
                  <div className="summary-icon">✅</div>
                  <div className="summary-label">Completed</div>
                  <div className="summary-value">{completedCount}</div>
                  <div className="summary-delta">Delivered projects</div>
                </div>
                <div className="summary-card amber">
                  <div className="summary-icon">🔄</div>
                  <div className="summary-label">In Progress</div>
                  <div className="summary-value">{inProgressCount}</div>
                  <div className="summary-delta">Active projects</div>
                </div>
                <div className="summary-card red">
                  <div className="summary-icon">📉</div>
                  <div className="summary-label">Avg Cost Overrun</div>
                  <div className="summary-value">{avgCostOverrun}%</div>
                  <div className="summary-delta">Across all projects</div>
                </div>
              </div>

              {/* Projects by Type + Risk Distribution */}
              <div className="dashboard-panels">
                <div className="panel-card">
                  <div className="panel-title">Projects by Type</div>
                  {Object.keys(typeCounts).length === 0 ? (
                    <p style={{ color: "#64748b", fontSize: 14 }}>
                      No projects yet. Click "⚡ Load Report's 10 Test Projects" above to begin.
                    </p>
                  ) : (
                    Object.entries(typeCounts).map(([type, count]) => (
                      <div key={type} className="type-bar-row">
                        <div className="type-bar-label">
                          <span>{type}</span>
                          <span style={{ color: "#64748b" }}>{count} project{count !== 1 ? "s" : ""}</span>
                        </div>
                        <div className="type-bar-track">
                          <div
                            className="type-bar-fill"
                            style={{
                              width: `${Math.max(12, (count / totalProjects) * 100)}%`,
                              background: typeColors[type] || "#4f67d8"
                            }}
                          />
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="panel-card">
                  <div className="panel-title">Risk Distribution</div>
                  <div className={`risk-row low-row`}>
                    <div className="risk-row-left">
                      <span className="risk-pill Low">Low</span>
                      <span style={{ fontSize: 14 }}>Low Risk</span>
                    </div>
                    <strong style={{ fontSize: 20, color: "#065f46" }}>{riskCounts.Low}</strong>
                  </div>
                  <div className={`risk-row medium-row`}>
                    <div className="risk-row-left">
                      <span className="risk-pill Medium">Medium</span>
                      <span style={{ fontSize: 14 }}>Medium Risk</span>
                    </div>
                    <strong style={{ fontSize: 20, color: "#92400e" }}>{riskCounts.Medium}</strong>
                  </div>
                  <div className={`risk-row high-row`}>
                    <div className="risk-row-left">
                      <span className="risk-pill High">High</span>
                      <span style={{ fontSize: 14 }}>High Risk</span>
                    </div>
                    <strong style={{ fontSize: 20, color: "#b91c1c" }}>{riskCounts.High}</strong>
                  </div>
                </div>
              </div>

              {/* Cost & Duration Overrun Bar Chart */}
              {projects.length > 0 && (
                <div className="panel-card">
                  <div className="panel-title">Cost vs. Duration Overrun (%)</div>
                  <div className="overrun-chart">
                    {[...projects].reverse().map((p) => (
                      <div key={p.id} className="chart-row">
                        <div className="chart-name" title={p.input.project_name}>{p.input.project_name}</div>
                        <div className="chart-bars">
                          <div className="chart-bar-wrap">
                            <div
                              className="chart-bar cost"
                              style={{ width: `${Math.min(100, p.output.predicted_cost_overrun_pct * 3.5)}%` }}
                            />
                            <span className="chart-label cost">Cost: {p.output.predicted_cost_overrun_pct}%</span>
                          </div>
                          <div className="chart-bar-wrap">
                            <div
                              className="chart-bar time"
                              style={{ width: `${Math.min(100, p.output.predicted_time_overrun_pct * 3.5)}%` }}
                            />
                            <span className="chart-label time">Time: {p.output.predicted_time_overrun_pct}%</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ══════════════════════════════════════════════
              TAB 2 — ALL PROJECTS
          ══════════════════════════════════════════════ */}
          {activeTab === "projects" && (
            <div>
              <h1 className="page-heading">All Projects</h1>
              <p className="page-subheading">{totalProjects} project{totalProjects !== 1 ? "s" : ""} tracked — click a card to view details</p>

              {projects.length === 0 ? (
                <div className="panel-card">
                  <div className="empty-state">
                    <div className="empty-state-icon">📂</div>
                    <div className="empty-state-title">No projects yet</div>
                    <div className="empty-state-desc">Load the sample projects or create a new prediction to get started.</div>
                    <button className="cta-btn" onClick={handleSeedSampleData}>⚡ Load Benchmark Projects</button>
                  </div>
                </div>
              ) : (
                <div className="projects-grid">
                  {projects.map((p) => (
                    <div
                      key={p.id}
                      className={`project-card ${p.output.risk_level}`}
                      onClick={() => setSelectedProject(p)}
                    >
                      <div className="project-card-header">
                        <div className="project-card-title">{p.input.project_name}</div>
                        <span className={`status-pill ${p.status === "completed" ? "completed" : ""}`}>
                          {p.status === "completed" ? "Completed" : "In Progress"}
                        </span>
                      </div>
                      <div className="project-meta">📍 {p.input.location} &nbsp;·&nbsp; {p.input.terrain}</div>
                      <div className="project-meta">🏗 {p.input.project_type}</div>
                      <div className="project-stats">
                        <div className="stat-box">
                          <div className="stat-box-label">Est. Cost</div>
                          <div className="stat-box-value">{formatCrores(p.input.estimated_cost)}</div>
                          <div className="stat-box-sub">+{p.output.predicted_cost_overrun_pct}% overrun</div>
                        </div>
                        <div className="stat-box">
                          <div className="stat-box-label">Duration</div>
                          <div className="stat-box-value">{p.input.estimated_duration_months}m</div>
                          <div className="stat-box-sub">+{p.output.predicted_time_overrun_pct}% delay</div>
                        </div>
                      </div>
                      <div className={`risk-badge ${p.output.risk_level}`}>
                        ⚠️ {p.output.risk_level} Risk
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ══════════════════════════════════════════════
              TAB 3 — PREDICT
          ══════════════════════════════════════════════ */}
          {activeTab === "predict" && (
            <div>
              <h1 className="page-heading">Predict Project Outcomes</h1>
              <p className="page-subheading">Enter project parameters to generate an ML-powered cost and timeline prediction</p>

              <div className="predict-layout">
                {/* Input Form */}
                <form className="form-card" onSubmit={handlePredictSubmit}>
                  <div className="form-section-title">📋 Project Parameters</div>
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Project Name</label>
                      <input type="text" required value={formData.project_name} onChange={setField("project_name")} placeholder="e.g. Toshiba Solution" />
                    </div>
                    <div className="form-group">
                      <label>Project Type</label>
                      <select value={formData.project_type} onChange={setField("project_type")}>
                        <option>Substation</option>
                        <option>Overhead Line</option>
                        <option>Underground Cable</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Location</label>
                      <input type="text" required value={formData.location} onChange={setField("location")} placeholder="City name" />
                    </div>
                    <div className="form-group">
                      <label>Terrain</label>
                      <select value={formData.terrain} onChange={setField("terrain")}>
                        <option>Urban</option>
                        <option>Rural</option>
                        <option>Coastal</option>
                        <option>Hilly</option>
                        <option>Forest</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Estimated Cost (₹)</label>
                      <input type="number" required value={formData.estimated_cost} onChange={setField("estimated_cost")} min="100000" />
                    </div>
                    <div className="form-group">
                      <label>Duration (months)</label>
                      <input type="number" required value={formData.estimated_duration_months} onChange={setField("estimated_duration_months")} min="1" />
                    </div>
                    <div className="form-group">
                      <label>Labor Cost (₹)</label>
                      <input type="number" required value={formData.labor_cost} onChange={setField("labor_cost")} min="0" />
                    </div>
                    <div className="form-group">
                      <label>Vendor Rating (1.0 – 5.0)</label>
                      <input type="number" step="0.1" min="1" max="5" required value={formData.vendor_rating} onChange={setField("vendor_rating")} />
                    </div>
                    <div className="form-group">
                      <label>Weather Impact</label>
                      <select value={formData.weather_impact} onChange={setField("weather_impact")}>
                        <option>Low</option>
                        <option>Moderate</option>
                        <option>High</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Start Date</label>
                      <input type="date" value={formData.start_date} onChange={setField("start_date")} />
                    </div>
                  </div>
                  <button type="submit" className="submit-btn" disabled={loading}>
                    {loading ? <><span className="spinner" /> &nbsp;Generating Prediction…</> : "↗️ Generate Prediction"}
                  </button>
                </form>

                {/* Results Panel */}
                {latestPrediction ? (
                  <div className="results-card">
                    <div className="results-title">📊 Prediction Results</div>

                    <div className={`risk-banner ${latestPrediction.risk_level}`}>
                      <div className="risk-banner-title">
                        ⚠️ {latestPrediction.risk_level.toUpperCase()} RISK PROJECT
                      </div>
                      <div className="risk-banner-sub">Model Confidence: {latestPrediction.confidence}%</div>
                    </div>

                    <div className="metrics-pair">
                      <div className="metric-box">
                        <div className="metric-box-label">💲 Predicted Total Cost</div>
                        <div className="metric-box-main">{formatCrores(latestPrediction.predicted_total_cost)}</div>
                        <div className="metric-box-sub">
                          +{formatLakhs(latestPrediction.predicted_cost_overrun)} ({latestPrediction.predicted_cost_overrun_pct}%)
                        </div>
                      </div>
                      <div className="metric-box">
                        <div className="metric-box-label">🕒 Predicted Duration</div>
                        <div className="metric-box-main">{latestPrediction.predicted_total_duration} months</div>
                        <div className="metric-box-sub">
                          +{latestPrediction.predicted_time_overrun} months ({latestPrediction.predicted_time_overrun_pct}%)
                        </div>
                      </div>
                    </div>

                    <div className="confidence-bar-wrap">
                      <div className="confidence-bar-label">
                        <span>Model Confidence</span>
                        <span>{latestPrediction.confidence}%</span>
                      </div>
                      <div className="confidence-bar-track">
                        <div className="confidence-bar-fill" style={{ width: `${latestPrediction.confidence}%` }} />
                      </div>
                    </div>

                    {latestPrediction.key_risk_factors && latestPrediction.key_risk_factors.length > 0 && (
                      <>
                        <div className="factors-title" style={{ marginTop: 22 }}>⚠️ Key Risk Factors</div>
                        {latestPrediction.key_risk_factors.map((rf, idx) => (
                          <div key={idx} className="factor-item">
                            <div className="factor-item-title">{rf.title}</div>
                            <div className="factor-item-desc">{rf.description}</div>
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                ) : (
                  <div className="results-card" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 340 }}>
                    <div style={{ fontSize: 48, marginBottom: 16 }}>📈</div>
                    <div style={{ font: "700 18px/1 Inter,sans-serif", color: "#334155", marginBottom: 10 }}>No prediction yet</div>
                    <div style={{ color: "#64748b", fontSize: 13, textAlign: "center" }}>Fill in the project parameters and click<br />"Generate Prediction" to see results here.</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════
              TAB 4 — RISK HOTSPOTS
          ══════════════════════════════════════════════ */}
          {activeTab === "hotspots" && (
            <div>
              <h1 className="page-heading">Risk Hotspots</h1>
              <p className="page-subheading">High-risk projects requiring immediate management attention</p>

              {highRiskProjects.length === 0 ? (
                <div className="panel-card">
                  <div className="empty-state">
                    <div className="empty-state-icon">✅</div>
                    <div className="empty-state-title">No high-risk projects</div>
                    <div className="empty-state-desc">All current projects are within acceptable risk thresholds.</div>
                  </div>
                </div>
              ) : (
                highRiskProjects.map((p) => (
                  <div key={p.id} className="hotspot-card" style={{ cursor: "pointer" }} onClick={() => setSelectedProject(p)}>
                    <div className="hotspot-header">
                      <div>
                        <div className="hotspot-name">{p.input.project_name}</div>
                        <div className="hotspot-location">📍 {p.input.location} &nbsp;·&nbsp; {p.input.project_type} &nbsp;·&nbsp; {p.input.terrain} Terrain</div>
                      </div>
                      <span className="risk-badge High">⚠️ HIGH RISK</span>
                    </div>

                    <div className="hotspot-grid">
                      <div className="hotspot-stat">
                        <div className="hotspot-stat-label">Cost Overrun</div>
                        <div className="hotspot-stat-value">{p.output.predicted_cost_overrun_pct}%</div>
                        <div className="hotspot-stat-sub">+{formatLakhs(p.output.predicted_cost_overrun)}</div>
                      </div>
                      <div className="hotspot-stat">
                        <div className="hotspot-stat-label">Time Overrun</div>
                        <div className="hotspot-stat-value">{p.output.predicted_time_overrun_pct}%</div>
                        <div className="hotspot-stat-sub">+{p.output.predicted_time_overrun} months</div>
                      </div>
                      <div className="hotspot-stat">
                        <div className="hotspot-stat-label">Confidence</div>
                        <div className="hotspot-stat-value">{p.output.confidence}%</div>
                        <div className="hotspot-stat-sub">ML model score</div>
                      </div>
                    </div>

                    <div className="critical-box">
                      ⚠️ &nbsp;Predicted total cost: <strong>&nbsp;{formatCrores(p.output.predicted_total_cost)}&nbsp;</strong> over {p.output.predicted_total_duration} months — immediate review recommended.
                    </div>

                    {p.output.key_risk_factors && p.output.key_risk_factors.length > 0 && (
                      <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 8 }}>
                        {p.output.key_risk_factors.map((rf, i) => (
                          <div key={i} className="factor-item">
                            <div className="factor-item-title">{rf.title}</div>
                            <div className="factor-item-desc">{rf.description}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </main>
      </div>

      {/* ── Project Detail Modal ──────────────────────── */}
      {selectedProject && (
        <ProjectModal
          project={selectedProject}
          onClose={() => setSelectedProject(null)}
          onToggleStatus={toggleStatus}
          onDelete={deleteProject}
        />
      )}

      {/* ── Toast Notification ──────────────────────────── */}
      {toast && <Toast msg={toast.msg} icon={toast.icon} />}
    </div>
  );
}
