# A Beat Typology for Technical Training

**A design methodology for gated, single-file interactive lessons**

Aircraft Electronics Association, Workforce Development
CAET and AET training programs

---

## 1. Scope and purpose

This document defines the unit of instructional design used across the CAET and AET lesson library, and specifies the ten types that unit may take.

It is written to be domain-neutral. The library spans safety practice, human factors, electrical theory, wiring, semiconductors, digital databuses, communication and navigation systems, and regulatory procedure. A typology that only describes electrical lessons would fail the majority of the curriculum. Each type below is therefore defined by the instructional function it performs, not by the subject matter or the interface element that delivers it, and each is illustrated with instantiations drawn from several domains.

Where an instantiation has been built and validated, it is marked **built**. Where it is specified but not yet constructed, it is marked **specified**. The direct current lessons are the most mature part of the library and therefore supply the largest share of validated examples; this reflects build order, not a claim that the method is electrical in nature.

### 1.1 Definitions

**Lesson.** A single self-contained instructional artifact, delivered as one scrolling document inside a course player, addressing one to three learning objectives and typically occupying twelve to thirty minutes of learner time.

**Beat.** The atomic unit of a lesson: one contiguous block performing exactly one instructional function, occupying one position in the lesson's progress rail, and controlling one advancement gate. A beat is not a screen, a scroll position, or an interface component. It is a job.

**Type.** The instructional function a beat performs. Ten types are defined in section 3. Type is selected first, from the objective's performance verb.

**Recipe.** The interaction pattern through which an applied beat is delivered. Recipes are enumerated in `beat-recipes.md` and are selected second, and only for the three applied types.

**Gate.** The condition under which a learner may advance past a beat. Expository beats release on arrival; applied beats withhold release until the learner performs the beat's defining action.

### 1.2 The layer discipline

```
  TYPE      the instructional function          selected from the objective
    |
  RECIPE    the interaction that delivers it    selected from the subject
    |
  BUILD     markup, gating, figures, wiring     selected last
```

Design proceeds downward. A build that begins at the interaction layer produces a lesson that satisfies its surface rules and fails its instructional purpose, which is the specific failure this methodology exists to prevent.

---

## 2. Structure of a lesson

The ten types fall into five phases. The phase order is not stylistic. It is the sequence for which the evidence in section 4 provides support: activate before presenting, present before modeling, model before eliciting performance, elicit performance before scoring, score before integrating.

```
 FRAME              DELIVER                 APPLY                    VERIFY      CLOSE
 1 Orientation      3 Definition            6 Simulation             9 Check     10 Consolidation
 2 Case             4 Explanation           7 Practice
                    5 Demonstration         8 Procedure
```

The DELIVER phase carries three types because technical instruction requires three distinct acts: fixing the terms, developing the mechanism, and working an instance. Collapsing them, in particular collapsing Explanation into Definition, is the documented cause of the thin lessons this methodology was written to prevent.

**Mandatory in every lesson:** Orientation, at least one applied type, Check, Consolidation.

**Conditional:** Case, Definition, Explanation, Demonstration, and any additional applied type. Each must justify its inclusion against the lesson's objectives. A beat that cannot name the objective it serves and the instructional principle it enacts is decoration and must be removed.

A lesson containing every type is almost certainly overlong. A lesson containing two applied beats on the same objective has divided the learner's attention without adding instruction.

---

## 3. The ten types

Each entry states a formal definition, the instructional function, the theoretical basis, numbered design requirements that apply in every domain, instantiations across the curriculum, observed failure modes, and gating.

---

### 3.1 Orientation

**Definition.** The opening beat, establishing the lesson's goal, the objectives it owns, and the terminal performance expected of the learner.

**Function.** To supply the organizing structure into which subsequent material is assimilated. A learner who does not know what is being taught expends early capacity constructing that frame rather than populating it.

**Theoretical basis.** Ausubel (1960) on advance organizers: material preceded by an appropriately abstract organizing structure is retained substantially better than the same material presented without one. Gagné's second and third instructional events, informing the learner of the objective and stimulating recall of prerequisite learning.

