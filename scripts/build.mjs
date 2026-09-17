import { cp, mkdir, readdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";

const outputDirectory = "dist";
const managerSourceDirectory = "src/manager";
const managerOutputDirectory = join(outputDirectory, "scripts/manager");
const realtimeSourceDirectory = "src/realtime";
const realtimeOutputDirectory = join(outputDirectory, "scripts/realtime");

await rm(outputDirectory, { recursive: true, force: true });
await mkdir(join(outputDirectory, "realtime"), { recursive: true });
await mkdir(join(outputDirectory, "scripts"), { recursive: true });
await mkdir(managerOutputDirectory, { recursive: true });
await mkdir(realtimeOutputDirectory, { recursive: true });
await writeFile(join(outputDirectory, ".assetsignore"), "**/.DS_Store\n");

await cp("public", outputDirectory, { recursive: true });
await cp("src/pages/manager.html", join(outputDirectory, "index.html"));
await cp("src/realtime/index.html", join(outputDirectory, "realtime/index.html"));
await cp("src/pwa/manifest.webmanifest", join(outputDirectory, "manifest.webmanifest"));
await cp("src/pwa/service-worker.js", join(outputDirectory, "sw.js"));
await cp("src/styles", join(outputDirectory, "styles"), { recursive: true });
await cp("THIRD_PARTY_LICENSE.txt", join(outputDirectory, "THIRD_PARTY_LICENSE.txt"));

const managerScripts = (await readdir(managerSourceDirectory))
  .filter(file => file.endsWith(".js"));

await Promise.all(managerScripts.map(file =>
  cp(join(managerSourceDirectory, file), join(managerOutputDirectory, file))
));

const realtimeScripts = (await readdir(realtimeSourceDirectory))
  .filter(file => file.endsWith(".js"));

await Promise.all(realtimeScripts.map(file =>
  cp(join(realtimeSourceDirectory, file), join(realtimeOutputDirectory, file))
));
