# Player face snippets (caet-dc learner chrome)

Paste these into the other repo's AERO Player `index.html` if students see that shell. Change `"caet-dc"` to that course id.

Do not add Review Tracker, Local Analytics, or MARK LESSON COMPLETE under a reporting HTML lesson.

## CSS (with the other `.app` rules)

```css
.app.face .railfoot,.app.face .objective,.app.face .brand .sub,.app.face .head .which,
.app.face .scorechip,.app.face .scorechip.show,.app.face .htmlbar{display:none !important}
.app.face .stagewrap{padding:0}
.app.face .htmlhost{gap:0;height:100%}
.app.face .htmlframe{border:0;border-radius:0}
```

## Early class (before the course paints)

Run as soon as `courseId` is known, so STANDALONE / LESSON x OF y cannot flash.

```js
if (courseId === "caet-dc") {
  var appFace = document.querySelector(".app");
  if (appFace) appFace.classList.add("face");
  var eyeFace = document.getElementById("courseEyebrow");
  if (eyeFace) eyeFace.textContent = "CAET";
  document.title = "Fundamentals of DC";
  ["which", "objective", "courseSub"].forEach(function (hid) {
    var node = document.getElementById(hid);
    if (node) node.hidden = true;
  });
  var footFace = document.querySelector(".railfoot");
  if (footFace) { footFace.hidden = true; footFace.setAttribute("aria-hidden", "true"); }
}
```

Repeat `.face` on boot after COURSE loads (same course id).

## HTML lessons report themselves

When mapping the manifest, set `reports: true` on drop-in HTML lessons. Then the host must **not** inject the htmlbar:

```js
(l.reports ? '' : '<div class="htmlbar"><button type="button" class="htmldone">MARK LESSON COMPLETE</button></div>')
```

Completion lives on the field card (`AeroLesson.complete`).

## Skip the player tour

```js
var noTour = /notour=1/.test(location.search) || /email=nick-review/i.test(location.search) || (window.COURSE && window.COURSE.id === "caet-dc");
```

## Finish copy

Do not print STANDALONE SESSION on this course. Keep the recorded line quiet. No "Electric Ink lesson as a custom HTML file" subtitle.

## Manifest note

`build-course.mjs` in this workspace requires a non-empty subtitle. Give the student a real line. Do not reuse the author note about Electric Ink as a custom HTML file.
