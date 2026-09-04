# 07 · Vocabulary

Terms used in this system with specific meanings. Some of these words mean different things elsewhere. When in doubt about a term, check here first.

The terms are organized by what they apply to: cognitive goals, formats, content production, file organization.

---

## Cognitive goal terms

**Cognitive goal.** One of the five high-level outcomes the system tracks: Know It, Understand It, Do It, Decide It, Become It. See `01-cognitive-goals.md`. Distinct from "learning objective" (which is project-specific) and "mastery criterion" (which is the test of success). Every project lives in one primary goal.

**Mastery criterion.** The observable evidence that the learner has succeeded. Specific to a project. "The learner can recall the correct citation for a TCAS RA event under 5 seconds without lookup" is a mastery criterion. "The learner understands TCAS" is not (no observable evidence).

**Learner.** The person consuming the training. In this system, "learner" usually means a CAET candidate, an avionics technician, a Cadiz Sentinel reader, or Nick himself. The term is generic enough to cover all these.

**Transfer.** The ability to apply the learning in a context different from the one in which it was taught. A module that produces transfer is one where the learner uses the skill in their actual work, not just in the test that follows the module.

---

## Format and archetype terms

**Archetype.** A recurring format pattern. The system uses 16. See `02-archetypes.md` for the test of what qualifies. Not synonymous with "format" (a broader term that includes ad-hoc combinations). Not synonymous with "template" (a specific implementation of an archetype).

**Format.** The general way a module is structured. Includes archetypes plus their variants and combinations. "Walk-through with embedded comparison block" is a format; the underlying archetype is 4B Walk-Through.

**Blend.** A deliberate combination of 2-3 archetypes orchestrated for a specific learning goal. Six common blends are documented in the catalog. A blend is not a new archetype; it is a sequence of existing archetypes.

**Walk-through (4B).** Second-person immersive narrative format where the learner experiences a decision moment as if they were the protagonist. The Lake module is a walk-through. Distinct from scenario branch (different in voice and learning mechanism) and from case study (different in cognitive demand: walk-through teaches by feeling, case study teaches by analyzing).

**Scenario branch (4A).** Third-person decision tree with functional consequences. The learner sees the situation from outside and chooses actions for a protagonist. Distinct from walk-through (different perspective and engagement style).

**Case study (4C).** Real incident analyzed for transferable judgment. The learner investigates evidence, forms hypotheses, compares to actual outcome. Distinct from walk-through (the case study is analytical, the walk-through is experiential, even when based on the same source material).

**Story-first module (5A).** Long-form narrative where principles are embedded in characters and events. The reader extracts meaning rather than being told. Different from walk-through (third-person, not second; BECOME IT, not DECIDE IT) and from case study (the story-first module is meant to be read for meaning, not analyzed for decision).

**Visual learning piece (2A).** Magazine-quality interactive HTML reference. The catalog HTML is a visual learning piece. Distinct from linear explainer (different in linearity and gating).

**Linear explainer (2B).** Sequenced lesson with checkpoints. The traditional structured e-learning shape. Distinct from visual learning piece (different in sequencing and return-ability).

**Worked example sequence (3A).** A progression of expert solutions with reasoning visible, faded scaffolding, and transfer practice. Distinct from a single worked example (which is a block, not a sequence).

**Flash drill (1A).** Rapid retrieval practice within a sitting. Distinct from spaced review (which is across sittings).

**Spaced review (1B).** Distributed review across days or weeks following initial learning. Distinct from flash drill (same archetype family, different temporal pattern).

---

## Content production terms

**Skill.** A capability defined by a SKILL.md file plus optional references that Claude reads to perform a specific task. Two skills exist in this system: `training-architect` (the director) and `visual-learning-builder` (the first builder). Twelve more builders are queued.

**Builder skill.** A skill that produces a finished HTML training module. Each builder corresponds to one archetype. The pattern for builder skills is set by `visual-learning-builder` and `narrative-training-module-builder`.

