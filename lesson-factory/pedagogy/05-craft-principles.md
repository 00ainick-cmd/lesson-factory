# 05 · Craft Principles

The rules and the reasoning behind them. The rules are documented in many places (`../reference/craft-principles.md` is the operational version inside `visual-learning-builder`). This file explains the WHY for each rule so future Claudes and future Nicks understand whether the rule should hold, bend, or break in edge cases.

The shape of every rule below is: **The rule. Why it exists. What it costs to violate. When (if ever) to break it.**

## Voice and writing

### No em-dashes

**The rule:** Em-dashes (., U+2014) do not appear in any document or HTML file produced by the system.

**Why it exists:** Em-dashes are a tell of LLM-generated text. They appear in roughly 80% of unfiltered AI prose. Their absence is a marker that the content has been edited by a human or by a careful AI working under explicit rules. Beyond the AI-tell concern, em-dashes are overused as a substitute for the more disciplined choice between commas, colons, semicolons, periods, and parentheses. Avoiding them forces clearer prose.

**What it costs to violate:** The content reads as AI-generated. Reader trust degrades. For Nick's work specifically, the rule connects to his professional identity as a writer who does not need to lean on this crutch.

**When to break it:** Never in his system's output. The rule is hard. Direct quotes from external sources that contain em-dashes should be re-punctuated (the substance is preserved, the typography is normalized).

**Verification:** Use Python, not bash. `python3 -c "print(open('FILE.html').read().count(chr(0x2014)))"` must return 0. Bash grep is unreliable for multi-byte UTF-8 characters.

### No "I sat down with" in podcast or interview content

**The rule:** The phrase "I sat down with" does not appear in any interview or podcast content the system produces.

**Why it exists:** It is a stale podcast cliché. Variants like "I had the chance to sit down with," "I recently sat down with," and "I had a chance to speak with" all carry the same staleness.

**What it costs to violate:** The content reads as derivative. The voice rule connects to a broader discipline of cliché avoidance.

**When to break it:** Never in interview or podcast content. Acceptable in literal context (a story where someone is literally sitting down).

### No corporate buzzwords or AI-tell phrases

**The rule:** Avoid synergy, leverage (as a verb), deliverables, unlock, delve, tapestry, testament to, navigate the complexities, in today's fast-paced world, in the realm of, it's important to note, in conclusion, "not just X but Y" patterns, and similar.

**Why it exists:** These phrases are markers of either bureaucratic prose or AI-generated prose. Both signal that the writer (or model) is reaching for filler rather than working out what they mean.

**What it costs to violate:** Content reads as either corporate or AI. Both undermine the felt authority of the work.

**When to break it:** Avoided as a default. Specific terms have specific technical uses in some contexts and are acceptable when used precisely. "Leverage" as a noun in a finance context is fine. "Deliverables" in a project management plan is fine. The rule is about reflexive use as filler.

### Direct, blunt communication

**The rule:** No hedging, no excessive qualification, no false humility.

**Why it exists:** Nick reads quickly and decides quickly. Hedged communication wastes his time and obscures the recommendation. When a Claude says "perhaps it might be worth considering whether one option could be..." instead of "I recommend option B because...", it forces Nick to do interpretive work the Claude should have done.

**What it costs to violate:** Slower decisions, lower trust, more re-asking.

**When to break it:** When genuine uncertainty exists. Hedging is appropriate when the answer truly depends on information not in hand. False confidence is not the alternative to hedging; calibrated confidence is.

## Visual craft

### No cartoon SVG illustrations of real people or scenes

**The rule:** SVG is for data visualization and iconographic glyphs only. Photorealistic or semi-realistic portraits of named real people in SVG are not produced.

**Why it exists:** SVG cannot reproduce the dimensional information in a photograph. Attempts to draw real faces in SVG land in the uncanny valley. Edison, Tesla, Fuller, and any other named historical figure rendered in SVG looks like a cartoon, which undermines the seriousness of the content.