**Design requirements.**

1. State the goal in terms of learner performance, not curriculum coverage.
2. Reproduce objective wording verbatim from the controlled objective registry. Paraphrase is prohibited, because the objective is the contract against which the lesson and its assessment are both validated.
3. Name the terminal performance in the vocabulary of the work, not of the syllabus.
4. Do not teach here. Orientation frames; it does not deliver.

**Instantiations.**

| Domain | Orientation content |
|---|---|
| Electrical theory (built) | Quantity name, symbol, unit, and the objectives owned by the day |
| Human factors (specified) | The factor under study, the maintenance decision it distorts, and the objective |
| Safety practice (specified) | The hazard class and the standard the learner will be held to |
| Regulatory (specified) | The rule or inspection, its citation, and what compliance requires |

**Failure modes.** Substituting a promotional hook for a stated goal. Presenting objectives in taxonomy language the learner does not read. Delivering content, which converts the frame into the lesson and leaves the real opening unframed.

**Gate.** Releases on arrival. **Budget.** 120 to 200 words.

---

### 3.2 Case

**Definition.** A bounded account of an authentic work problem, stated with its real measured particulars and left unresolved.

**Function.** To establish necessity. Instruction offered before a problem is received as information; the same instruction offered after a problem is received as a tool. The case also supplies the retrieval context in which the knowledge will later be needed.

**Theoretical basis.** Merrill (2002), first principle: learning is promoted when learners engage in solving real-world problems. Research on inert knowledge indicates that content acquired without a context of use frequently fails to transfer to situations where it applies.

**Design requirements.**

1. One case per lesson. A second case divides attention without deepening it.
2. Particulars must be authentic. Measured values, indications, and observed conditions are taken from source documentation or documented shop experience. Fabricating accident specifics, regulatory citations, quotations, or instrument readings is prohibited without exception.
3. State the symptom and stop. The case must remain open until Consolidation.
4. The case must be resolvable by the objectives this lesson owns. A case requiring knowledge from elsewhere teaches the learner that the lesson is insufficient.

**Instantiations.**

| Domain | Case |
|---|---|
| Electrical theory (built) | A cabin fan on a 13.6 volt bus reading 9.1 volts at the load. The missing volts are unexplained until the lesson supplies the method. |
| Human factors (specified) | A shift handover conducted verbally under time pressure, with the omission not yet visible |
| Digital databus (specified) | A receiver that will not respond to a transmitter, with the topology not yet explained |
| Wiring (specified) | A component that passed bench test and failed in service after handling without protection |
| Regulatory (specified) | An aircraft presented for return to service with an inspection interval in question |

**Failure modes.** Dramatization in place of specificity. Invented particulars. A case general enough to open any lesson, which signals that it was written to fill the slot rather than to create necessity. Immediate resolution, which spends the tension before the instruction arrives.

**Gate.** Releases on arrival. **Budget.** 150 to 250 words.

---

### 3.3 Definition

**Definition.** The systematic statement of the concept: its definition, notation, units or categories, governing rules, and controlled vocabulary.

**Function.** To establish terminology and structure before any subsequent beat depends on them. Exposition carries the largest share of the lesson's technical content and sets its intellectual density.

**Theoretical basis.** Mayer's pre-training principle (Mayer, 2009): learners presented with the names and characteristics of components before the explanation of a process learn the process better than learners who meet both at once. Cognitive load theory (Sweller, van Merriënboer and Paas, 1998): unfamiliar terminology encountered during a procedure competes with the procedure for limited working memory, and the resulting extraneous load displaces the germane processing that builds schema.

**Design requirements.**

1. Reproduce the source definition exactly. An improved definition is a different definition, and the learner will be assessed against the source.
2. State notation and units, or categories and boundaries, adjacent to the definition.
3. State the governing rules completely, including the behavior of the system under change, before any beat asks the learner to observe that behavior.
4. Write in complete sentences carrying technical content, at the density of a technical manual. Fragmented emphasis is not concision; it is the removal of the explanatory connective tissue on which comprehension depends.
5. This beat carries the lesson's largest word budget. Reducing it is the most common cause of a lesson that appears complete and teaches thinly.

