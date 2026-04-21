// Seed artifact content drawn from the two real Dynamic Juno projects.
window.ARTIFACTS = {
  projects: [
    {
      id: "vertical-void",
      name: "The Vertical Void",
      status: "ideation",
      created: "2026-03-28",
      wordCount: 0,
      chapters: 0,
      updated: "2h ago",
    },
    {
      id: "weakest-form",
      name: "The Weakest Form of Art",
      status: "drafting",
      created: "2026-01-14",
      wordCount: 18420,
      chapters: 4,
      updated: "yesterday",
    },
  ],

  ideas: [
    {
      id: "idea-vv",
      project: "vertical-void",
      title: "The Vertical Void",
      updated: "14 Apr",
      body: `## Core Thesis

Solo mountaineering acts as a profound, radical form of meditation and self-discovery. Unlike traditional meditation that seeks peace through stillness and safety, solo climbing forces an absolute internal stillness and hyper-presence through extreme physical exertion, profound isolation, and high-stakes risk.

## Target Audience

Climbers, outdoor adventurers, philosophy readers, and anyone fascinated by the intersections of extreme risk, mindfulness, and the human psyche.

## Major Themes

- **The Paradox of Stillness** — finding internal calm through intense physical movement and suffering.
- **Forced Presence** — how the immediate proximity of mortality and the "void" eradicates distractions, ego, and the anxieties of modern life.
- **Self-Discovery in Extremes** — uncovering the raw, primal self that remains when all societal masks are stripped away by the mountain.

## Unique Angle

Reframing solo mountaineering away from adrenaline-seeking or reckless conquest, and examining it instead as a rigorous, necessary spiritual and psychological practice.`,
    },
    {
      id: "idea-wfa",
      project: "weakest-form",
      title: "The Weakest Form of Art",
      updated: "03 Apr",
      body: `## Core Thesis

Human cognition evolved for a specific environmental niche. The modern world — built by humans, for humans — has deviated exponentially from the evolutionary stimuli that shaped us. Art is our most honest record of this drift.

## Key Moves

- The "alien environment" frame: we are mismatched to our own civilization.
- The peppered moth as a load-bearing metaphor for how quickly environment rewrites form.
- Art as the canary, not the cathedral.`,
    },
  ],

  outlines: [
    {
      id: "outline-vv",
      project: "vertical-void",
      title: "The Vertical Void — 3-Chapter Structure",
      updated: "14 Apr",
      chapters: 3,
      body: `### Chapter 1 — The Departure and the Demand for Presence
Sets up the contrast between the chaos of the modern world and the absolute focus demanded by the mountain.
- 1.1  The Noise of the Modern Mind
- 1.2  The Threshold of Risk
- 1.3  Shedding the Ego

### Chapter 2 — The Paradox of Stillness
The core of the book. The climb itself as a unique meditative state.
- 2.1  The Moving Meditation
- 2.2  The Alchemy of Suffering
- 2.3  The Eradication of Past and Future

### Chapter 3 — The Primal Self and the Descent
What is discovered in the void, and how it is carried back down to sea level.
- 3.1  Meeting the Void
- 3.2  The Clarity of Survival
- 3.3  Bringing the Mountain Down`,
    },
    {
      id: "outline-wfa",
      project: "weakest-form",
      title: "The Weakest Form of Art — 6-Chapter Structure",
      updated: "02 Apr",
      chapters: 6,
      body: `### Chapter 1 — The Alien Environment
### Chapter 2 — The Exponential Shift
### Chapter 3 — The Peppered Moth
### Chapter 4 — The Bottleneck of Propaganda
### Chapter 5 — Art as Canary
### Chapter 6 — Bending the Arc`,
    },
  ],

  drafts: [
    {
      id: "draft-wfa-01",
      project: "weakest-form",
      title: "Chapter 1 — The Alien Environment",
      updated: "18 Apr",
      words: 4820,
      status: "edited",
      body: `## 1.1 The Dream World

You're living in a dream world.

I'm not making this claim to be provocative, funny, or in an Orwellian attempt to inspire distrust in your own senses, but to raise an important point that I hope will offer you a new perspective on your own interaction with reality.

The systems behind our cognition, consciousness, and perception have evolved for us to survive in a specific environment — that of Earth. As a species (as far as we know), we have never been exposed to an environment other than that on Earth for a period longer than a year…

## 1.2 The Exponential Shift

This argument extends to our cognition and perception as well. Earth has presented life with a certain set of environmental characteristics, and life has had to evolve to fit those characteristics specifically. But evolution isn't solely about the physical environment — social structures play an enormous role in how communities evolve…

## 1.3 The Peppered Moth

In 1848, R.S. Edleston, an English naturalist, stumbled upon a fascinating discovery right in the heart of Manchester, England. A moth resting on a nearby tree had caught his eye…`,
    },
    {
      id: "draft-wfa-02",
      project: "weakest-form",
      title: "Chapter 2 — The Exponential Shift",
      updated: "11 Apr",
      words: 5104,
      status: "edited",
      body: `The curve along the axis of change in evolutionary drivers has become exponential, while we were built for linear. If human evolution is a person walking steadily across a continent, technological progress started as a horse-drawn carriage, became a sports car, and is now a rocket ship accelerating away from the walker…`,
    },
    {
      id: "draft-wfa-03",
      project: "weakest-form",
      title: "Chapter 3 — The Peppered Moth",
      updated: "04 Apr",
      words: 3911,
      status: "draft",
      body: `A decades-long march from rarity to ubiquity, charted against the rise of coal ash. The moth didn't change — the backdrop did.`,
    },
    {
      id: "draft-wfa-06",
      project: "weakest-form",
      title: "Chapter 6 — Bending the Arc",
      updated: "28 Mar",
      words: 4585,
      status: "draft",
      body: `Closing movement. What does it mean to make art when the ground itself is moving faster than we can adapt to it?`,
    },
  ],

  voiceProfiles: [
    {
      id: "voice-climber",
      name: "Climber",
      updated: "10 Apr",
      samples: 1,
      words: 110,
      avgSentence: 15.7,
      sentenceVariation:
        "Dynamic mix of short, grounding statements and rhythmic, flowing observations.",
      vocabulary:
        "Sensory, visceral, elemental, and spiritually evocative (granite, void, prayer, pulpit).",
      punctuation:
        "Commas for rhythmic tricolon lists (the breath, the grip, and the void) and appositives to build momentum.",
      indicators:
        "Direct, confident, philosophical. Frequent metaphors linking the physical to the spiritual. Shifts into second person for inclusivity.",
      tone: "Meditative, intense, reverent, deeply introspective.",
    },
    {
      id: "voice-analytical",
      name: "Analytical",
      updated: "02 Apr",
      samples: 4,
      words: 2840,
      avgSentence: 22.3,
      sentenceVariation:
        "Long, clause-dense sentences interleaved with sharp declaratives for emphasis.",
      vocabulary:
        "Precise, referential, systems-oriented (evolutionary, exponential, modality).",
      punctuation:
        "Em-dashes and parentheticals for sidebars; semicolons to chain reasoning.",
      indicators:
        "Builds from first principles, invites the reader into the argument, never moralizes.",
      tone: "Curious, rigorous, restrained.",
    },
  ],

  research: [
    {
      id: "research-vv-meditation",
      project: "vertical-void",
      title: "Mindfulness in Extreme Environments",
      date: "12 Apr 2026",
      sources: 14,
      summary: "Survey of literature on flow states, risk-induced presence, and meditative absorption in high-stakes physical activity. Connects Csikszentmihalyi's flow model to the attentional demands of alpine climbing.",
      body: `## Overview

Fourteen peer-reviewed studies and two book-length treatments were reviewed for this report. The central finding: extreme physical risk functions as a forced attentional anchor, producing states phenomenologically similar to advanced meditative absorption.

## Key Sources

**Csikszentmihalyi, M. (1990). Flow: The Psychology of Optimal Experience.**
Flow requires a precise match between challenge and skill. Alpine routes at the edge of a climber's ability create sustained flow windows unavailable in safer pursuits.

**Rheinberg, F. & Engeser, S. (2018). Intrinsic Motivation and Flow.**
Distinguishes flow from mere concentration. The self-referential internal monologue — the primary obstacle in meditation — is suppressed under acute risk.

**De Manzano, Ö. et al. (2010). The psychophysiology of flow during piano playing.**
Autonomic markers of flow (reduced heart rate variability, narrowed sympathetic activation) mirror those documented in expert meditators during samadhi states.

## Synthesis

The "forced presence" argument is well-supported. The risk vector uniquely suppresses default mode network activity — a finding consistent across fMRI studies of both advanced meditators and elite athletes during competition. The solo condition amplifies this: without partners to offload attention, the climber's awareness cannot distribute. It must collapse inward and forward simultaneously.

## Gaps

No studies directly compare solo vs. roped climbing on presence metrics. This is a clear empirical gap the book could name explicitly.`,
    },
    {
      id: "research-wfa-mismatch",
      project: "weakest-form",
      title: "Cognitive Mismatch Hypothesis",
      date: "28 Mar 2026",
      sources: 22,
      summary: "Literature review on evolutionary psychology, environmental mismatch, and behavioral adaptation timescales. Grounds the 'alien environment' frame in empirical cognitive science.",
      body: `## Overview

This report consolidates 22 sources across evolutionary psychology, cognitive science, and anthropology to support the book's core argument: human cognition evolved for an environment that no longer exists, and the resulting mismatch underlies most modern pathology — including our relationship to art.

## Key Sources

**Li, N.P. et al. (2018). Mismatch and the modern world.**
Comprehensive review of evolutionary mismatch across domains: diet, social structure, sleep, reproduction, and cognition. Establishes the conceptual vocabulary the book can borrow directly.

**Richerson, P. & Boyd, R. (2005). Not by genes alone.**
Cultural evolution operates on timescales orders of magnitude faster than genetic evolution. The gap between "hardware" and "software" is the mismatch the book describes.

**Haidt, J. (2012). The Righteous Mind.**
Moral intuitions are evolutionary residue operating in environments they were not designed for. Relevant to the chapter on propaganda.

## The Peppered Moth Literature

The classic Biston betularia studies (Kettlewell 1955; Majerus 2009 replication) remain the clearest example of environment-driven phenotypic selection within a human lifetime. Majerus's 2009 replication fully restores the scientific standing of the story.

## Synthesis

The mismatch frame is robust and well-evidenced. The book's contribution is applying it to aesthetic production and reception — territory the academic literature has not mapped with any specificity.

## Gaps

Limited empirical literature on art specifically as a mismatch signal. The argument will need to be built analogically from the stronger evidence in other domains.`,
    },
  ],

  debates: [
    {
      id: "debate-vv-01",
      project: "vertical-void",
      title: "Is solo mountaineering genuinely meditative, or merely dangerous?",
      date: "14 Apr 2026",
      thesis: "Solo mountaineering constitutes a legitimate meditative practice — not metaphorically, but structurally.",
      outcome: "Thesis held — risk-as-anchor argument strengthened",
      summary: "Stress-tested the core claim against counterarguments about ego inflation, death anxiety, survivorship bias, and the objection that danger is antithetical to equanimity.",
      body: `## Thesis
Solo mountaineering constitutes a legitimate meditative practice — not metaphorically, but structurally.

## Round 1 — The Ego Objection

**Against:** Meditation aims to dissolve ego. Summit culture inflates it. The lone summit is a performance of self, not an erasure of it.

**Defense:** This conflates the goal of meditation with its mechanism. The mechanism is attentional collapse — the suppression of the default mode network's self-referential chatter. This suppression occurs under acute risk regardless of what the climber intends. The ego inflation comes after, in the telling. On the wall, the self is quieted by necessity.

**Verdict:** Objection fails. Post-hoc ego inflation doesn't retroactively alter the phenomenological state on the wall.

## Round 2 — The Death Anxiety Objection

**Against:** Fear of death is the opposite of meditative equanimity. A climber gripped with fear is not meditating; they are panicking.

**Defense:** The experienced alpine soloist is not gripped with fear — they are working. The anxiety is transformed by competence into attention. Beginners on dangerous terrain are afraid. Experts are present. The practice develops the capacity to convert threat into focus.

**Verdict:** Objection fails for skilled practitioners, holds for novices. Book should name this explicitly: this is an advanced practice, not a beginner's path.

## Round 3 — Survivorship Bias

**Against:** The argument is only made by those who survived. The dead can't confirm that their final moments were meditative. This is selection bias masquerading as evidence.

**Defense:** Acknowledged. The book doesn't claim solo climbing is safe or universally accessible. It claims that for practitioners who have developed the requisite skill, the practice reliably produces meditative states. Survivorship bias is a valid epistemological caveat, not a refutation of the phenomenological claim.

**Verdict:** Partial concession. The book should own this caveat explicitly rather than dodge it.

## Summary

Thesis held. The death anxiety objection sharpened the argument: the key variable is competence-mediated transformation of threat into presence. The survivorship bias point should be integrated into the text as intellectual honesty rather than elided.`,
    },
    {
      id: "debate-wfa-01",
      project: "weakest-form",
      title: "Is art the weakest or the strongest response to civilizational mismatch?",
      date: "05 Apr 2026",
      thesis: "Art is the weakest, most honest record of human drift from evolutionary niche.",
      outcome: "Partial — 'weakest' reframed as diagnostic, not pejorative",
      summary: "Challenged whether 'weakest' carries the right connotation when art may be the only medium honest enough to register what other systems suppress.",
      body: `## Thesis
Art is the weakest, most honest record of human drift from evolutionary niche.

## Round 1 — Weakest is the Wrong Word

**Against:** 'Weakest' implies inadequacy. But if art is the most honest signal of mismatch, it's also the most valuable. The book inadvertently diminishes what it's trying to defend.

**Defense:** 'Weakest' is intentionally provocative. The claim is that art has the least institutional power — least ability to change material conditions, organize labor, redirect capital. Compared to policy, medicine, religion, or economics, art is weak in the sense that it cannot compel. It can only witness.

**Verdict:** Clarification needed. The book must define 'weakest' precisely on first use or risk the word doing unintended damage to the argument.

## Round 2 — Art as Propaganda Refutes the Thesis

**Against:** Chapter 4 is about art as propaganda — art weaponized to suppress rather than reveal mismatch. If art can be the bottleneck through which distorted reality flows, it is not honest. The thesis is self-contradicting.

**Defense:** The book distinguishes art that serves power from art that serves perception. Propaganda is art captured by institutional interests. The claim is about art in its uncaptured state — which is precisely why it's weak. It has no institutional protection. The moment it gets institutionalized, it becomes propaganda.

**Verdict:** Objection valid. The book needs a cleaner working definition of 'art' that explicitly excludes or contextualizes state-captured aesthetic production.

## Round 3 — Is Honesty a Virtue in a Mismatch World?

**Against:** If the human cognitive system is mismatched to its environment, human art — produced by the same mismatched cognition — is also distorted. It doesn't record the mismatch honestly; it reproduces the distortion.

**Defense:** This is the book's deepest tension and should be surfaced, not resolved. Art doesn't transcend the mismatch; it is produced within it. Its honesty is not objective accuracy but comparative — it is more honest than propaganda, more honest than advertising, more honest than political language, because it has less to protect.

**Verdict:** This objection is the most productive. It should become a section of the book, not a problem to be solved.

## Summary

'Weakest' needs definitional work. The propaganda chapter creates genuine tension with the honesty claim that the book can resolve by distinguishing captured from uncaptured art. The deepest objection — that mismatch-produced art can't accurately represent mismatch — is generative and should be owned.`,
    },
  ],

  world: [
    {
      id: "world-vv-characters",
      project: "vertical-void",
      type: "Characters",
      title: "The Climber (POV)",
      updated: "08 Apr",
      body: `A first-person composite, not a single named figure. Works in construction or trade — hands that know both rope and tool. Has lost someone to the mountain but does not moralize about it.`,
    },
    {
      id: "world-vv-settings",
      project: "vertical-void",
      type: "Settings",
      title: "The Wall — El Capitan, Freerider",
      updated: "08 Apr",
      body: `Granite, 3,000 vertical feet. The pitches are named and referenced throughout: Freeblast, Hollow Flake, Monster Offwidth, The Boulder Problem, Round Table.`,
    },
    {
      id: "world-wfa-glossary",
      project: "weakest-form",
      type: "Glossary",
      title: "Terms of Art",
      updated: "15 Mar",
      body: `**Alien environment** — any context that exceeds the adaptive window of the perceiver.\n**Evolutionary drift** — the widening gap between niche and nicher.\n**The Bottleneck** — the moment a medium collapses into a single dominant channel.`,
    },
  ],
};
