# Review: A Beat Typology for Technical Training

Reviewer's report on `chassis/BEAT-TYPES.md`. Findings against revision 1; M0 resolved in revision 2.

## Summary judgment

The document is usable as a design standard and is not yet defensible as a taxonomy. It presents a set of categories as exhaustive and mutually exclusive, and neither property is established. Two of them demonstrably overlap. The phase ordering is asserted with evidential backing that one of the cited sources does not provide and partly contradicts.

The design requirements are the strongest part and would survive review largely intact. The classificatory apparatus around them is the part that needs work.

The single largest gap is not internal to the document. Nothing in this methodology, or in the toolchain built around it, produces evidence that lessons designed this way teach better than the lessons that preceded them.

---

## Major findings

### M0. The prose beat had no type of its own. Resolved in revision 2.

Raised by Nick during review, and the most consequential finding in this report.

Revision 1 folded sustained explanatory prose into a type called Exposition, whose requirements described stating a definition, notation, units and a governing rule. That is the act of fixing terms. It is not the act of building a mental model, which in a technical curriculum is performed by continuous explanatory text developing a mechanism across several paragraphs, in the manner of a NEETS module.

The consequence of the omission was structural rather than cosmetic. A typology that gives Simulation, Practice and Procedure a type each, and gives the explanatory prose a single line inside a definitions type, encodes a hierarchy in which prose is the connective material between interactions. That hierarchy is not supported by the evidence and is the exact inversion that produced the thin lessons the methodology was written to prevent.

**Resolution, applied.** The type has been split. Definition fixes the terms; Explanation develops the mechanism and carries the largest word budget in the lesson at 600 to 1200 words. Explanation is grounded in text coherence research, principally McNamara, Kintsch, Songer and Kintsch (1996), whose finding that low prior knowledge readers learn more from more explicit causal text is the strongest available support for the density standard the library already required on editorial grounds. The typology now has ten types.

**Residual issue.** The split raises the exhaustiveness problem in M1 in a sharper form. A tenth type was discovered by a single expert reading the document once. That is evidence the set was not derived, and it is the strongest argument for performing the corpus coding described below.

### M1. The typology claims properties it does not establish

Section 3 opens with "Every beat in every lesson is one of the nine types." This asserts exhaustiveness. Nothing in the document derives the nine, tests them against a corpus, or demonstrates that a tenth is impossible.

The honest provenance is that the nine were abstracted from one mature course and cross-checked against Gagné and Merrill. That is a legitimate method for producing a working catalog. It does not produce a taxonomy, and the document should not use the register of one.

**Resolution.** Either state the provenance and reclassify the document as a design catalog, open to extension, with a stated procedure for proposing a tenth type; or perform the derivation, which means coding a corpus of existing lessons across at least three domains and reporting inter-rater agreement on type assignment.

### M2. Practice and Procedure are not mutually exclusive, and the document proves it

Procedure is defined by ordered performance where sequence carries consequence. Practice lists `sequence` among its recipes. The safety instantiation "response steps to an electrical contact event ordered where the order carries consequence" appears under Practice, while satisfying Procedure's defining criterion word for word. The electrostatic workstation example appears under Procedure using the `sequence` recipe that the document assigns to Practice.

A designer following this document will assign ordered-task beats inconsistently, and two designers will disagree. That is the operational definition of a failed category boundary.

**Resolution.** Draw the boundary on a criterion that discriminates. The candidate that survives inspection: Procedure involves an instrument or system whose state the action changes and where an incorrect path produces a consequence in that system. Practice involves classification or ordering judged against a rule, with no system state. On that criterion the electrical contact response is Practice, because nothing in the model changes, and the electrostatic workstation is Procedure, because charge accumulates. Then remove `sequence` from one of the two recipe lists.

### M3. The phase order is asserted more strongly than the evidence supports, and one citation cuts against it

Section 2 states the order "is not stylistic" and is "the sequence for which the evidence in section 4 provides support," specifically "present before eliciting performance."

Merrill's principles are not a sequence and Merrill does not present them as one. Gagné's events are commonly sequenced but Gagné permitted reordering by learning type. More seriously, Kapur's productive failure work, cited in 3.5 to support Simulation, is a body of research showing that learners who attempt a problem before receiving instruction outperform learners who receive instruction first. The document cites Kapur in support of a beat while its own phase order contradicts Kapur's central finding.

**Resolution.** Soften the claim to a default ordering with stated rationale, and add an explicit exception: where the objective concerns a relationship the learner holds a strong incorrect intuition about, Simulation may precede Exposition, and the document should say so and cite Kapur for that placement rather than for the beat in general.

### M4. The methodology produces compliance evidence, not learning evidence

Every measurement in the surrounding toolchain answers whether a lesson conforms to this document. None answers whether a learner knows more. The word floors, figure densities, and gate counts are proxies chosen because one lesson that was judged good happened to exhibit them.

A reviewer will ask the obvious question: has a lesson built to this standard been compared against one that was not, on any outcome? At present the answer is no, and the calibration section of the surrounding quality bar reports the typology's agreement with one person's judgment, which is not the same claim.