**Instantiations.**

| Domain | Exposition content |
|---|---|
| Electrical theory (built) | Definition, symbol, unit, series rule, parallel rule, and the effect of removing an element |
| Human factors (specified) | The factor defined, its observable indicators, the conditions that produce it, and its documented countermeasures |
| Digital databus (specified) | Topology, signaling method, direction of flow, and the controlled vocabulary of the standard |
| Safety practice (specified) | The hazard, the classification scheme, and the controlling standard |
| Communication and navigation (specified) | The system's function, its frequency band and mode structure, and its failure indications |

**Failure modes.** A definition card followed by fragments. Paraphrase that reads more smoothly and specifies less. Distributing the definition across later beats so that no beat states it completely. Compressing this beat to make room for interaction, which inverts the dependency the pre-training principle establishes.

**Gate.** Releases on arrival. **Budget.** 400 to 700 words, the largest in the lesson.

---

### 3.4 Explanation

**Definition.** Sustained expository prose developing the mechanism of the system under study: how it behaves as it does, why it behaves that way, and what follows when conditions change. Figures are referenced from within the prose and subordinate to it.

**Function.** To construct the learner's mental model. Definition fixes the terms; Explanation builds the causal structure those terms describe. This is the beat in which the learner comes to understand the system, and no other beat substitutes for it.

An applied beat lets a learner test a model. It does not supply one. A simulation encountered without a prior model produces exploration rather than comprehension: the learner manipulates the controls, observes the readout change, and induces a local rule that does not generalize. The prose beat is not connective material placed between the interactive beats. It is instruction of equal standing, and in a technical curriculum it carries the larger share of the understanding.

**Theoretical basis.** Text coherence research provides the strongest and most directly applicable finding. McNamara, Kintsch, Songer and Kintsch (1996) demonstrated that readers with low prior knowledge of a domain learn substantially more from explanatory text made **more** explicit, with causal connectives stated and inferential gaps closed, than from terse text that requires the reader to supply the connections. The effect interacts with prior knowledge and diminishes or reverses for expert readers.

This finding governs the register of the entire library. The audience is technicians encountering the material for the first time, which is precisely the population for whom explicit, connected, fully stated prose outperforms compressed prose. Prose reduced to short declarative fragments removes the causal connectives that carry the explanation, and it does so for the reader least able to reconstruct them.

Supporting: Kintsch's construction-integration model, under which comprehension requires building a situation model that terse text underspecifies. Mayer's coherence and signaling principles: organized, explicitly structured presentation with irrelevant material excluded outperforms the alternative. The seductive details effect (Garner et al.; Harp and Mayer, 1998), under which interesting but non-explanatory additions depress learning from expository text. Chi et al. (1989) on self-explanation, which prose exposing causal structure invites and terse prose forecloses. Learner-paced text also avoids the transience of narrated animation, since the reader controls rate and may re-read.

**Design requirements.**

1. Develop the mechanism, do not restate the definition. If a paragraph could be deleted without removing an explanatory step, it is not carrying an explanatory step.
2. State the causal connectives explicitly. "Because", "which means", "so that", "if this changes, then". These are the load-bearing elements of the beat and are the first thing lost when prose is compressed.
3. Write in complete sentences of ordinary technical length. A sequence of three-word declaratives is not concision; it is the removal of the connectives requirement 2 exists to preserve.
4. Follow one line of reasoning to its end before starting the next. Interleaved partial explanations produce a text the reader cannot assemble.
5. Reference figures from within the prose, at the point the prose needs them. A figure the text never invokes is decoration.
6. Include the failure or abnormal case. A mechanism explained only in its normal state does not support diagnosis, which is what the technician is being trained to do.
7. Exclude material that is interesting but not explanatory. The seductive details finding is specific: such material depresses learning from exactly this kind of text.
8. This beat and Definition together carry the majority of the lesson's word budget. A lesson in which the applied beats outweigh the prose has inverted the dependency and will produce learners who can operate the controls and cannot explain the system.

