# Local Setup Guide

## Prerequisites

- Python 3.11+
- Node.js 18+
- MongoDB Atlas account (connection string in `.env`)

---

## One-Time Setup

### 1. Create & Activate Virtual Environment

```powershell
python -m venv venv
.\venv\Scripts\activate
```

### 2. Install Python Dependencies

```powershell
pip install -r requirements.txt
```

### 3. Install Frontend Dependencies

```powershell
cd frontend
npm install
cd ..
```

### 4. Configure Environment

Copy `.env.example` to `.env` and fill in your credentials:

```powershell
copy .env.example .env
```

---

## Running the Project (3 Terminals)

> **All 3 terminals must have the venv activated first:**
> ```powershell
> .\venv\Scripts\activate
> ```

### Terminal 1 — Streamlit App (Fake News Detector)

```powershell
streamlit run streamlit_app.py
```
Opens at **http://localhost:8501**

### Terminal 2 — TruthFeed Backend (FastAPI)

```powershell
uvicorn backend.main:app --reload --port 8000
```
API docs at **http://localhost:8000/docs**

### Terminal 3 — TruthFeed Frontend (React)

```powershell
cd frontend
npm run dev
```
Opens at **http://localhost:3000**

---

## Project Structure

```
fake_news_detection/
├── app.py              # Streamlit fake news detector
├── config.py           # Unified config (all settings)
├── requirements.txt    # All Python dependencies
├── .env                # Environment variables
│
├── ai/                 # AI models (BERT, toxicity, duplicate)
│   ├── model.py
│   ├── predict.py
│   ├── toxicity.py
│   ├── duplicate.py
│   └── summarize.py
│
├── backend/            # FastAPI backend
│   ├── main.py
│   ├── auth.py
│   ├── database.py
│   ├── models.py
│   └── routes/
│       ├── users.py
│       ├── news.py
│       ├── engagement.py
│       └── admin.py
│
├── frontend/           # React + Vite frontend
│   ├── package.json
│   ├── src/
│   └── ...
│
├── services/           # Background services
│   ├── fact_checker.py
│   ├── news_fetcher.py
│   └── scheduler.py
│
├── src/                # Streamlit model/predict helpers
│   ├── model.py
│   └── predict.py
│
├── dataset/            # Training data (gitignored)
└── experiments/        # Jupyter notebooks
```
