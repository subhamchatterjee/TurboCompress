// image-compress.js
import fs from "fs";
import path from "path";
import sharp from "sharp";
import os from "node:os";

const inputPath = process.argv[2]; // folder path or single file
const outputDir = "output-images";

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
  let files = [];

  if (fs.existsSync(inputPath) && fs.lstatSync(inputPath).isDirectory()) {
    files = fs
      .readdirSync(inputPath)
      .filter(f => f.toLowerCase().endsWith(".jpg") || f.toLowerCase().endsWith(".jpeg"))
      .map(f => path.join(inputPath, f));
  } else {
    files = process.argv.slice(2); // single/multiple files
  }

  console.log(`📂 Found ${files.length} file(s)`);

  const concurrency = os.cpus().length;
  const chunks = [];
  for (let i = 0; i < files.length; i += concurrency) {
    chunks.push(files.slice(i, i + concurrency));
  }

  for (const chunk of chunks) {
    await Promise.all(chunk.map(processImage));
  }

  console.log("🎉 All done!");
}

main();