**Instantiations.**

| Domain | Explanation |
|---|---|
| Electrical theory (built) | Why opposition arises in a conductor, developed from free electron movement through the lattice to the effect of length, cross-sectional area, material and temperature, each connected to the next and each tied back to the measured quantity |
| Human factors (specified) | How an interruption displaces the working memory contents holding an unfinished task, why the task is then resumed at the wrong step, and why the error is not visible to the person who made it |
| Digital databus (specified) | Why a one-to-many topology removes the need for arbitration, what that costs in return path, and what therefore happens when a receiver has data to send |
| Wiring (specified) | How charge accumulates on an insulated body, why the resulting potential exceeds device withstand, and why the damage is frequently latent rather than immediate |
| Communication and navigation (specified) | How the received signal encodes bearing, why the indication behaves as it does at station passage, and what the display shows when the signal is lost |
| Regulatory (specified) | What the rule requires, why the requirement exists, how the intervals interact, and what condition returns the aircraft to non-compliance |

**Failure modes.** Compression into declarative fragments, which is the observed failure across the weaker lessons of the first shipped course and the reason this type is specified separately. Restating the definition at greater length without developing the mechanism. Figures presented without prose invoking them. Explaining only the normal case. Substituting an applied beat for the explanation on the assumption that manipulation teaches the mechanism, which the evidence above does not support. Treating the prose as material to be reduced when the lesson runs long, when it is the material that carries the understanding.

**Gate.** Releases on arrival. The beat is learner-paced by construction and requires no gate to be effective.

**Budget.** 600 to 1200 words, the largest allocation in the lesson. Together with Definition this beat is expected to account for roughly half the learner-visible prose.

---

### 3.5 Demonstration

**Definition.** A single instance worked through completely with the expert reasoning made visible, including intermediate steps and any approximation.

**Function.** To model the reasoning process rather than to deliver its product. The learner observes how an expert moves from given conditions to conclusion.

**Theoretical basis.** The worked example effect (Sweller and Cooper, 1985; Atkinson, Derry, Renkl and Wortham, 2000): novice learners acquire procedural skill more efficiently from studying worked examples than from equivalent time spent solving problems unsupported. The effect is moderated by expertise and reverses at higher levels of prior knowledge (Kalyuga, 2007), which is why this beat is prominent in first-exposure lessons and diminishes in advanced ones. Self-explanation research (Chi et al., 1989) indicates that examples exposing intermediate reasoning produce better transfer than examples presenting only the result.

**Design requirements.**

1. One instance, carried from given conditions to final result without omitted steps.
2. Number the steps where the procedure is ordered.
3. Disclose approximation and rounding explicitly. Concealing it teaches that the method is more exact than it is, and the learner will meet the discrepancy on the job.
4. Every value must originate in source documentation. Where a source does not state a value, the build stops and the value is requested. It is never supplied by inference.

**Instantiations.**

| Domain | Demonstration |
|---|---|
| Electrical theory (built) | A 9 volt source across 20, 15 and 30 ohms, with the three drops computed and the sum stated as 8.45 volts, with the rounding acknowledged |
| Human factors (specified) | A documented event traced decision by decision, with each contributing factor named at the point it operated |
| Regulatory (specified) | A compliance determination worked through the applicable rule clause by clause to a stated conclusion |
| Digital databus (specified) | A single data word decoded field by field against the standard's word format |

**Failure modes.** Stating the governing relationship and presenting the result without the intermediate reasoning. Animated computation that displays an incorrect intermediate value. Several partial examples in place of one complete one. Supplying a plausible value where the source is silent.

**Gate.** Releases on arrival, or on learner advance if the demonstration is stepped. **Budget.** 250 to 450 words.

---

### 3.6 Simulation

