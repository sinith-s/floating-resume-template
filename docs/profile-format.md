# Profile format and setup

The site reads `content/resume.json`. The JSON schema in
`content/resume.schema.json` is the data contract; `pnpm validate:resume` checks
it before each production build. Profile text is public in the generated site.

## Create your version

1. Install Node.js 22.13+ and the pnpm version listed in package.json.
2. Run `pnpm install --frozen-lockfile`.
3. Start from `content/examples/alex-taylor.json` (fictional), not the owner's
   active profile. Replace its content with your own and save a draft outside
   `public/`, for example `work/resume-draft.json`.
4. Run `pnpm validate:resume work/resume-draft.json`.
5. Review the facts, then replace `content/resume.json` with the approved draft.
6. Run `pnpm typecheck` and `pnpm test`. The latter creates the static build.
7. Preview with `pnpm preview`, then inspect home, all sections, dialogs,
   forward/reverse travel, mobile and night mode.
8. Upload only `dist/client` when you are ready. No server-side AI service or
   runtime credentials are needed.

Alternatively ask Codex: “Use $resume-to-profile with my attached resume to
prepare a draft for this repository.” The repository skill is at
`.agents/skills/resume-to-profile/SKILL.md`. It extracts supported facts, asks
about ambiguous information and validates a draft before replacing active data.
It needs access to a PDF/DOCX reader for those formats; pasted text also works.
This is an agent-assisted workflow, not an automatic upload service.
Manual JSON editing remains fully supported.

For a separate sample build without overwriting your profile, use
`RESUME_PROFILE=content/examples/alex-taylor.json pnpm test` (macOS/Linux).
This replaces the local build output, not the source profile. Run `pnpm test`
again to restore the default build before deploying. The same variable works
with `pnpm dev`. Restart the dev server when choosing a different profile.

## Fields and content rules

- Identity: name, monogram, role, tagline and description. Last name may be empty.
  Location, HTTPS site URL, social description/image, email, LinkedIn and GitHub
  are optional. Omit missing optional fields rather than supplying fake links.
- Projects: stable IDs and factual summaries, contributions, stack and outcomes.
  Featured IDs must reference existing projects. Empty featured IDs select the
  first three projects; explicit selections can have any supported count.
- Skills: grouped capabilities and tools, with optional project references.
- Technologies: category names, item names and up to two representative logos.
  Unknown item names use a neutral symbol in the details gallery.
- Experience: employer name and source date text. The optional summary is
  user-supplied; otherwise the display shows the number of roles.
- Certifications: name, colour and optional local image path. Without an image,
  the platform displays a labelled plaque. Do not claim credentials you lack.
- Stations and boardCopy: five presentation descriptors in the existing order:
  Projects, Skills, Companies worked, Technologies used, Certifications.
  The `nav` values are renderer IDs and must stay unchanged. Replace all other
  copy with appropriate text. Do not retain the owner's factual claims.

All six content lists (including featured IDs) accept 0–60 entries.
The three-project folios, five-role spiral, eight-node skills compass,
eleven-category display and four-badge layout are page sizes, not resume limits.
Extra items have previous/next controls on the platform. Full details remain
available through the keyboard-accessible “Explore” / “Open notes” button.
Empty content sections have no platform or camera reading stop. The flight loop
still covers 600 units; unused space is intentional. A profile with every list
empty remains a home/sky experience without empty dialogs.

## Assets and privacy

Put licensed images in `public/`, using paths such as `/my-badge.png`.
Technology logo identifiers resolve to `/technology-logos/<id>.svg`.
Validation checks local file presence, unique IDs, references and URL syntax.
It does not establish factual accuracy, image licensing or text fit.
Keep source resumes and evidence notes outside public assets and Git; `work/`
is ignored. Do not add secrets, visa information, private addresses or identifiers.

## Still required before a public release

- Education, custom links/sections and locale support.
- Configurable decorative sky-logo atlas (currently fixed), optional neutral
  social-preview artwork and a curated public asset bundle.
- Automated extraction evaluation with diverse real-world resume formats;
  the conversion skill's structure is validated, not every extraction scenario.
- Code/asset/font redistribution audit and personal-data/Git-history audit.
- Public licence, release packaging and deployment docs reviewed against the
  chosen host. This working repository still includes its owner's assets/data.

No repository visibility change, push or deployment is implied by setup.
