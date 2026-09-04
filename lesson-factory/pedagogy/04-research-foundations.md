# 04 · Research Foundations

This file is the **working knowledge layer**, not a research bibliography. The effects and studies named here actually inform decisions in the system. If a finding is interesting but not load-bearing for a real decision, it does not belong here.

Treat this file as a reference for understanding why the system works the way it does. The catalog and the builder skills implement these findings; this file explains what they are implementing.

## The high-leverage effects

### The Testing Effect (Retrieval Practice)

**The finding:** Attempting to recall information from memory strengthens retention more than re-studying the same material. The act of retrieval IS the learning event, not a check on prior learning.

**Key sources:** Roediger and Karpicke 2006 ("Test-enhanced learning"). Karpicke and Blunt 2011 ("Retrieval practice produces more learning than elaborative studying").

**What this drives:** The Flash Drill (1A) and Spaced Review (1B) archetypes. The hypothesis-before-reveal pattern in case studies and walk-throughs. The predict-then-reveal blocks in visual learning pieces. Every time a build asks the learner to commit to an answer before reading the right answer, it is exploiting the testing effect.

**Implication:** A format that lets the learner see the right answer before attempting recall has wasted the most powerful learning mechanism available.

### The Spacing Effect

**The finding:** The same total study time produces dramatically better long-term retention when distributed across days or weeks than when massed into a single session. The "forgetting curve" is reset by each retrieval; intentional spacing exploits the resets.

**Key sources:** Ebbinghaus 1885 (the original forgetting curve work). Cepeda et al. 2008 (meta-analysis of spacing studies in cognitive psychology).

**What this drives:** The Spaced Review (1B) archetype. The recommended schedule of day 7, day 21, day 60, day 180 for follow-up reviews after any major training event.

**Implication:** Shipping a single training event without a retention plan is leaving 50-80% of the learning on the table at the 30-day mark.

### The Worked Example Effect

**The finding:** Novice learners learn procedural skills faster from studying worked examples (expert solutions with reasoning visible) than from solving problems unsupported. The effect is large for novices and reverses for experts.

**Key sources:** Sweller and Cooper 1985 ("The use of worked examples as a substitute for problem solving"). Atkinson, Derry, Renkl, and Wortham 2000 (meta-analysis).

**What this drives:** The Worked Example Sequence (3A) archetype. The pattern of expert-with-reasoning, then expert-with-partial-scaffolding, then learner-with-prompts, then learner-alone. The "show the thinking, not just the answer" rule.

**Implication:** For a novice audience, leading with problem-solving instead of worked examples produces frustrated learners and weak transfer. Save discovery learning for intermediate audiences who have the schema to make it productive.

### The Expertise Reversal Effect

**The finding:** Instructional methods that benefit novices often hinder experts, and vice versa. Worked examples help novices and bore experts. Open exploration helps experts and frustrates novices. The "right" instructional method depends on where the learner is.

**Key sources:** Kalyuga 2007 ("Expertise reversal effect and its implications").

**What this drives:** The recommendation throughout the catalog to identify audience expertise level in Phase 3 of the design interview before selecting the format. The same archetype may produce strong results for one audience and weak results for another.

**Implication:** "Best practice in instructional design" is contingent on audience. Pick the practice that matches the audience, not the one that wins at conferences.

### Cognitive Load Theory

