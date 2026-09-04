# Seed kit provenance

This directory is a read-only vendored copy of the Lesson Factory seed kit.

- Upstream repository: https://github.com/00ainick-cmd/lesson-factory
- Upstream commit: 178a3dd804d07d7a3997e425afc8098253f06deb
- Vendored: 2026-09-04T15:09:40Z
- Gold fixture: lesson-factory/gold/01-resistance.html
- Gold fixture SHA-256: 50d9ee0575515bc507f0570375a58689036f79fe44e957abe3ef60d9d2e78b9c

Rules:
1. Never edit files under seed-kit/. The seed process copies them into editable, versioned
   workspace knowledge documents; edits happen there.
2. Every seeded document records this commit hash and the file's SHA-256 as its baseline so the
   Knowledge Library can show drift between the workspace copy and the seed baseline.
3. To refresh, re-vendor from upstream and record the new commit here; the seeder creates a new
   baseline version rather than overwriting user edits.