**Definition.** A manipulable model of a system whose state is computed from the learner's inputs according to the system's actual governing rules.

**Function.** To allow the learner to derive a relationship through interaction with a system that responds correctly, rather than to receive that relationship as an assertion.

The governing rules need not be physical. A simulation is defined by the presence of a rule-governed model whose state the learner changes and whose response is computed rather than staged. Those rules may be physical, procedural, protocol-based, or causal within a human or organizational system. This is the type most often misconstrued as belonging only to technical subjects, and that misconstruction is the principal reason non-technical lessons in this library have been weaker than technical ones.

**Theoretical basis.** The generation effect (Slamecka and Graf, 1978): information produced by the learner is retained better than equivalent information read. Predict-observe-explain as an instructional sequence. Productive failure (Kapur, 2008): an incorrect prediction subsequently corrected by the model produces stronger and more durable encoding than a correct answer obtained without commitment. The instructional value resides in the discrepancy between prediction and result, which means a simulation the learner may operate without first committing forfeits most of its effect.

**Design requirements.**

1. **Prediction precedes manipulation.** The learner commits to an expected outcome, and that commitment drives the model. A control that merely responds is instrumentation; a control that first contradicts the learner is instruction.
2. The model computes honestly at every reachable state. Preset positions, interpolated approximations, or a lookup of three staged outcomes do not constitute a simulation and will misteach at the states between them.
3. One independent variable per manipulation.
4. State must be externalized as a readout or an equivalent explicit indication, not conveyed solely through an image.
5. One simulation per lesson. A second divides attention across two models and consolidates neither.

**Instantiations.**

| Domain | Simulation | Governing rule |
|---|---|---|
| Electrical theory (built) | Material, length, area and temperature set by the learner; resistance and resulting current computed | Physical law |
| Digital databus (specified) | One transmitter, several receivers; the learner attempts a reply and the topology refuses it | Protocol constraint |
| Human factors (specified) | A shift handover in which the learner selects what is recorded, and the model computes what the incoming shift knows, what it assumes, and what it will not discover until failure | Information propagation |
| Human factors (specified) | Task load, interruption count and hours awake set by the learner; the model computes error exposure across the shift | Documented performance decrement |
| Wiring (specified) | Handling conditions set by the learner; accumulated charge and junction stress computed against device withstand | Physical law |

The two human factors entries are the demonstration this typology requires. Neither is built. Both are specified here because the type is otherwise liable to be read as electrical, and because the absence of a validated non-technical simulation is the most significant gap in the current library.

**Failure modes.** A control that resizes artwork rather than computing state. Feedback presented beside an object that does not itself change. Permitting manipulation before prediction. Adding a second model for the appearance of richness.

**Gate.** Withholds release until the first genuine manipulation. Release is granted on that action; further exploration is unconstrained. **Budget.** 200 to 350 words of surrounding prose.

---

### 3.7 Practice

**Definition.** Discrete, repeated manipulation of instances against a rule, building recognition, classification, or discrimination.

**Function.** To convert a rule the learner has read into a rule the learner has applied. Exposition states that a category has boundaries; Practice requires the learner to place instances on either side of them.

**Theoretical basis.** Retrieval practice (Roediger and Karpicke, 2006). Interleaved and varied practice: learners required to discriminate among related categories in mixed presentation outperform learners given the same items in blocked presentation, particularly on later discrimination tasks (Rohrer and Taylor, 2007). Dual coding theory (Paivio) governs the recognition case: a symbolic representation teaches the symbol, and only a veridical image teaches identification of the referent in the physical environment. This is why recognition beats pair a schematic face with a photograph and never two drawn faces.

**Design requirements.**

1. Five instances or fewer. Beyond that the beat becomes an inventory.
2. Every instance must be plausible to a learner who has not yet mastered the rule. An obviously incorrect option consumes attention and returns nothing.
3. The manipulation must produce an observable consequence consistent with the rule.
4. Recognition beats use authentic photographs with attribution. A drawn approximation of a physical object does not support identification and must not be substituted.
5. Release on the first correct application. Requiring exhaustive completion converts practice into compliance.

