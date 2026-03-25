"""
streamlit_app.py — Standalone Streamlit demo for the TruthFeed BERT classifier.
Deployed on HuggingFace Spaces. Uses the same ai/ module as the backend.
"""
import streamlit as st
from ai.model import load_model as _load_model, get_model, get_tokenizer
from ai.predict import predict
from config import APP_TITLE, APP_ICON, APP_DESCRIPTION

st.set_page_config(
    page_title=APP_TITLE,
    page_icon=APP_ICON,
    layout="centered"
)


@st.cache_resource
def get_model_cached():
    """Load the BERT model once and cache it for the lifetime of the app."""
    _load_model()
    return get_model(), get_tokenizer()


# Load model at startup
get_model_cached()

st.title("📰 Fake News Detector")
st.write(APP_DESCRIPTION)
st.markdown("---")

news_input = st.text_area(
    "Paste your news article here:",
    height=200,
    placeholder="Enter news article text..."
)

if st.button("🔍 Analyze", use_container_width=True):
    if news_input.strip() == "":
        st.warning("⚠️ Please enter some text first.")
    else:
        with st.spinner("Analyzing article & Verifying Factuality..."):
            result = predict(news_input)

            # Cross-check with NewsAPI / DuckDuckGo
            from services.fact_checker import cross_reference_news
            title_guess = " ".join(news_input.split()[:15])
            verification = cross_reference_news(title_guess)

            is_real = result.get("is_real", False)

            # Override if News API verifies an article BERT called FAKE
            if not is_real and verification.get("is_verified"):
                is_real = True
                result["real_prob"] = max(result.get("fake_prob", 0), 85.0)
                result["fake_prob"] = min(result.get("real_prob", 100), 15.0)

        st.markdown("---")

        if not is_real:
            st.error("🚨 FAKE NEWS")
        else:
            st.success("✅ REAL NEWS")
            if verification.get("is_verified"):
                source = verification.get("source", "NewsAPI/Web Search")
                st.info(f"📰 Verified by: **{source}**")

        st.subheader("Confidence Scores")
        col1, col2 = st.columns(2)

        with col1:
            fake_prob = result.get("fake_prob", 0.0)
            st.metric("🚨 Fake", f"{fake_prob:.2f}%")
            st.progress(min(fake_prob / 100, 1.0))

        with col2:
            real_prob = result.get("real_prob", 0.0)
            st.metric("✅ Real", f"{real_prob:.2f}%")
            st.progress(min(real_prob / 100, 1.0))