**What it costs to violate:** The training module looks amateurish even when the content is rigorous. The visual undermines the credibility of the words.

**When to break it:** Symbolic representations are fine. An iconographic silhouette of a figure with their tools is fine. A diagrammatic representation of a figure's invention is preferred. The line is between symbolic (acceptable) and portraitive (avoid).

**Workaround:** The portrait card pattern. A styled placeholder with an AI image prompt drawer that lets the consumer generate a real photo if they want one. This solves the "we need to evoke this person without faking their likeness" problem.

### No fixed viewport heights on containers

**The rule:** `height: 100vh` does not appear on content containers. Use `min-height: 100vh` with flexbox instead.

**Why it exists:** Fixed viewport heights break on mobile devices, on short browser windows, and on devices where the address bar height varies. The pattern looks correct on desktop and fails everywhere else. Flexbox with `min-height` allows content to grow when needed and fills the viewport when content is short.

**What it costs to violate:** Content gets cut off on real devices. Scroll behavior breaks. Mobile rendering fails specifically.

**When to break it:** Modal overlays and slide-in panels where the panel must cover the viewport are the legitimate edge case. Even there, the cleaner pattern is `top: 0; bottom: 0;` rather than `height: 100vh`.

### Body text contrast minimum 7:1

**The rule:** Body text must achieve a 7:1 contrast ratio against its background (WCAG AAA). Headings must achieve at least 4.5:1 (WCAG AA).

**Why it exists:** Lower contrast excludes readers with vision impairments. The AAA threshold is more conservative than the AA standard but is achievable with intentional design and produces text that is comfortably readable in varied lighting conditions.

**What it costs to violate:** Some readers cannot read the content. Mobile readers in sunlight struggle.

**When to break it:** Decorative or supplementary text (captions, source citations, tertiary labels) may use lower contrast for visual hierarchy. The minimum still applies to anything the learner needs to read to follow the lesson.

### Single self-contained HTML files

**The rule:** Every HTML training module is a single file with all CSS and JavaScript inline. Only permitted external dependency: Google Fonts.

**Why it exists:** Self-contained files are portable across hosting environments. They work locally, on AWS, on Thinkific, in a download, in an email. They survive being moved between systems without breaking. They have no broken-link failure mode.

**What it costs to violate:** Modules that work in one environment and break in another. Maintenance burden of keeping external assets aligned with HTML versions. Brittleness over time.

**When to break it:** Real photographic content that cannot be reasonably embedded as data URI (see image strategy file in `../reference/`). The standard workaround is to host real photos on AWS alongside the HTML when the production pipeline supports it. Even then, the HTML is a single file that references external images.

### Inline CSS and JavaScript (no separate files for shared bundles)

**The rule:** No shared CSS framework. No external JavaScript dependencies (except Google Fonts). No bundler. No build step.

**Why it exists:** Single-author shop. The cost of maintaining a build system and shared component library exceeds its benefits at this scale. Every module being independent means a change to one cannot accidentally break another.

**What it costs to violate:** Some duplication of code across modules. Slightly larger file sizes. The visual-learning-builder skill mitigates this by providing a starter template and block library so the duplication is intentional and consistent.

**When to break it:** When the system grows enough that a real component library would pay for itself. That threshold is probably around 40-50 modules with active maintenance, not the current scale.

## Information architecture

### One idea per section

**The rule:** Each major section of a learning module covers one core idea, supported by at most one hero stat and one pull quote.

**Why it exists:** Cognitive load theory. Working memory is limited; a section trying to cover three ideas loses all three. The pattern of "one idea, fully developed" produces stronger learning than "many ideas, lightly touched."

**What it costs to violate:** Learners absorb less. Retention drops. Sections feel cluttered.

**When to break it:** Reference materials (catalogs, comparison tables, frameworks listings) are organized for lookup, not study, and can present multiple ideas adjacently. The rule applies to learning content; reference content is structured differently by design.

### Reflection before the lesson

**The rule:** For DECIDE IT and BECOME IT modules, the learner should be forced to commit to an answer or position before being told the principle.

