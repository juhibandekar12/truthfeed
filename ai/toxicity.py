"""ai/toxicity.py — Content moderation via profanity detection."""
from better_profanity import profanity

profanity.load_censor_words()


def is_toxic(text: str) -> bool:
    """Return True if the text contains profanity."""
    return profanity.contains_profanity(text)


def check_toxicity(text: str) -> dict:
    """Check text for profanity. Returns {is_toxic, message}."""
    if is_toxic(text):
        return {
            "is_toxic": True,
            "message": "Content contains inappropriate language "
                       "and has been rejected.",
        }
    return {"is_toxic": False, "message": "Content is clean."}
