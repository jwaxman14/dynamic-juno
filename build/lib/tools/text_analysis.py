"""
Text Analysis Tools — Readability and pacing analysis for the Editor Agent.
"""

import collections
import re


def readability_report(text: str) -> str:
    """Generate a readability report using textstat.

    Args:
        text: The text to analyze.

    Returns:
        Formatted string containing readability metrics.
    """
    try:
        import textstat
    except ImportError:
        return "textstat is not installed. Run: pip install textstat"

    if not text.strip():
        return "No text provided for analysis."

    flesch_reading_ease = textstat.flesch_reading_ease(text)
    flesch_kincaid_grade = textstat.flesch_kincaid_grade(text)
    smog_index = textstat.smog_index(text)
    coleman_liau_index = textstat.coleman_liau_index(text)
    consensus = textstat.text_standard(text)

    # Interpret Flesch Reading Ease
    if flesch_reading_ease >= 90:
        ease_desc = "Very Easy (5th grade)"
    elif flesch_reading_ease >= 80:
        ease_desc = "Easy (6th grade)"
    elif flesch_reading_ease >= 70:
        ease_desc = "Fairly Easy (7th grade)"
    elif flesch_reading_ease >= 60:
        ease_desc = "Standard (8th-9th grade)"
    elif flesch_reading_ease >= 50:
        ease_desc = "Fairly Difficult (10th-12th grade)"
    elif flesch_reading_ease >= 30:
        ease_desc = "Difficult (College)"
    else:
        ease_desc = "Very Difficult (College Graduate)"

    report = (
        "### Readability Metrics\n"
        f"- **Flesch Reading Ease**: {flesch_reading_ease:.1f} ({ease_desc})\n"
        f"- **Flesch-Kincaid Grade Level**: {flesch_kincaid_grade:.1f}\n"
        f"- **SMOG Index**: {smog_index:.1f}\n"
        f"- **Coleman-Liau Index**: {coleman_liau_index:.1f}\n"
        f"- **Consensus**: {consensus}\n"
    )
    return report


def pacing_analysis(text: str) -> str:
    """Analyze sentence and paragraph length variation for pacing.

    Args:
        text: The text to analyze.

    Returns:
        Formatted string containing pacing metrics.
    """
    # Simple tokenization for sentences
    sentences = re.split(r'[.!?]+', text)
    sentences = [s.strip() for s in sentences if s.strip()]

    if not sentences:
        return "Not enough text to analyze pacing."

    sentence_lengths = [len(s.split()) for s in sentences]
    avg_len = sum(sentence_lengths) / len(sentence_lengths)
    max_len = max(sentence_lengths)
    min_len = min(sentence_lengths)

    # Classify sentences
    short = sum(1 for l in sentence_lengths if l < 10)
    medium = sum(1 for l in sentence_lengths if 10 <= l <= 20)
    long = sum(1 for l in sentence_lengths if l > 20)

    total = len(sentence_lengths)
    short_pct = (short / total) * 100
    medium_pct = (medium / total) * 100
    long_pct = (long / total) * 100

    report = (
        "### Pacing & Sentence Structure\n"
        f"- **Total Sentences**: {total}\n"
        f"- **Average Words per Sentence**: {avg_len:.1f}\n"
        f"- **Short (<10 words)**: {short_pct:.1f}%\n"
        f"- **Medium (10-20 words)**: {medium_pct:.1f}%\n"
        f"- **Long (>20 words)**: {long_pct:.1f}%\n"
        f"- **Longest Sentence**: {max_len} words\n"
        f"- **Shortest Sentence**: {min_len} words\n"
    )

    if long_pct > 50:
        report += "\n*Note: High percentage of long sentences. Consider breaking some up for better flow.*"
    elif short_pct > 50:
        report += "\n*Note: High percentage of short sentences. This may feel choppy. Consider combining some for flow.*"

    return report


def engagement_metrics(text: str) -> str:
    """Analyze text for engagement markers (questions, direct address, etc.).

    Args:
        text: The text to analyze.

    Returns:
        Formatted string containing engagement analysis.
    """
    questions = len(re.findall(r'\?', text))
    exclamations = len(re.findall(r'!', text))

    words = re.findall(r'\b\w+\b', text.lower())
    total_words = max(len(words), 1)

    first_person = sum(1 for w in words if w in ['i', 'me', 'my', 'mine', 'we', 'us', 'our', 'ours'])
    second_person = sum(1 for w in words if w in ['you', 'your', 'yours'])

    unique_words = len(set(words))
    lexical_diversity = (unique_words / total_words) * 100

    report = (
        "### Engagement & Tone Markers\n"
        f"- **Questions Asked**: {questions}\n"
        f"- **Exclamations Used**: {exclamations}\n"
        f"- **First-Person Pronouns (I/We)**: {first_person}\n"
        f"- **Second-Person Pronouns (You)**: {second_person}\n"
        f"- **Lexical Diversity (UniqueWords/Total)**: {lexical_diversity:.1f}%\n"
    )

    return report
