# Planlytics

A full-stack web application that predicts **cost overruns and timeline delays** for infrastructure projects using machine learning.

It combines a **Gradient Boosting** model (cost prediction) and a **Random Forest** model (timeline prediction) trained on domain-specific synthetic data, blended with a rule-based engine for hybrid output.

---

## Features

- **Dashboard** — KPI summary cards, project type breakdown, risk distribution, and an overrun bar chart
- **Projects** — Card grid with risk-colour-coded borders; click any card for a full detail modal
- **Predict** — Input form that runs the ML pipeline and shows live cost + timeline predictions
- **Risk Hotspots** — Filtered view of high-risk projects flagged for immediate attention
- **Sample Data** — One-click loader for 10 pre-configured test projects

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, vanilla CSS |
| Backend | Node.js, Express 4 |
| Database | SQLite3 |
| ML Engine | Python 3, scikit-learn, pandas, numpy |
| ML Models | GradientBoostingRegressor, RandomForestRegressor |

---

## Project Structure

```
planlytics/
├── backend/
│   ├── server.js          # Express REST API + SQLite + Python bridge
│   └── ml/
│       ├── predict_model.py   # ML pipeline (preprocessing, training, prediction)
│       └── requirements.txt
└── frontend/
    └── src/
        ├── App.js         # All 4 views + modal
        └── App.css        # Design system
```

---

## How It Works

The ML pipeline in `predict_model.py` runs in four steps:

1. **Preprocessing** — Label encoding for categorical features (project type, terrain, weather)
2. **Training** — Gradient Boosting for cost overrun, Random Forest for timeline overrun, on 150 synthetic samples
3. **Rule-based fallback** — Domain-derived multipliers for terrain, project type, and weather
4. **Hybrid output** — 65% ML + 35% rules, then risk classified as Low / Medium / High

### Terrain Multipliers

| Terrain | Multiplier |
|---------|-----------|
| Urban | 0.05 |
| Rural | 0.08 |
| Coastal | 0.12 |
| Hilly | 0.15 |
| Forest | 0.18 |

---

## Running Locally

### Prerequisites
- Python 3.9+ with pip
- Node.js 18+

### 1. Install Python dependencies
```bash
cd backend/ml
pip install -r requirements.txt
```

### 2. Start the backend
```bash
cd backend
npm install
node server.js
# Runs on http://localhost:5000
```

### 3. Start the frontend
```bash
cd frontend
npm install
npm start
# Runs on http://localhost:3000
```

### 4. Load sample data
Click **"⚡ Load Sample Projects"** in the app header to populate 10 pre-configured projects.

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/predict` | Run ML prediction for a new project |
| `GET` | `/api/projects` | Fetch all stored predictions |
| `PATCH` | `/api/projects/:id/status` | Toggle project status |
| `DELETE` | `/api/projects/:id` | Delete a prediction record |
| `POST` | `/api/seed` | Load sample projects |

---

## Notes

- `historical.json` (150-sample training dataset) is auto-generated on first run — excluded from version control
- `planlytics.db` is also auto-generated — excluded from version control
- The Python ML script is spawned as a child process by Node.js, communicating via stdin/stdout JSON
