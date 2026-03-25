"""
ai/predict.py — BERT-based fake news classification.
"""
import tensorflow as tf
from ai.model import get_model, get_tokenizer
from config import MAX_LENGTH

# Label index mapping — DO NOT CHANGE (calibrated to the trained model)
LABEL_INDEX = {"FAKE": 0, "REAL": 1}


def predict(text: str) -> dict:
    """
    Classify text using the BERT model.

    Returns:
        dict with keys: is_real, confidence, real_prob, fake_prob
    """
    model = get_model()
    tokenizer = get_tokenizer()

    inputs = tokenizer(
        text,
        return_tensors="tf",
        max_length=MAX_LENGTH,
        truncation=True,
        padding="max_length",
    )

    outputs = model(inputs)
    probs = tf.nn.softmax(outputs.logits, axis=1).numpy()[0]

    fake_prob = float(probs[LABEL_INDEX["FAKE"]])
    real_prob = float(probs[LABEL_INDEX["REAL"]])

    is_real = real_prob > fake_prob
    confidence = max(fake_prob, real_prob) * 100

    return {
        "is_real": is_real,
        "confidence": round(confidence, 2),
        "real_prob": round(real_prob * 100, 2),
        "fake_prob": round(fake_prob * 100, 2),
    }
