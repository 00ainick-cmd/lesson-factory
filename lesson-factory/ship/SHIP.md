# SHIP: package and delivery (locked)

Ship only after G3 (Nick signed the build). The delivery vehicle is the AERO Player; do not pick another. SCORM goes to Thinkific and the ACE LMS; a standalone AERO web build serves the same files.

## 1. Mount the lesson in the course

- Lesson file lands in `AERO-Player/courses/<courseId>/lessons/NN-slug.html`. If a player copy already exists, MERGE content in; never overwrite the player file with an author draft (that wipes __inkGate, Continue, dock hints, tick colors).
- Add or update the lesson's entry in `courses/<courseId>/course.json`: id, title, src, minutes, objective, LO codes, graded, in student order.
- Copy every asset the lesson references into `lessons/assets/` (photos with their CREDITS.md, the mp3, any video). An asset referenced but not shipped is a FAIL; the caet-dc package went out with four lessons pointing at mp3s that were never packaged.

## 2. Gate the whole course

```
python3 <kit>/tools/quality-gate.py --course AERO-Player/courses/<courseId>/lessons
python3 tools/validate.py            (bundle root; style floor across the workspace)
```

Zero FAILs on both before building.

## 3. Build

```
cd AERO-Player
npm run build-course -- <courseId>
```

This writes `course.config.js`, `dist/<courseId>/`, and `dist/<courseId>-SCORM.zip`, and regenerates the imsmanifest file list. Confirm the manifest lists every lesson asset (spot-check the mp3s and photos).

## 4. Zip rules (hard-learned)

- Every zip entry path uses forward slashes. Do NOT use PowerShell Compress-Archive or .NET CreateFromDirectory on Windows; both write backslashes and Thinkific rejects the upload ("zip contains path with invalid characters"). Use the build script's zip, 7-Zip, or PowerShell 7.
- Verify: list the zip entries and check for any backslash before handing off.

## 5. Deliver

- Open `AERO-Player/index.html?course=<courseId>` and click through as a student one last time.
- Nick uploads the zip: Thinkific and the ACE LMS take the SCORM; AWS (S3 + CloudFront) hosts the web build for iframe embeds. Never propose Netlify or GitHub Pages.
- SCORM 1.2 reporting: lesson_status, score.raw, suspend_data, session time when an LMS API is present; localStorage in local preview. Scroll never completes a lesson; mastery does.
- Run the Genesis backup script after a signed ship (tools/backup-to-genesis.ps1 from the bundle root, on Nick's machine).