**The finding:** Working memory is limited. Learning fails when the load exceeds capacity. There are three load types: intrinsic (the material itself), extraneous (the way it's presented), and germane (the cognitive work of building schemas). Reduce extraneous, manage intrinsic, support germane.

**Key sources:** Sweller, van Merriënboer, and Paas 1998 ("Cognitive architecture and instructional design"). Ongoing work by Sweller and colleagues.

**What this drives:** The single-idea-per-section rule. The Pre-training principle in Mayer's multimedia work. The 4C/ID framework. The decision to limit voice utterances to one breath per line in narrative modules. The "one hero stat, one pull quote per section" rule in visual learning pieces.

**Implication:** A format that fills every section with multiple ideas, multiple visuals, multiple competing demands is sabotaging learning. Less is more is not aesthetic preference; it is cognitive necessity.

### The Modality Effect

**The finding:** Information presented in matched visual and auditory channels is learned better than information presented in two visual channels. On-screen text plus narration of that same text is worse than image plus narration.

**Key sources:** Mayer and Moreno 2003 ("Nine ways to reduce cognitive load in multimedia learning"). Mayer 2009 (synthesized in "Multimedia Learning").

**What this drives:** The decision to NOT read on-screen text aloud in narrative modules. The audio explainer archetype's pairing of audio with visual companions (rather than transcripts). The pre-training principle: introduce vocabulary visually first, then audio can reference it without redundancy.

**Implication:** Reading the slide is worse than not reading the slide. The audio channel should carry what the visual channel cannot: tone, emphasis, pacing, the implicit narrator's perspective.

### Dual Coding

**The finding:** Information encoded in two distinct cognitive systems (verbal and visual) is remembered better than information encoded in only one. The two systems support each other in retrieval.

**Key sources:** Paivio 1971 ("Imagery and verbal processes"), updated work through 1990s.

**What this drives:** The visual learning piece archetype, which deliberately pairs verbal explanation with visual representation throughout. The concept map pattern. The bio card pattern. The illustrated worked example block.

**Implication:** Text-only training is leaving retrieval pathways unused. The right visual is not decoration; it is a second encoding pathway.

### Narrative Transportation

**The finding:** Readers and viewers who become "transported" into a narrative are more persuaded by its content than readers presented with the same content as argument. Identification with characters specifically reduces counter-arguing.

**Key sources:** Green and Brock 2000 ("The role of transportation in the persuasiveness of public narratives"). Cohen 2001 (work on identification with media characters).

**What this drives:** The Walk-Through (4B) and Story-First Module (5A) archetypes. The decision to use second-person voice in walk-throughs. The reflection-before-the-lesson moment that forces the learner into the protagonist's cognitive position before being told the principle.

**Implication:** For BECOME IT and DECIDE IT goals, narrative is not entertainment; it is the most efficient persuasive format available. The walk-through teaches values and judgment more effectively than a bullet list could.

### Productive Failure

**The finding:** Learners who attempt complex problems before being taught the solution (and fail), then receive instruction, learn the material more deeply than learners who receive instruction first.

**Key sources:** Kapur 2008 ("Productive failure"). Subsequent work through 2010s.

**What this drives:** The 5E Learning Cycle (2C) archetype's Explore phase. The hypothesis-before-reveal pattern. The decision to put the "what would you do" prompt before the principle in walk-throughs.

**Implication:** Productive failure requires intermediate learners who have enough schema to fail productively. With true novices, the productive failure becomes destructive failure and produces frustration without learning. The Expertise Reversal Effect applies.

### Deliberate Practice

**The finding:** Expertise comes from practice that specifically targets weaknesses with immediate feedback. Hours of unfocused practice produce far less skill than hours of structured practice with corrective feedback.

**Key sources:** Ericsson 1993 (the foundational paper, often cited as "10,000 hours" though Ericsson's actual claim was more nuanced). Updated work through "Peak" 2016.

**What this drives:** The Coaching Loop (3D) archetype. The Performance Demonstration (3C) archetype's self-assessment rubric. The general principle that practice without feedback is not training.

**Implication:** Any DO IT project that does not include feedback on learner attempts is hoping for transfer rather than producing it.

### Cognitive Flexibility

**The finding:** Knowledge that will be applied in varying contexts must be encoded with that variability from the start. Single-case instruction produces rigid knowledge that does not transfer.

**Key sources:** Spiro 1988 (cognitive flexibility theory). Work on case-based reasoning in legal and medical education.

**What this drives:** The Case Study Investigation (4C) archetype's emphasis on multiple cases. The Scenario Branch (4A) archetype's multiple scenario variations. The general principle that one case teaches one decision; pattern recognition requires several.

**Implication:** A case study with one case is a story, not training. Pattern recognition requires three or more cases that share the underlying principle while varying in surface features.

## Effects that inform but are not load-bearing

A few effects appear in the working knowledge but do not drive specific archetype decisions:

- **Self-explanation effect** (Chi 1994): Learners who explain content to themselves remember more. Drives the articulation principle in cognitive apprenticeship.
- **Generation effect** (Slamecka and Graf 1978): Self-generated material is remembered better than presented material. Drives the commitment textareas and reflection prompts.
- **Levels of processing** (Craik and Lockhart 1972): Deeper processing produces better retention than shallow processing. A useful frame; not directly operational.
- **Schema theory** (Bartlett 1932 and onward): Knowledge is organized in schemas; new information attaches better when the relevant schema is activated. Drives the activation move in narrative module primers.

## The shape of the literature

A few honest observations about what this research base does and does not establish:

**The effects are real but the effect sizes vary.** "Spaced practice produces 50-100% better long-term retention" is a meta-analytic estimate; specific contexts produce smaller or larger effects depending on content type, audience, and conditions. The system uses these effects as design heuristics, not as guarantees of specific gains.

**The classic studies are largely from psychology lab settings.** Many findings have been replicated in classroom and corporate settings; some have been challenged in those settings. The translation from lab to applied context is not automatic.

**Recent decades have produced replication concerns in psychology broadly.** Some findings in this list are well-replicated (testing effect, spacing effect, worked example effect, cognitive load theory). Others are more contested or have been refined. The system uses the well-replicated findings as primary; the contested findings as secondary considerations.

**Research is not the whole story.** Production craft, audience research, and practical constraints often matter more than which study you cite. The frameworks and effects above are the foundation; what is built on the foundation is shaped by other factors documented in `05-craft-principles.md` and `06-design-decisions.md`.

## See also

- `01-cognitive-goals.md` for the goal taxonomy these effects inform
- `02-archetypes.md` for the format choices these effects justify
- `03-frameworks.md` for the structural frameworks built on these findings
- `06-design-decisions.md` for how these foundations have actually been applied
