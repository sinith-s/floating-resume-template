# Static deployment

Use Node.js 22.13+ and pnpm 11.19.0.

```sh
pnpm install --frozen-lockfile
pnpm typecheck
pnpm test
```

Upload the contents of **dist/client** to Cloudflare static hosting. For a Git-connected build, use build command `pnpm build` and output directory `dist/client`.

No Worker, database, runtime environment variables or paid services are needed. Do not upload dist/server, node_modules or source code as static assets.

`pnpm preview` uses Python 3 to serve http://127.0.0.1:4173/. Use /platform-preview.html on this simple server for the secondary reference view.

Check home load, all stations, reverse travel, loop boundary, day/night, notes and music before publishing. Music requires a click and defaults off. A local build does not update the live website.

The optional tests/scroll-pacing.html harness is excluded from the build. See docs/qa/SCROLL-PERFORMANCE-QA.md for measurement limitations.