**Director skill.** A skill that coordinates the design process without producing the artifact itself. `training-architect` is the only director skill. It produces build plans, runs audits, and synthesizes across projects.

**Module.** A finished single-file HTML training artifact. Modules are produced by builder skills. Each module implements one archetype (or one blend).

**Example.** An HTML module preserved in the `examples/` folder as a reference for future builds. Each example has a companion `-notes.md` file. Not all modules become examples; only modules that demonstrate something useful for future work.

**Notes file.** A markdown file that accompanies an example HTML file. Documents what works, what does not, what to copy, what to avoid. The notes file is mandatory; no example without notes.

**Build plan.** The structural outline produced by the training-architect in DESIGN mode. Names the archetype, framework, content map, branching map, and visual treatments. Handed to the relevant builder skill in a fresh conversation.

**Audit log.** Post-project capture document produced by the training-architect in AUDIT mode. Names what worked, what failed, surprises, and improvement notes. Saved with the project's other artifacts.

**Synthesis.** Cross-project review produced by the training-architect in SYNTHESIS mode. Reads multiple audit logs, identifies patterns, proposes catalog and skill edits. Does not auto-apply edits.

---

## Framework and pedagogy terms

**Framework.** A tested structure for arranging learning content. The system uses 9. See `03-frameworks.md`. Not synonymous with "archetype" (a format pattern) or "principle" (a learning effect).

**Principle.** A research-backed learning effect. Testing effect, spacing effect, worked example effect, etc. See `04-research-foundations.md`. Principles inform frameworks; frameworks inform archetypes; archetypes inform modules.

**Merrill's First Principles.** Five principles of effective instruction (Problem-Centered, Activation, Demonstration, Application, Integration). Often referred to in this system simply as "Merrill" or "Merrill's principles." See F01 in `03-frameworks.md`.

**Gagne's Nine Events.** Nine sequenced events of instruction. Often referred to as "Gagne's events" or just "Gagne." The canonical SCORM module shape. See F02 in `03-frameworks.md`.

**5E.** The 5E Learning Cycle (Engage, Explore, Explain, Elaborate, Evaluate). When the system says "5E," it specifically means this constructivist sequence, not "five Es" generically.

**Mayer's principles.** Multimedia design principles (coherence, signaling, redundancy, modality, etc.). Often referred to as "Mayer" or "the multimedia principles."

**4C/ID.** Four-Component Instructional Design (van Merriënboer). For whole-task procedural learning. Often referred to by the acronym.

**Cognitive apprenticeship.** Framework for procedural learning emphasizing modeling, coaching, scaffolding, articulation, reflection, exploration. Often referred to by the full name.

**Mastery learning.** Framework where learners advance based on competence, not seat time. Distinct from "mastery" (the state of being competent at something) which is a more general usage.

**UDL.** Universal Design for Learning. Three principles (multiple means of engagement, representation, action/expression). Referred to by acronym.

**Bloom's taxonomy.** The revised version (Anderson and Krathwohl 2001) with six levels (remember, understand, apply, analyze, evaluate, create). When this system says "Bloom," it means the revised taxonomy unless otherwise specified.

---

## Visual and craft terms

**Concept map.** A diagram showing how ideas relate. Distinct from a flowchart (which shows sequence) and a list (which shows enumeration). A concept map is genuinely structural when the visual encoding carries meaning that the list version would not.

**Predict-then-reveal.** A block pattern where the learner is asked to predict an answer before the right answer is shown. Implements the testing effect at the block level. Used inside visual learning pieces, case studies, and other formats.

**Voice line.** The pivot utterance in a narrative module. A short, memorable line the protagonist or mentor figure says aloud. See `voice-script-patterns.md` for the rules. Distinct from "voiceover" (which is a recording mode) and "narrator" (which is the entity speaking).

**Hero stat.** A single large numeric callout that anchors a section visually. Limited to one per section (the "one hero stat per section" rule).

**Pull quote.** A typographic block extracting a memorable sentence from the prose. Limited to one per section.

