"""
ai/model.py — BERT model singleton.

Loads the fine-tuned BERT model and tokenizer from HuggingFace once at
server startup. All other modules access the model via get_model() and
get_tokenizer().
"""
import logging

from transformers import BertTokenizer, TFBertForSequenceClassification
from config import HUGGINGFACE_MODEL_PATH

logger = logging.getLogger(__name__)

# Global model and tokenizer — loaded ONCE at startup
_model = None
_tokenizer = None


def load_model() -> None:
    """Load the BERT model and tokenizer from HuggingFace."""
    global _model, _tokenizer
    if _model is not None and _tokenizer is not None:
        return

    logger.info(f"Loading BERT model from {HUGGINGFACE_MODEL_PATH}...")
    _tokenizer = BertTokenizer.from_pretrained(HUGGINGFACE_MODEL_PATH)
    _model = TFBertForSequenceClassification.from_pretrained(
        HUGGINGFACE_MODEL_PATH,
    )
    logger.info("BERT model loaded successfully.")


def get_model():
    """Return the loaded model. Raises if not yet loaded."""
    if _model is None:
        raise RuntimeError(
            "BERT model is not loaded. Call load_model() first.",
        )
    return _model


def get_tokenizer():
    """Return the loaded tokenizer. Raises if not yet loaded."""
    if _tokenizer is None:
        raise RuntimeError(
            "Tokenizer is not loaded. Call load_model() first.",
        )
    return _tokenizer