**Recipes.** `recognize`, `compare`, `membership`, `sequence`, `decide`, `lookup`.

**Instantiations.**

| Domain | Practice | Recipe |
|---|---|---|
| Electrical theory (built) | Component families identified from schematic and photograph; network elements added and removed with the total responding per the rule | recognize, compare |
| Human factors (built as stand-in) | A described maintenance situation classified against the contributing-factor taxonomy, with the teaching line attached to the option selected | decide |
| Safety practice (specified) | A substance located in the correct data sheet section; an extinguisher matched to a fire class | lookup |
| Safety practice (specified) | Response steps to an electrical contact event ordered where the order carries consequence | sequence |
| Wiring (specified) | Protective packaging discriminated from non-protective on the same frame | compare |
| Communication and navigation (specified) | Band and mode located for a stated operational requirement | lookup |
| Test equipment (built) | Meter setup steps sorted into permitted at any time, required before probing, and never permitted | membership |

**Failure modes.** A matching exercise with no consequence attached to the result. A catalogue presented without a task. Schematic representations on both faces of a recognition card. Requiring all instances when one demonstrates the skill.

**Gate.** Withholds release until the first correct application. **Budget.** 150 to 300 words.

---

### 3.8 Procedure

**Definition.** Rehearsal of an ordered task on an instrument or system, in which sequence and completeness carry consequence and the incorrect path remains reachable.

**Function.** To build the decision and action sequence of the technician's actual task in an environment where error is instructive rather than costly.

**Theoretical basis.** Cognitive apprenticeship (Collins, Brown and Newman, 1989): model, coach, scaffold, fade. Gagné's fifth and sixth events, providing learning guidance and eliciting performance. Research on learning from errors (Metcalfe, 2017) indicates that an error committed and immediately corrected produces better retention than an error prevented, provided the correction is immediate, specific, and explains the mechanism. This is the basis for requirement 2 below and distinguishes this type from a guided walkthrough.

**Design requirements.**

1. The ordered instructions appear in prose adjacent to the instrument, in the source's wording, numbered.
2. **The incorrect path must be reachable and must instruct.** Permitting the learner to energize a circuit before applying an ohmmeter, and showing the consequence, teaches more than disabling the control. A procedure that cannot be performed incorrectly is a demonstration wearing an interface.
3. Typographic emphasis is reserved for the single rule that prevents injury or equipment damage. Applied broadly it ceases to mark anything.
4. Release is granted on completion of the correct path to a genuine result, not on any interaction.
5. One procedure per beat. Two related procedures are two beats or one lesson too many.

**Recipes.** `meter`, `scope`, `trace`.

**Instantiations.**

| Domain | Procedure | Recipe |
|---|---|---|
| Test equipment (built) | Resistance measured with power removed and the element isolated, the energized attempt reachable and consequential | meter |
| Test equipment (built) | Voltage measured across an energized element; the series connection available and shown to be the wrong instrument configuration | meter |
| Digital databus (specified) | A differential waveform read and characterized against the standard | scope |
| Systems (specified) | A fault traced from source through distribution to load, with the learner identifying the failed segment | trace |
| Pitot-static (specified) | Instrument indications produced by an introduced blockage or leak, and the affected system identified | trace |
| Safety practice (specified) | A workstation established for electrostatic protection, with omissions carrying visible consequence | sequence |

**Failure modes.** Preventing the error instead of instructing through it. An ordered task in which order carries no consequence. Instrument readings not present in source documentation. Two configurations combined into a single beat.

**Gate.** Withholds release until the correct path yields a genuine result. **Budget.** 250 to 400 words.

---

### 3.9 Check

**Definition.** A scored retrieval beat presenting a fixed set of items with immediate item-level instructional feedback and permitted reattempt.

**Function.** Instruction, scored. The Check is the final teaching beat of the lesson and not a measurement instrument. Its purpose is to force retrieval and correct the result. Constructing it as an examination is the most frequent way the beat's value is forfeited.