**Bio card.** A character-introduction card pattern with photo (or styled placeholder), name, role, and brief context. Used in primer phases and aftermath sections.

**Portrait card with AI prompt drawer.** A styled placeholder pattern that includes an expandable section containing an AI image generation prompt. The consumer can use the prompt to generate a real photo if they want one. Solves the "we need to represent this person without faking their likeness" problem.

**Document card.** An evidence-presentation pattern with a dark header (file number, source) and a body containing the evidence. Used in case studies and investigation aesthetics.

**Cockpit display panel.** A specific visceral opening pattern from The Lake module showing warning indicators. Note: this is a walk-through specific pattern. It does NOT belong in case studies or other formats.

**Investigation file aesthetic.** A visual language using document cream backgrounds, ink-black text, evidence-red accents, typewriter font for evidence quotes, and document-card patterns. Belongs to case studies and similar analytical formats.

---

## File and folder terms

**Bundle.** The complete folder of resources for handing off the e-learning system between conversations. Contains skills, examples, reference materials, and foundation documents.

**Reference folder.** The `reference/` folder at the top level of the bundle. Contains operational documents (catalog, archetype-skill-map, design-system, craft-principles, interview-script) that the skills use directly.

**Foundation folder.** The `foundation/` folder at the top level of the bundle. Contains the working knowledge layer: why things are the way they are. Different from the reference folder (operational) in that the foundation folder is explanatory.

**Project folder.** A folder at `~/OneDrive/Training Projects/[Project Name]/` containing the artifacts of one specific training project: build plan, audit log, finished module, source material.

**SKILL.md.** The file that defines a Claude skill. Contains the frontmatter (name, description) and the instructions Claude follows when the skill is invoked.

**Skill references.** Files inside a skill's `references/` folder that Claude reads as part of executing the skill. References can be templates, examples, design tokens, framework mappings, etc.

---

## Workflow and meta terms

**Reverse engineering (a skill).** The workflow of building an example HTML first, then deriving the SKILL.md and references from the working example. See D03 in `06-design-decisions.md`.

**Design mode.** The training-architect mode that runs the design interview, picks the archetype, and produces a build plan. One of three modes.

**Audit mode.** The training-architect mode that captures what worked and what failed in a completed project. One of three modes.

**Synthesis mode.** The training-architect mode that reads across multiple audits and proposes catalog or skill edits. One of three modes. Run on-demand, not automatically.

**Coach (versus orchestrator).** The current architecture is "coach mode": the training-architect produces plans and the user manually hands them to builders. The future architecture would be "orchestrator mode" where the architect calls builders directly. The system is currently in coach mode by design.

**The chain (of design layers).** The conceptual flow from cognitive goal to archetype to framework to builder skill to module. The chain is what the system architects (the design decisions in `06-design-decisions.md` are choices about how the layers connect).

---

## Terms NOT used in this system (and why)

A few terms common elsewhere that the system avoids:

**Microlearning.** A duration descriptor, not a format. The system describes formats by archetype, not by duration.

**Gamification.** A wrapper concept that does not describe what the learner does. The system describes what learners do (deliberate practice, scenario decision, hypothesis revision) and lets the build skin those activities however the production calls for.

**Engagement.** Too vague to be operational. The system uses specific terms (problem-centered framing, productive struggle, narrative transportation) for the mechanisms that produce what is colloquially called engagement.

**Best practice.** Imprecise. The system uses "default for [archetype]" or "appropriate for [audience]" to be specific about when a pattern applies.

**Modality (in the sense of "training modality").** The system uses "format" or "archetype" instead. "Modality" is reserved for Mayer's modality principle (the dual-channel principle of multimedia learning).

**Methodology.** Too grand for what the system mostly does. The system uses "framework" for structured approaches and "pattern" for recurring moves.

---

## See also

- `01-cognitive-goals.md` through `04-research-foundations.md` for the foundational concepts these terms refer to
- `06-design-decisions.md` for the specific decisions that gave these terms their meanings
- `../reference/catalog.md` for the operational versions of archetype, framework, and blend terms
