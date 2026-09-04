# Writing the checkpoint items

The checkpoint is not a test. It is the last teaching beat of the lesson, and it happens to keep score.

That distinction decides every rule below. A measurement instrument tries to separate strong students from weak ones. A practice item tries to make one idea stick by forcing a commitment and then correcting it. The CAET exam does the first job. These items do the second. Writing them like exam questions is the most common way this beat gets wasted.

Read `../pedagogy/04-research-foundations.md` on the testing effect before writing your first stem.

## Integrity rules, absolute

1. **Never open the certification workbook or the Question-to-LO map to write, check or reword an item.** Not to match coverage, not for ideas. That file is the live exam. This is the rule that protects the credential, and it has no exceptions.
2. Items come from the practice bank (`PRACTICE-QUESTION-BANK.md`, which lives outside this kit as the single live copy). Pull the Live set for the lesson's C-number.
3. If the bank has no item for a job this lesson needs, **write the item into the bank first**, then copy it into the HTML. The bank stays the source, the lesson stays the copy.
4. Never reuse the exam's numbers or stories. The banned list is in the bank and includes 12 V with 6 ohm, 24 V with 12 ohm, 14 V with 7 A, and the lamp series-parallel puzzle. Use Nick's book numbers instead: 9 V with 20, 15 and 30 ohm, the two 9 V cells, the Cirrus 13.6 and 9.1.
5. After the HTML exists, run the overlap check (`check-exam-overlap.py`). It is an integrity gate, not a writing aid. If it fails, fix the lesson. Do not open the exam to see why.

## The schema

```
id:   C04-P01
lo:   2.2
stem: Voltage is:
opts: [pressure of electrons, flow of electrons, opposition to flow, work produced]
ans:  0
miss: [one teaching line per option, including the correct one]
```

Five items per teach lesson, pass 4 of 5. The course check runs ten, pass 8 of 10.

## Stem rules

**Ask one thing.** If the stem contains "and", check whether you are testing two ideas. Split them or drop one.

**Put the whole question in the stem.** The student should be able to answer before reading the options. "Voltage is:" works. "Which of the following is true regarding voltage in a series circuit?" makes the student assemble the question from the options.

**Never write a negative stem.** "Which is NOT a valid meter hookup" tests reading care, not electrical knowledge, and it plants the wrong answer in memory as a sentence the student read. Rewrite as a positive: "Which meter hookup is correct for ohms?"

**Keep the shop context real.** A scenario line under the stem is good when the situation is one they will meet. It is padding when it exists to make the item feel practical.

**Use Nick's wording.** Definitions come from the cert book. If the book says opposition, the right answer says opposition, even if the bank once said stoppage.

## Option rules

**Four options. All plausible to someone who has not learned this yet.** Three real options plus one obvious throwaway is a three-option item that wastes a quarter of the student's attention.

**Distractors are misconceptions, not wrong noise.** The best source is the mistake a technician actually makes. For CAET that means: the other two parts of Ohm's Law, a swapped series and parallel rule, a live-circuit meter mistake, the right value with the wrong unit. Nick's psychometric analysis of the exam identified which distractors real candidates fall for. Where a lesson covers that ground, use those misconceptions, since the goal is to walk the student into the error safely and correct it here rather than on the exam.

**Match the options in length and grammar.** A correct answer that is noticeably longer or more qualified than the others is answerable without knowing anything. This is the single most common tell in badly written banks, and the gate script now measures it.

**Never write "all of the above" or "none of the above."** They test test-taking. Recognizing one wrong option eliminates "all of the above" outright.

**Avoid absolutes in distractors.** "Always" and "never" in a wrong option are read as giveaways, because experienced test takers know absolute statements are usually false. The exception is when the real rule genuinely is absolute, and then it belongs in the correct answer, in caps, as Nick writes it: power OFF, isolate the part.

**Move the correct answer around.** If four of five items have the answer in the same position, the pattern teaches position instead of content. The gate checks the spread.

## Feedback rules

Every option gets a teaching line, including the correct one. This is where most of the learning in the beat actually happens.

**A miss line does three things:** name the quantity or rule the student confused, give the correct rule or hookup, and point at the object on the page that proves it. It never scolds.

Weak: "Incorrect. Try again."

Strong: "Flow of electrons is current, symbol I, measured in amps. Voltage is pressure. Run the bench again and watch which number moves when you change the source."

**The correct-answer line still teaches.** It restates the rule in the book's words so the student who guessed right leaves with the sentence, not just the point.

**Retry on a miss.** The item is a learning event, so a wrong answer earns another attempt, not a locked door.

## Coverage

Every learning objective the lesson claims must be tested by at least one item. A lesson that lists three objectives and checks two of them is overclaiming, and the gate now fails it.

The reverse also holds: an item testing something the lesson never taught is not a hard item, it is an unfair one.

## Before you call the checkpoint done

- [ ] Five items, all from the bank's Live set for this C-number
- [ ] Every objective code on the lesson appears in at least one item
- [ ] Every option on every item has a teaching line
- [ ] No negative stems, no "all of the above", no absolute qualifiers in distractors
- [ ] Options within an item are comparable in length
- [ ] The correct answer is not in the same position every time
- [ ] No banned exam numbers or stories anywhere in stems, options or feedback
- [ ] The overlap check passes