**Why it exists:** The generation effect and the testing effect. Material the learner has generated (even an imperfect generation) is retained better than material received passively. Forcing commitment before reveal creates the cognitive position the principle is meant to teach.

**What it costs to violate:** The lesson lands as exposition rather than insight. Retention drops.

**When to break it:** KNOW IT and DO IT modules may not have a meaningful "commit to a position" moment; the structure does not apply. UNDERSTAND IT modules may use predict-then-reveal patterns at the block level rather than the section level.

### Mastery as the gate, not seat time

**The rule:** In DO IT modules, learners advance to the next item when they have demonstrated mastery, not when they have spent a certain amount of time or made a certain number of attempts.

**Why it exists:** Mastery learning (Bloom 1968) and deliberate practice (Ericsson 1993). Seat-time gates produce learners who have completed but not mastered. Mastery gates produce learners who can actually perform.

**What it costs to violate:** Certified incompetence. Certification claims that the field cannot rely on.

**When to break it:** When the cognitive goal is exposure rather than competence (rare in this system). When external regulatory constraints mandate seat-time tracking regardless of mastery (corporate compliance training falls here; this system does not optimize for it).

## File and skill organization

### No version numbers in filenames or document content

**The rule:** Files are named "The Gimli Glider Case File.html," not "case-study-v2.html" or "gimli-v3-final-FINAL.html."

**Why it exists:** Version numbers in filenames are a workflow smell. They suggest the author is not committed to the file or does not have a version control system. When files are properly versioned (by file system, by OneDrive history, by git), the filename should describe the content, not the iteration.

**What it costs to violate:** Folders fill with parallel versions. The current version becomes ambiguous. Future-Nick has to figure out which "v3" was actually the final.

**When to break it:** Never in delivered work. Working drafts may live in scratch folders with internal version names.

### Single file per skill, no spinoffs

**The rule:** Each builder skill produces one type of artifact (one HTML format). Skills are not split into "case-study-html-builder" and "case-study-pdf-exporter."

**Why it exists:** Skill discovery in Claude works by description matching. Splitting one capability into multiple skills produces ambiguous matches and inefficient invocation. One skill, one job, one artifact type.

**What it costs to violate:** The wrong skill fires for the wrong request. Maintenance burden multiplies.

**When to break it:** When the artifacts are genuinely different cognitive tasks (a skill that builds the lesson plan and a skill that builds the assessment are different jobs even if they relate to the same training).

### Notes file accompanies every example

**The rule:** Every HTML example in `examples/` has a companion `-notes.md` file.

**Why it exists:** The notes file carries the nuance that filename tier labels cannot. An example might have parts that work and parts that fail; the notes file says which is which. Without notes, the next Claude must reverse-engineer the example's quality, which is unreliable.

**What it costs to violate:** The example becomes ambiguous as a reference. The next Claude either over-copies (treating the whole file as exemplar) or under-uses it (ignoring it as risky).

**When to break it:** Never. The notes file is the contract.

## When the rules conflict

A few times when rules pull in different directions, the precedence:

1. **Accessibility rules always win.** Contrast minimums override aesthetic preference. Aria labels override visual cleanliness. Reduced-motion respect overrides motion design choices.
2. **Voice rules win against production speed.** Even if removing the em-dash costs an hour of refactoring, the rule holds.
3. **Mastery rules win against completion rules.** Even if seat-time tracking is administratively required, the cognitive design should optimize for mastery.
4. **Information architecture rules can bend for specific archetypes.** A walk-through can carry more visceral content per section than a reference piece can; the "one idea per section" rule applies more strictly to UNDERSTAND IT than to BECOME IT.

When in doubt, the rule is followed unless an explicit case is made for the exception, and the exception is documented in `06-design-decisions.md` so future work can use the same reasoning.

## See also

- `06-design-decisions.md` for specific applications of these principles and the choices made
- `../reference/craft-principles.md` for the operational rules
- `../reference/design-system.md` for the visual system that implements these principles