**Resolution.** State the limitation plainly in section 1. Then instrument the cheapest available outcome: the checkpoint already records per-item responses, so first-attempt item accuracy by objective, compared across lessons built before and after this standard, is obtainable without new infrastructure. It is weak evidence, being immediate rather than delayed, but it is evidence.

### M5. Check is claimed as instruction while functioning as assessment

Section 3.8 opens by asserting the Check is "not a measurement instrument," then specifies a pass threshold that gates lesson completion and reports a score to the learning management system. It is functioning as a mastery gate. The document cannot both disclaim measurement and use the result to control progression and completion reporting.

This matters practically, not just rhetorically. If the beat is instruction, unlimited reattempt is correct and a score is decorative. If it is a mastery gate, then reattempt policy, item exposure, and the defensibility of the threshold all become live questions the document does not address. Four of five is stated without justification.

**Resolution.** Concede the dual function. Specify it as formative assessment with a mastery threshold, justify the threshold or mark it as a provisional convention, and state the reattempt policy and its rationale.

### M6. Spacing is identified as decisive and has no place in the typology

The supporting research file, and section 5 of the pedagogy README, put the retention cost of a single unspaced training event at a substantial fraction of the learning by thirty days. A typology of nine types containing no retention or reactivation type is therefore incomplete by the standard of its own cited evidence.

Deferring this to "a course-level problem" is defensible but must be argued rather than noted in passing, because a reader will observe that the document's own evidence makes spacing more consequential than several types it does include.

**Resolution.** Either add a tenth type for reactivation, scoped to appear in later lessons rather than the originating one, or state explicitly that the typology governs the single lesson as its unit of analysis and that retention is out of scope by definition, and accept the resulting boundary.

---

## Moderate findings

### D1. Word budgets are stated without basis

Exposition is specified at 400 to 700 words. The figure derives from one lesson and a stated preference for manual density. Presented in a numbered requirements list, it reads as a finding. Label the budgets as calibration values from a named reference lesson, adjustable, rather than as requirements.

### D2. The one-interaction rule is contradicted by the reference lesson

Section 3.5 requires one simulation per lesson, on cognitive load grounds. The reference lesson contains both a resistance bench and a manipulable lattice addressing the same concept from a second representation, and it is the lesson the whole methodology treats as the quality bar.

Either the rule is wrong, or the reference lesson violates it and should be documented as doing so. Cognitive load theory does not straightforwardly forbid a second representation; whether the load is extraneous or germane depends on whether the second representation builds the same schema. That is a design judgment the rule currently forecloses.

### D3. Verb-to-type selection breaks on real objectives

The selection procedure maps one performance verb to one applied type. Objective 2.4 in the live registry reads "determine total resistance and total current in series and parallel circuits and identify circuit type from observed behavior." Two verbs, pointing at Simulation and Practice respectively. The procedure gives no rule for decomposition, and a designer will either pick arbitrarily or build both and exceed the lesson.

Add a decomposition step: objectives with multiple performance verbs are split, and the split is recorded, before type selection runs.

### D4. The design is implicitly novice-only

Kalyuga is cited under Demonstration, then not applied. The typology as a whole assumes a first-exposure learner. The CAET population includes returning technicians with substantial field experience, for whom heavy Exposition and Demonstration are, by the cited expertise-reversal literature, actively counterproductive.

State the assumed learner in section 1, and say what changes for an experienced audience.

### D5. The no-fabrication rule collides with the specified human factors simulations

The document forbids inventing particulars, then specifies a handover model that computes "what the incoming shift knows" and a task-load model that computes "error exposure." Those computations require a rule set. If that rule set is authored rather than sourced, the specification breaches the document's own strongest constraint.

This is the most important unresolved tension, because it governs whether the non-technical half of the library can have applied beats at all. Resolve it by requiring that any model's rules be traceable to a cited source, and by accepting qualitative or ordinal outputs where the literature does not support numerical ones. A handover model can honestly show that an unrecorded item is unavailable to the next shift without claiming a probability.

---

## Minor findings

### N1. Terminology collisions

"Practice" as a type collides with retrieval practice as an effect, and the document cites the effect under both Practice and Check. "Case" collides with the case-study method, which this is not. "Beat" is borrowed from screenwriting and will read as informal to this audience. At minimum, define each term against the thing it will be confused with.

### N2. Accessibility is unaddressed

Applied beats gate progression on a manipulation. The document never states what happens for a learner who cannot perform that manipulation. A gated lesson without an equivalent path is an accessibility failure, and this is the kind of standard that gets audited.

### N3. Reference completeness

Paivio and Gagné are listed without year or full citation. Two entries would not pass a copy editor.

---

## The question this document cannot currently answer

If asked "how do you know this produces better learning," the honest answer today is that one experienced practitioner judged one lesson to be good, the typology was abstracted from it, and a script now checks conformance to that abstraction. That is a defensible basis for a house standard. It is not a defensible basis for a claim about instruction, and the document should not be circulated outside the organization until it either makes the weaker claim explicitly or gathers the evidence for the stronger one.
