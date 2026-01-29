// video-compress.js
import fs from "fs";
import path from "path";
import ffmpeg from "fluent-ffmpeg";

const args = process.argv.slice(2);
const outputDir = args.pop();
const files = args;
const splitSeconds = 180; // 3 minutes

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir);
}

// get video duration
function getVideoDuration(file) {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(file, (err, metadata) => {
      if (err) return reject(err);
      resolve(metadata.format.duration);
    });
  });
}

function compressVideo(file) {
  return new Promise(async (resolve, reject) => {
    const fileName = path.basename(file, path.extname(file));
    let outputPath;

    try {
      const duration = await getVideoDuration(file);

      if (duration > splitSeconds) {
        // Longer than 3 mins → split
        outputPath = path.join(outputDir, fileName + "_part%03d.mp4");
        const numParts = Math.ceil(duration / splitSeconds);

        // check if all parts already exist
        let allExist = true;
        for (let i = 1; i <= numParts; i++) {
          const partFile = outputPath.replace("%03d", String(i).padStart(3, "0"));
          if (!fs.existsSync(partFile)) {
            allExist = false;
            break;
          }
        }
        if (allExist) {
          console.log(`⏭ Skipping (all parts exist): ${fileName}`);
          return resolve();
        }

        console.log(`🎬 Compressing & Splitting: ${fileName}`);

        ffmpeg(file)
          .outputOptions([
            "-c:v libx264",
            "-preset medium",
            "-crf 23",
            "-pix_fmt yuv420p",        // Crucial: Forces 8-bit compatibility
            "-profile:v main",         // Optional: Ensures compatibility with older devices
            "-level 4.0",              // Optional: Standard for mobile devices
            "-movflags +faststart", 
            "-c:a aac",
            "-b:a 192k",
            "-f segment",
            `-segment_time ${splitSeconds}`,
            "-reset_timestamps 1"
          ])
          .on("end", () => {
            console.log(`✅ Done: ${fileName} (split)`);
            resolve();
          })
          .on("error", err => {
            console.error(`❌ Failed: ${fileName}`, err.message);
            reject(err);
          })
          .save(outputPath);

      } else {
        // Shorter than 3 mins → single compressed file
        outputPath = path.join(outputDir, fileName + ".mp4");

        if (fs.existsSync(outputPath)) {
          console.log(`⏭ Skipping (already exists): ${fileName}`);
          return resolve();
        }

        console.log(`🎬 Compressing: ${fileName}`);

        ffmpeg(file)
          .outputOptions([
            "-c:v libx264",
            "-preset medium",
            "-crf 23",
            "-pix_fmt yuv420p",        // Crucial: Forces 8-bit compatibility
            "-profile:v main",         // Optional: Ensures compatibility with older devices
            "-level 4.0",              // Optional: Standard for mobile devices
            "-movflags +faststart", 
            "-c:a aac",
            "-b:a 192k"
          ])
          .on("end", () => {
            console.log(`✅ Done: ${fileName}`);
            resolve();
          })
          .on("error", err => {
            console.error(`❌ Failed: ${fileName}`, err.message);
            reject(err);
          })
          .save(outputPath);
      }
    } catch (err) {
      console.error(`❌ Could not process: ${file}`, err.message);
      reject(err);
    }
  });
}

async function main() {
  if (!files.length) {
    console.error(`❌ No input files provided`);
    process.exit(1);
  }

  console.log(`📂 Found ${files.length} video(s)`);

  for (const file of files) {
    await compressVideo(file);
  }

  console.log(`🎉 All videos processed!`);
}

main();
