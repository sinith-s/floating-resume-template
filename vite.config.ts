import vinext from "vinext";
import { defineConfig } from "vite";
import path from "node:path";
import {fileURLToPath} from "node:url";

// Static portfolio: no Worker bindings, database, or hosting-service plugin.
export default defineConfig({
  resolve: {alias: {"#resume-profile": path.resolve(fileURLToPath(new URL(".",import.meta.url)),process.env.RESUME_PROFILE??"content/resume.json")}},
  plugins: [vinext()],
  server: process.env.CODEX_SANDBOX === "seatbelt"
    ? { watch: { useFsEvents: false, usePolling: true } }
    : undefined,
});
