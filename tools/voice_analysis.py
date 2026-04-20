"""
Voice Analysis Tools — Extract style features and manage voice profiles.
"""

import json
from pathlib import Path

# Base directory for voice profiles
VOICE_DIR = Path(__file__).parent.parent / "voice_profiles"
VOICE_DIR.mkdir(parents=True, exist_ok=True)


def load_profile(profile_name: str) -> str:
    """Load a specific voice profile.

    Args:
        profile_name: Name of the voice profile to load.

    Returns:
        JSON string representation of the voice profile, or an error message.
    """
    path = VOICE_DIR / f"{_sanitize(profile_name)}.json"
    if not path.exists():
        return f"Voice profile not found: '{profile_name}'"
    return path.read_text(encoding="utf-8")


def list_profiles() -> str:
    """List all available voice profiles.

    Returns:
        Formatted list of profile names.
    """
    profiles = [f.stem for f in VOICE_DIR.glob("*.json")]
    if not profiles:
        return "No voice profiles found. Create one by analyzing a writing sample."
    return "Available voice profiles:\n" + "\n".join(f"- {p}" for p in profiles)


def save_profile(profile_name: str, profile_data_json: str) -> str:
    """Save voice profile data.

    Args:
        profile_name: Name for the voice profile.
        profile_data_json: The voice profile data as a JSON string.

    Returns:
        Confirmation message.
    """
    try:
        # Validate that it's proper JSON
        data = json.loads(profile_data_json)
        path = VOICE_DIR / f"{_sanitize(profile_name)}.json"
        # Re-dump beautifully
        path.write_text(json.dumps(data, indent=2), encoding="utf-8")
        return f"Voice profile '{profile_name}' saved successfully."
    except json.JSONDecodeError:
        return "Failed to save voice profile: Invalid JSON data."
    except Exception as e:
        return f"Failed to save voice profile: {e}"


def analyze_sample(sample_text: str, current_profile_data_json: str = "{}") -> str:
    """Analyze a text sample to extract stylistic features.

    Note: In a true production environment, this would use NLP tools (spaCy, nltk)
    to count sentence types, vocab richness, etc. For this agentic system, we
    ask the LLM to perform the synthesis based on data, but this tool provides
    the structure and basic stats to help the LLM.

    Args:
        sample_text: The writing sample to analyze.
        current_profile_data_json: Existing profile data to update (as JSON string).

    Returns:
        Updated profile data as a JSON string.
    """
    try:
        current_data = json.loads(current_profile_data_json)
    except:
        current_data = {"samples_analyzed": 0, "total_words": 0}

    # Basic stats
    words = sample_text.split()
    total_words = len(words)

    if total_words == 0:
        return json.dumps(current_data)

    sentences = [s.strip() for s in sample_text.replace("!", ".").replace("?", ".").split(".") if s.strip()]
    num_sentences = max(len(sentences), 1)
    avg_sentence_length = total_words / num_sentences

    paragraphs = [p for p in sample_text.split("\n\n") if p.strip()]
    num_paragraphs = max(len(paragraphs), 1)

    # Simple heuristic updates (The LLM Voice Agent will do the deep semantic analysis)
    current_data["samples_analyzed"] = current_data.get("samples_analyzed", 0) + 1
    current_data["total_words"] = current_data.get("total_words", 0) + total_words
    current_data["avg_sentence_length_latest_sample"] = round(avg_sentence_length, 1)

    # We return the basic stats, expecting the LLM to augment this with its tone analysis
    return json.dumps(current_data, indent=2)


def build_voice_description(profile_name: str, additional_context: str = "") -> str:
    """Build a natural language description of a voice profile for prompting.

    Args:
        profile_name: The name of the profile.
        additional_context: Any additional context the LLM previously extracted.

    Returns:
        A rich description string suitable for prompting the Writer Agent.
    """
    profile_json = load_profile(profile_name)
    if profile_json.startswith("Voice profile not found"):
        return profile_json

    try:
        data = json.loads(profile_json)
        desc = f"Voice Profile: {profile_name}\n"
        desc += f"Based on {data.get('samples_analyzed', 0)} samples ({data.get('total_words', 0)} words).\n\n"

        # The LLM is expected to have saved 'style_guidelines' or 'tone_summary' in the profile
        if 'style_guidelines' in data:
            desc += "Style Guidelines:\n"
            for guideline in data['style_guidelines']:
                desc += f"- {guideline}\n"

        if additional_context:
            desc += f"\nAdditional Notes:\n{additional_context}"

        return desc
    except json.JSONDecodeError:
        return "Failed to parse voice profile."


def _sanitize(name: str) -> str:
    """Sanitize a string for use as a filename."""
    valid = "".join(c for c in name if c.isalnum() or c in " -_")
    return valid.strip().lower().replace(" ", "_")
