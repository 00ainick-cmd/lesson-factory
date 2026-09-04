# 03 · Frameworks

## Why frameworks matter

A framework is a tested structure for arranging learning content. The system uses 9 frameworks because each one solves a specific problem better than improvising would. Picking the right framework for the archetype is part of the design work; using the wrong framework (or none) produces training that works only by accident.

The frameworks live at different levels of abstraction. Some span every archetype (Mayer's multimedia principles). Some apply to a specific archetype family (4C/ID for procedural mastery). Some are diagnostic tools used during design rather than structural patterns applied during build (Bloom's revised taxonomy).

## The nine frameworks

### F01 · Merrill's First Principles of Instruction

**Origin:** M. David Merrill, 2002. Synthesis of common patterns across effective instructional design theories.

**The principles:** Learning is promoted when
1. The learner is engaged in solving real-world problems (Problem-Centered)
2. Existing knowledge is activated as a foundation (Activation)
3. New knowledge is demonstrated to the learner (Demonstration)
4. New knowledge is applied by the learner (Application)
5. New knowledge is integrated into the learner's world (Integration)

**Default for:** 2B (Linear Explainer), 3A (Worked Example Sequence), 3D (Coaching Loop). Also defends the narrative-training-module-builder pattern against ID reviewers.

**Working use:** This is the framework to point to when an ID reviewer asks where the rigor is. Every section of a well-built module maps to at least one Merrill principle. The narrative format satisfies Merrill more rigorously than most lecture-and-quiz modules; the mapping is documented in the narrative skill's references.

**What it does not do:** Specify sequencing. Merrill says all five must be present; it does not say they must come in order. The walk-through format puts Demonstration before Application explicitly, but the Decision (a form of Application) is also present earlier when the learner makes scenario choices.

### F02 · Gagne's Nine Events of Instruction

**Origin:** Robert Gagne, 1965. Information-processing model of learning.

**The nine events:**
1. Gain attention
2. Inform learners of objectives
3. Stimulate recall of prior learning
4. Present the content
5. Provide guidance
6. Elicit performance (practice)
7. Provide feedback
8. Assess performance
9. Enhance retention and transfer

**Default for:** 2B (Linear Explainer). The canonical SCORM module structure.

**Working use:** The reference shape for traditional structured e-learning. Most LMS-delivered content uses Gagne whether the authors know it or not. When a project must work inside the AERO pipeline (Articulate Rise, SCORM, Thinkific assembly), Gagne is the spine.

**Tradeoff with Merrill:** Gagne is more prescriptive about sequence; Merrill is more flexible about format. A linear explainer built on Gagne will hit Merrill's principles; a walk-through built on Merrill will not necessarily hit all of Gagne's events in order. That is fine; the archetype determines which framework is foreground.

### F03 · 5E Learning Cycle

**Origin:** Biological Sciences Curriculum Study (BSCS), 1980s. Originally developed for science education.

**The five Es:**
1. **Engage** · hook prior knowledge, surface the question
2. **Explore** · learner-led investigation, productive struggle
3. **Explain** · introduce vocabulary and concepts after exploration
4. **Elaborate** · apply to a new context
5. **Evaluate** · assess transfer

**Default for:** 2C (5E Learning Cycle archetype, instructor-led).

**Working use:** Constructivist sequence where the learner discovers principles before being told them. Requires intermediate learners with some prior schema; novices need more scaffolding. Best used in instructor-led settings where the Explore phase can be genuinely open.

**Common failure mode:** Disguised direct instruction in 5E clothing. Engage that is just "look at this slide" and Explore that is actually a closed task with one right answer is not 5E; it is Gagne wearing different costume.

### F04 · Bloom's Revised Taxonomy

**Origin:** Anderson and Krathwohl, 2001, revising Bloom 1956.

**The six levels:**
1. Remember
2. Understand
3. Apply
4. Analyze
5. Evaluate
6. Create

**Default for:** None directly. Used as a diagnostic across all archetypes for objective writing.

**Working use:** When writing the learning objective for a project, the verb in the objective tells you which Bloom level you are aiming at. The level should match the cognitive goal: Know It objectives use Remember-level verbs; Understand It objectives use Understand and Analyze verbs; Do It objectives use Apply verbs; Decide It objectives use Evaluate verbs; Become It objectives use Create verbs in the broad sense (creating a new self-conception).

**What it does not do:** Specify format. Bloom tells you what kind of cognition the learner needs to engage in; it does not tell you how to elicit that cognition.

### F05 · Mayer's Multimedia Principles

**Origin:** Richard Mayer, accumulated since 1990s. Empirical work on cognitive load and dual-channel processing.

**Key principles (operational subset):**
- **Coherence** · cut extraneous material, even attractive material
- **Signaling** · highlight essential information
- **Redundancy** · do not pair on-screen text with identical narration
- **Spatial Contiguity** · place words near their corresponding images
- **Modality** · spoken words plus images, not on-screen text plus images
- **Personalization** · conversational voice, second-person address
- **Pre-training** · introduce key terms and components before the main lesson

**Default for:** 2A (Visual Learning Piece), 2D (Audio Explainer), 3C (Performance Demonstration). A lens applied across every archetype.

**Working use:** These are the principles that prevent multimedia training from sabotaging itself. The most violated principle in corporate e-learning is Redundancy (slides full of bullet points being read aloud). The most exploited principle in this system is Pre-training (the primer phase in narrative modules, the cover stats block in visual learning pieces).