**Theoretical basis.** The testing effect (Roediger and Karpicke, 2006; Karpicke and Blunt, 2011): retrieval attempts strengthen retention more than additional study of the same material, and the retrieval attempt is itself the learning event. It follows that feedback quality governs the beat's instructional value more than item difficulty does, because the correction carries the learning. Item construction follows the empirical item-writing literature (Haladyna, Downing and Rodriguez, 2002).

**Design requirements.** The full standard is specified in `../assessment/ASSESSMENT.md`. In summary:

1. One construct per item, with the complete question in the stem.
2. Negative stems are prohibited. They assess reading care and expose the learner to an incorrect proposition as read text.
3. Four options, comparable in length and grammatical form. Systematic length differences render items answerable without knowledge.
4. Distractors represent documented misconceptions, not arbitrary incorrect statements.
5. Every option receives instructional feedback, including the correct option.
6. The keyed position varies across the item set.
7. Every objective claimed by the lesson is assessed by at least one item.
8. Items derive from the controlled practice bank. The certification instrument is never consulted for item construction.

**Instantiation.** Uniform across all domains. The Check is the one type whose construction does not vary by subject matter, which is why its standard is specified separately and centrally.

**Failure modes.** A fixed keyed position, which permits a learner to satisfy the beat without knowledge; this condition was present in five of six lessons in the first shipped course, including the ten-item course assessment gating completion. Feedback that evaluates rather than instructs. Items assessing material the lesson did not present.

**Gate.** Withholds release until the pass threshold is met. An incorrect response yields reattempt. **Budget.** Item text.

---

### 3.10 Consolidation

**Definition.** The closing beat, restating each objective as achieved performance and resolving the case opened in beat 2.

**Function.** To integrate the lesson's content into the learner's working context and to close the problem the lesson opened.

**Theoretical basis.** Merrill (2002), fifth principle: learning is promoted when new knowledge is integrated into the learner's world. Retrieval-based summarization outperforms review as a closing activity (Karpicke and Blunt, 2011). Closing the case exploits the encoding-specificity relationship between the problem context established in beat 2 and the knowledge acquired since.

**Design requirements.**

1. One statement per objective owned by the lesson. Not a fixed number by habit.
2. Each statement expresses the objective as performance in the vocabulary of the work, not as a restatement of the objective's own wording.
3. The case from beat 2 is resolved here, with the particular that resolves it.
4. Completion is recorded here, and only after both the applied work and the pass threshold are satisfied. Completion is never recorded on scroll position.

**Instantiations.**

| Domain | Consolidation |
|---|---|
| Electrical theory (built) | One statement per objective, and the cabin fan case resolved by the added series resistance in the feed |
| Human factors (specified) | One statement per objective, and the omitted handover item identified along with the countermeasure that would have captured it |
| Regulatory (specified) | One statement per objective, and the compliance determination stated with its citation |

**Failure modes.** A generic summary heading in place of objective-level statements. A fixed count of statements irrespective of objective count. Closing on the score. Leaving the case unresolved, which teaches that the opening problem was ornamental.

**Gate.** Completion releases when applied work and the pass threshold are both satisfied. **Budget.** 150 to 250 words.

---

## 4. Selection procedure

Type selection is determined by the objective, not by available interface components.

1. State the objectives. Objectives are supplied from the controlled registry and are never authored during lesson design.
2. For each objective, identify the performance verb. The verb determines the applied type:
   - A relationship to be derived, or a system whose behavior must be predicted, selects **Simulation**.
   - A category to be recognized, discriminated, or classified selects **Practice**.
   - An ordered task to be performed correctly selects **Procedure**.
3. Add Orientation and Consolidation. Both are mandatory.
4. Add Case unless the applied beat is itself the reason the topic exists.
5. Add Exposition. Omission requires justification, as the pre-training dependency is asserted by every subsequent beat.
6. Add Demonstration where a computation, determination, or sequence must be modeled before it is attempted.
7. Add Check.
8. Sum the word budgets. A standard lesson falls between 2400 and 3600 words of learner-visible prose.

