import { randomBytes } from "node:crypto";
import { cp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import sharp from "sharp";

const outputDirectory = "dist";
const managerSourceDirectory = "src/manager";
const managerOutputDirectory = join(outputDirectory, "scripts/manager");
const realtimeSourceDirectory = "src/realtime";
const buildVersion = `${Date.now().toString(36)}-${randomBytes(4).toString("hex")}`;
const realtimeOutputDirectory = join(outputDirectory, "scripts/realtime");

await rm(outputDirectory, { recursive: true, force: true });
await mkdir(join(outputDirectory, "scripts"), { recursive: true });
await mkdir(managerOutputDirectory, { recursive: true });
await mkdir(realtimeOutputDirectory, { recursive: true });
await writeFile(join(outputDirectory, ".assetsignore"), "**/.DS_Store\n");

await cp("public", outputDirectory, { recursive: true });

const atlasInputDirectory = "public/assets/img";
const atlasOutputDirectory = join(outputDirectory, "assets/generated");
const atlasSize = 2048;
const atlasPadding = 2;
const atlasFiles = (await readdir(atlasInputDirectory))
  .filter(file => /\.(png|webp)$/i.test(file));
const atlasSprites = await Promise.all(atlasFiles.map(async file => {
  const metadata = await sharp(join(atlasInputDirectory, file)).metadata();
  if (!metadata.width || !metadata.height) throw new Error(`Cannot read image dimensions: ${file}`);
  if (metadata.width + atlasPadding > atlasSize || metadata.height + atlasPadding > atlasSize) {
    throw new Error(`Image exceeds ${atlasSize}px atlas limit: ${file}`);
  }
  return { file, width: metadata.width, height: metadata.height };
}));
atlasSprites.sort((left, right) => right.height - left.height || right.width - left.width);

const atlasPages = [];
for (const sprite of atlasSprites) {
  let placement;
  for (let pageIndex = 0; pageIndex < atlasPages.length && !placement; pageIndex++) {
    const page = atlasPages[pageIndex];
    for (const row of page.rows) {
      if (sprite.height <= row.height && row.x + sprite.width + atlasPadding <= atlasSize) {
        placement = { page: pageIndex, x: row.x, y: row.y };
        row.x += sprite.width + atlasPadding;
        page.width = Math.max(page.width, row.x);
        break;
      }
    }
    if (!placement && page.height + sprite.height + atlasPadding <= atlasSize) {
      placement = { page: pageIndex, x: 0, y: page.height };
      page.rows.push({
        x: sprite.width + atlasPadding,
        y: page.height,
        height: sprite.height + atlasPadding,
      });
      page.width = Math.max(page.width, sprite.width + atlasPadding);
      page.height += sprite.height + atlasPadding;
    }
  }
  if (!placement) {
    const page = {
      width: sprite.width + atlasPadding,
      height: sprite.height + atlasPadding,
      rows: [{
        x: sprite.width + atlasPadding,
        y: 0,
        height: sprite.height + atlasPadding,
      }],
      sprites: [],
    };
    atlasPages.push(page);
    placement = { page: atlasPages.length - 1, x: 0, y: 0 };
  }
  atlasPages[placement.page].sprites.push({ ...sprite, ...placement });
}

await mkdir(atlasOutputDirectory, { recursive: true });
const atlasManifest = { version: 1, pages: [], frames: {} };
for (let pageIndex = 0; pageIndex < atlasPages.length; pageIndex++) {
  const page = atlasPages[pageIndex];
  const width = Math.max(1, page.width - atlasPadding);
  const height = Math.max(1, page.height - atlasPadding);
  const file = `realtime-atlas-${pageIndex}.webp`;
  await sharp({
    create: {
      width,
      height,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite(page.sprites.map(sprite => ({
      input: join(atlasInputDirectory, sprite.file),
      left: sprite.x,
      top: sprite.y,
    })))
    .webp({ lossless: true, effort: 4 })
    .toFile(join(atlasOutputDirectory, file));
  atlasManifest.pages.push({ file, width, height });
  for (const sprite of page.sprites) {
    atlasManifest.frames[sprite.file] = {
      page: pageIndex,
      x: sprite.x,
      y: sprite.y,
      width: sprite.width,
      height: sprite.height,
    };
  }
}
await writeFile(
  join(atlasOutputDirectory, "realtime-atlas.json"),
  `${JSON.stringify(atlasManifest)}\n`,
);
const [managerHtml, realtimeShell, serviceWorker] = await Promise.all([
  readFile("src/pages/manager.html", "utf8"),
  readFile("src/realtime/shell.html", "utf8"),
  readFile("src/pwa/service-worker.js", "utf8"),
]);
if (!managerHtml.includes("<!-- REALTIME_SHELL -->")) {
  throw new Error("manager.html is missing the realtime shell marker");
}
const assembledHtml = managerHtml
  .replace("<!-- REALTIME_SHELL -->", realtimeShell)
  .replace(
    "</head>",
    `<meta name="drg-build-version" content="${buildVersion}">\n</head>`,
  );
const versionedHtml = assembledHtml.replace(
  /((?:src|href)=")([^"?]+\.(?:js|css|webmanifest))(?:\?[^"]*)?(")/g,
  (_, prefix, assetPath, suffix) => `${prefix}${assetPath}?v=${buildVersion}${suffix}`,
);
await writeFile(join(outputDirectory, "index.html"), versionedHtml);
await cp("src/pwa/manifest.webmanifest", join(outputDirectory, "manifest.webmanifest"));
await writeFile(
  join(outputDirectory, "sw.js"),
  serviceWorker.replaceAll("__BUILD_VERSION__", buildVersion),
);
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
