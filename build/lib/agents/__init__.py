"""
Writing Team Agents Package.

Exports create_coordinator() which builds the full agent hierarchy.
"""

from agents.coordinator import create_coordinator
from agents.idea_agent import idea_agent
from agents.outline_agent import outline_agent
from agents.research_agent import research_agent
from agents.writer_agent import writer_agent
from agents.editor_agent import editor_agent
from agents.voice_agent import voice_agent


def build_agent_team():
    """Build and return the complete agent hierarchy."""
    sub_agents = [
        idea_agent,
        research_agent,
        outline_agent,
        writer_agent,
        editor_agent,
        voice_agent,
    ]
    return create_coordinator(sub_agents)


__all__ = ["build_agent_team"]
