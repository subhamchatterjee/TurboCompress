// image-compress.js
import fs from "fs";
import path from "path";
import sharp from "sharp";
import os from "node:os";

const args = process.argv.slice(2);
const outputDir = args.pop();
const files = args;

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir);
}

async function processImage(file) {
  const fileName = path.basename(file);
  const outputPath = path.join(outputDir, fileName);

  // ✅ Skip if already exists
  if (fs.existsSync(outputPath)) {
    console.log(`⏭ Skipping (already exists): ${fileName}`);
    return;
  }

  try {
    await sharp(file)
      .rotate() // auto-orient
      .resize({
        width: 3840,
        height: 2160,
        fit: "inside",
        withoutEnlargement: true
      })
      .jpeg({
        quality: 85,
        mozjpeg: true,
        progressive: true,
        trellisQuantisation: true,
        overshootDeringing: true,
        optimiseScans: true
      })
      .toFile(outputPath);

    console.log(`✅ Processed: ${fileName}`);
  } catch (err) {
    console.error(`❌ Failed: ${fileName}`, err.message);
  }
}

async function main() {
  console.log(`📂 Found ${files.length} file(s)`);

  const concurrency = os.cpus().length;
  const chunks = [];

  for (let i = 0; i < files.length; i += concurrency) {
    chunks.push(files.slice(i, i + concurrency));
  }

  for (const chunk of chunks) {
    await Promise.all(chunk.map(processImage));
  }

  console.log(`🎉 All done!`);
}

main();
