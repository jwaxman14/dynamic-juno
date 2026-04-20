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