Each beat in the resulting map records its type, its recipe where applicable, and the instructional principle it enacts. A beat that records neither a governing objective nor a principle is removed.

## 5. Application beyond electrical subjects

The direct current lessons supplied the first validated instances of Simulation and Procedure because they were built first and because physical law provides a model that is straightforward to compute. This has produced a practical risk: subsequent designers may infer that the applied types require a physical system, and may substitute expository content for applied beats in human factors, safety, and regulatory lessons.

That inference is incorrect and the typology is written to foreclose it. An applied beat requires a rule-governed model whose state the learner changes and whose response is computed. Information loss across a shift handover is such a model. Performance decrement under accumulated task load is such a model. Compliance determination under a regulatory clause is such a model. Each admits prediction, each admits an honest computed response, and each therefore admits a genuine Simulation beat.

Where such a beat has not yet been built, it is specified in section 3.6 rather than omitted, so that the specification exists before the first non-technical lesson is designed. The absence of a validated non-technical Simulation is recorded as the principal outstanding gap in the library.

## 6. References

Ausubel, D. P. (1960). The use of advance organizers in the learning and retention of meaningful verbal material. *Journal of Educational Psychology*.

Atkinson, R. K., Derry, S. J., Renkl, A., and Wortham, D. (2000). Learning from examples: instructional principles from the worked examples research. *Review of Educational Research*.

Chi, M. T. H., Bassok, M., Lewis, M. W., Reimann, P., and Glaser, R. (1989). Self-explanations: how students study and use examples in learning to solve problems. *Cognitive Science*.

Collins, A., Brown, J. S., and Newman, S. E. (1989). Cognitive apprenticeship: teaching the crafts of reading, writing, and mathematics.

Gagné, R. M. *The Conditions of Learning.*

Haladyna, T. M., Downing, S. M., and Rodriguez, M. C. (2002). A review of multiple-choice item-writing guidelines for classroom assessment. *Applied Measurement in Education*.

Kalyuga, S. (2007). Expertise reversal effect and its implications for learner-tailored instruction. *Educational Psychology Review*.

Kapur, M. (2008). Productive failure. *Cognition and Instruction*.

Karpicke, J. D., and Blunt, J. R. (2011). Retrieval practice produces more learning than elaborative studying with concept mapping. *Science*.

Mayer, R. E. (2009). *Multimedia Learning*, second edition.

Mayer, R. E., and Moreno, R. (2003). Nine ways to reduce cognitive load in multimedia learning. *Educational Psychologist*.

Merrill, M. D. (2002). First principles of instruction. *Educational Technology Research and Development*.

Metcalfe, J. (2017). Learning from errors. *Annual Review of Psychology*.

Paivio, A. Dual coding theory.

Roediger, H. L., and Karpicke, J. D. (2006). Test-enhanced learning: taking memory tests improves long-term retention. *Psychological Science*.

Rohrer, D., and Taylor, K. (2007). The shuffling of mathematics problems improves learning. *Instructional Science*.

Slamecka, N. J., and Graf, P. (1978). The generation effect: delineation of a phenomenon. *Journal of Experimental Psychology*.

Sweller, J., and Cooper, G. A. (1985). The use of worked examples as a substitute for problem solving in learning algebra. *Cognition and Instruction*.

Sweller, J., van Merriënboer, J. J. G., and Paas, F. (1998). Cognitive architecture and instructional design. *Educational Psychology Review*.

---

## 7. Related documents

| Document | Role |
|---|---|
| `beat-recipes.md` | Interaction patterns for the three applied types |
| `chassis.md` | The gating engine and its frozen contract |
| `../assessment/ASSESSMENT.md` | Item construction standard for the Check beat |
| `../pedagogy/04-research-foundations.md` | The effects underlying this typology, in working-knowledge form |
| `../SPEC-TEMPLATE.md` | The per-lesson design record in which types are assigned |
