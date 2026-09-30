# Design and architecture

Anime-inspired floating rock islands: white enamel decks, cobalt edges, gold brackets and crisp outlined structures. Barlow Condensed is the main display voice. Preserve legibility over ornamental motion.

Day: pale blue upper sky, irregular woodland greens, blue lakes/ponds/branching rivers and atmospheric haze. Night: dark sky, sparse stars, cool neon islands and warm golden settlements on land. Backgrounds are procedural, not zooming images.

The reversible 600-unit route flows between five stations at different heights and returns to the home identity. Stations float subtly, face the camera and slide aside. Shared reveals use the 78-to-36 depth window in stationReveal.ts.

## Source map (under app/)

Personal content lives in `content/resume.json`, validated against
`content/resume.schema.json` by `pnpm validate:resume` before builds. See
`docs/profile-format.md` for setup, optional sections and paged displays.

- FlightExperience.tsx, flightPath.ts, flightMotion.ts, stationReveal.ts: camera, loop, readiness and motion math.
- MangaPlatform.tsx, PlatformEngraving.tsx: shared islands and deck labels.
- ProjectDock.tsx, ProjectReader.tsx, projectCatalog.ts: projects.
- SkillsCompass.tsx, SkillsReader.tsx, skillsCatalog.ts: capabilities.
- ExperienceTimeline.tsx: company timeline and shared labels.
- TechnologyDisplay.tsx, TechnologyGallery.tsx, technologyCatalog.ts: category displays and details.
- CertificationBadges.tsx, badgeLayout.ts: expanding credential badges.
- CardGridBoard.tsx: shared board and platform-preview reference.
- AdaptiveSky.tsx, DayNight.tsx: procedural environment and themes.
- AmbientMusic.tsx: original opt-in ambient score.
- JourneyLoader.tsx: minimal welcome state and failure recovery.
- page.tsx, globals.css: home, dialogs, controls and responsive layout.

## Performance

Warm station assets before travel; memoize the scene independently from progress UI. Traverse materials only while fading. Hidden dialogs must not fetch the entire logo gallery during scroll. Preserve reduced-motion handling and audio cleanup. Real-device testing and complete accessibility validation remain ongoing work.