**Tradeoffs:** The principles have boundary conditions. Personalization works for adult learners; with experts, conversational tone can feel patronizing. Modality assumes the audio channel is available; an audio-disabled context inverts the rule.

### F06 · 4C/ID (Four-Component Instructional Design)

**Origin:** Jeroen van Merriënboer, 1997.

**The four components:**
1. **Learning Tasks** · authentic whole-task practice
2. **Supportive Information** · the "why" and "how" for problem solving
3. **Procedural Information** · just-in-time how-to for routine steps
4. **Part-Task Practice** · drill for sub-skills that need to become automatic

**Default for:** 3B (Simulation/Sandbox) and complex 3A (Worked Example Sequence) for whole-task procedural learning.

**Working use:** When the cognitive goal is mastery of a complex task that combines multiple sub-skills, 4C/ID is the right structure. Avionics troubleshooting fits well; calibrating an oscilloscope fits well; running a sales discovery call fits well. Less applicable when the task is single-skill or conceptual.

**What it does not do:** Cover the affective dimension. 4C/ID is purely cognitive; pairing with reflection or coaching is needed when identity or motivation is in scope.

### F07 · Cognitive Apprenticeship

**Origin:** Allan Collins, John Seely Brown, Susan Newman, 1989. Synthesis of master-apprentice practices for cognitive (rather than physical) skills.

**The six methods:**
1. **Modeling** · expert demonstrates with thinking visible
2. **Coaching** · expert guides as learner attempts
3. **Scaffolding** · supports that fade as competence grows
4. **Articulation** · learner explains their reasoning aloud
5. **Reflection** · learner compares their performance to expert performance
6. **Exploration** · learner pursues their own problems

**Default for:** 3C (Performance Demonstration), 3D (Coaching Loop). Crosses into worked example design.

**Working use:** The framework for any procedural learning where expert reasoning is the actual content. Reading a wiring diagram. Diagnosing a fault. Constructing a citation. The expert's invisible cognition has to be made visible, then progressively withdrawn as the learner internalizes it.

**Common failure mode:** Modeling without thinking-aloud. A video of an expert performing the task without narrated reasoning is demonstration but not cognitive apprenticeship. The learner sees what to do but not why; transfer suffers.

### F08 · Mastery Learning

**Origin:** Benjamin Bloom, 1968. Operationalized through Keller's PSI and many subsequent variants.

**The structure:**
1. Define objectives
2. Teach to mastery, not seat time
3. Formative assessment between segments
4. Corrective instruction for misses
5. Re-test until proficient
6. Move on only when mastery is demonstrated

**Default for:** 3D (Coaching Loop). Structural for any high-stakes performance training.

**Working use:** When competence matters more than completion. CAET certification, Part 145 sign-off authority, anything where the learner will be held to the standard in the field. Mastery learning means "you can keep practicing until you have it," which is the opposite of the typical "you have three tries and then you fail" model.

**Production cost:** High. Each formative assessment needs corrective branches, alternative explanations, additional practice. The skill that builds it (Coaching Loop) has not been built yet and is queued for future work.

### F09 · Universal Design for Learning (UDL)

**Origin:** CAST (Center for Applied Special Technology), 1990s. Drawing on universal design in architecture.

**The three principles:**
1. **Multiple Means of Engagement** · the why of learning, motivation
2. **Multiple Means of Representation** · the what of learning, content
3. **Multiple Means of Action and Expression** · the how of learning, demonstration

**Default for:** None specifically. A lens applied across every archetype.

**Working use:** UDL is the framework that drives the accessibility requirements in this system. Aria attributes. Reduced-motion respect. Always-visible text alongside audio. Contrast minimums. Multiple paths to the same content. Not a checklist; a design philosophy that says learners are diverse and the format should accommodate that diversity from the start, not as remediation.

**What it does not do:** Specify content or sequence. UDL constrains the format; it does not generate the format.

## How frameworks interact

The frameworks are not mutually exclusive. A single project may use:

- Merrill's First Principles to structure the high-level arc
- Gagne's Nine Events for the sequencing within a specific section
- Mayer's principles to govern every multimedia choice
- UDL to ensure accessibility
- Bloom's taxonomy to validate the objective writing

This is normal. The architect-level question is which framework is foreground (the one driving the structural decisions) and which are background (the ones acting as lenses or checks).

The training-architect skill names the foreground framework in the build plan. The background frameworks are applied implicitly by following the craft principles in the relevant builder skill.

## When to invent

The 9 frameworks above cover the working needs of this system. New frameworks should not be invented; they should be discovered in the literature and incorporated only when they solve a problem the existing 9 do not.

Two examples of frameworks deliberately not in this list:

- **ADDIE** (Analysis, Design, Develop, Implement, Evaluate). A process model, not an instructional framework. Useful for project management; not useful for structuring learning content.
- **Bloom's affective taxonomy.** Receiving, responding, valuing, organizing, characterizing. Genuinely useful for BECOME IT projects but rarely operational in the formats this system uses. May earn a slot in the future if a structured reflection or story-first build benefits from it.

## See also

- `01-cognitive-goals.md` for the goal taxonomy that determines which framework foregrounds
- `02-archetypes.md` for the archetype-to-framework default mapping
- `04-research-foundations.md` for the underlying studies these frameworks rest on
