import sharp from "sharp";

// 像素化导出的官方 UI 图标：先大幅缩小（吞掉细节），再最近邻放大回目标尺寸，
// 得到硬边像素画，跟 doretta.png / fuel_canister.png 同一套处理思路。
async function pixelate(src, dst, targetH) {
  const small = Math.max(12, Math.round(targetH / 2));
  const buf = await sharp(src)
    .resize({ height: small, fit: "inside" })
    .png()
    .toBuffer();
  const meta = await sharp(buf).metadata();
  await sharp(buf)
    .resize({ width: meta.width * 2, height: meta.height * 2, kernel: "nearest" })
    .png()
    .toFile(dst);
  const out = await sharp(dst).metadata();
  console.log(dst, out.width + "x" + out.height);
}

const base = "_tmp_export/UI/Art/Icons";
await pixelate(
  `${base}/Icons_Resources/New_Resource_Icons/Icons_Resources_Outline_Aquarq.png`,
  "public/assets/realtime/aquarq.png",
  64,
);
await pixelate(
  `${base}/Icons_Resources/New_Resource_Icons/Icon_Salvage__Mini_Mule_Leg.png`,
  "public/assets/realtime/mule_leg.png",
  64,
);
