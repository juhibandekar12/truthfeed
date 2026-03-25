# TruthFeed 📰

**AI-powered Fake News Detection Platform** — users submit news articles, a BERT model classifies them, and the community can vote, comment, and bookmark.

---

## Project Architecture

```
fake_news_detection/
├── ai/                     # AI/ML layer (BERT model, prediction, moderation)
│   ├── model.py            # Singleton BERT model loader (load_model / get_model / get_tokenizer)
│   ├── predict.py          # BERT inference → {is_real, confidence, real_prob, fake_prob}
│   ├── duplicate.py        # TF-IDF cosine-similarity duplicate checker
│   ├── summarize.py        # Extractive text summariser (utility)
│   └── toxicity.py         # Profanity / toxic content filter
│
├── backend/                # FastAPI REST API
│   ├── main.py             # App factory, CORS, lifespan (model load + scheduler start)
│   ├── database.py         # Motor (async MongoDB) client + collection refs + index setup
│   ├── auth.py             # bcrypt hashing, JWT creation/verification, FastAPI dependencies
│   ├── models.py           # Pydantic request/response models
│   └── routes/
│       ├── users.py        # POST /auth/signup, /auth/login, /auth/logout  GET /auth/me
│       ├── news.py         # POST /news/post  GET /news/feed, /news/search, …
│       ├── engagement.py   # Upvote, downvote, bookmark, comments
│       └── admin.py        # Dashboard stats, analytics, article override/delete
│
├── services/               # Background services
│   ├── fact_checker.py     # Cross-reference via NewsAPI + DuckDuckGo
│   ├── news_fetcher.py     # Auto-ingest top headlines from NewsAPI every 24 h
│   └── scheduler.py       # APScheduler wrapper (starts/stops the 24 h job)
│
├── frontend/               # React + Vite + TailwindCSS SPA
│   ├── src/
│   │   ├── App.jsx
│   │   ├── pages/          # Page components (Feed, Login, Signup, Admin …)
│   │   ├── components/     # Reusable UI components
│   │   ├── context/        # React context (AuthContext etc.)
│   │   └── services/       # Axios API client wrappers
│   └── dist/               # Production build (served by FastAPI in prod)
│
├── streamlit_app.py        # Standalone Streamlit BERT demo (HuggingFace Space)
├── config.py               # Central config — reads all env vars via python-dotenv
├── requirements.txt        # Python dependencies
├── Dockerfile              # Docker image for backend deployment
├── Procfile                # Heroku/Render process definition
└── .env                    # Local secrets (never committed)
```

---

## News Submission Pipeline

```
User submits article
       │
       ▼
1. Toxicity Check (better-profanity)
       │ ❌ reject if toxic
       ▼
2. Duplicate Check (TF-IDF cosine similarity ≥ 85%)
       │ ❌ reject if duplicate
       ▼
3. BERT Classification (HuggingFace: avivaaaaa123/fake-news-detector)
       │ ❌ reject if FAKE
       ▼
4. Fact Cross-Check (NewsAPI → DuckDuckGo fallback)
       │ ✅ boost confidence if verified
       ▼
5. Store as REAL NEWS in MongoDB → user trust_score += 1
```

---

## Community Recheck Flow

When an article accumulates **≥ 10 downvotes**, BERT re-classifies it. If the model now predicts FAKE, the article is hidden from the public feed automatically.

---

## Running Locally

### Prerequisites
- Python 3.11 (`.python-version` is set)
- Node.js 18+
- MongoDB Atlas (or local mongod)
- Copy `.env.example` → `.env` and fill in your secrets

### 1. Backend
```bash
# Activate venv
.\fvenv\Scripts\Activate.ps1   # Windows PowerShell

# Install dependencies (first time only)
pip install -r requirements.txt

# Start backend
python -m uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
```
API docs: http://localhost:8000/docs

### 2. Frontend (development)
```bash
cd frontend
npm install   # first time only
npm run dev
```
Frontend: http://localhost:3000

### 3. Streamlit Demo (HuggingFace Space)
```bash
streamlit run streamlit_app.py
```

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `MONGODB_URL` | ✅ | MongoDB connection string |
| `MONGODB_DB` | – | DB name (default: `truthfeed`) |
| `SECRET_KEY` | ✅ | JWT signing secret |
| `ALGORITHM` | – | JWT algorithm (default: `HS256`) |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | – | Token TTL (default: 1440 = 24 h) |
| `NEWS_API_KEY` | – | NewsAPI.org key (enables auto-news + fact-check) |
| `ADMIN_EMAIL` | – | Email that gets promoted to `admin` role on signup |
| `HUGGINGFACE_MODEL_PATH` | – | HF model repo (default: `avivaaaaa123/fake-news-detector`) |
| `FRONTEND_URL` | – | Production frontend URL (added to CORS allow-list) |

---

## Deployment

### Docker
```bash
docker build -t truthfeed .
docker run -p 8000:8000 --env-file .env truthfeed
```

### Heroku / Render
`Procfile` is already configured:
```
web: uvicorn backend.main:app --host 0.0.0.0 --port $PORT
```

---

## Key Design Decisions

- **BERT-first rejection**: If BERT says FAKE, the article is always rejected — the News API cross-check can only *upgrade* a borderline REAL prediction, never override a FAKE one.
- **Singleton model loading**: The BERT model is loaded once at startup (`ai/model.py`) and shared across all requests, avoiding expensive repeated loads.
- **Community rechecks**: Downvotes trigger automatic BERT re-classification, providing a crowd-sourced quality signal without manual moderation.
