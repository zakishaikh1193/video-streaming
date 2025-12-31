import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

/* Fix __dirname in ES modules */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* Paths */
const UPLOAD_DIR = path.join(__dirname, "upload");
const SUB_DIR = path.join(__dirname, "subtitles");

/* Ensure subtitles folder exists */
if (!fs.existsSync(SUB_DIR)) {
  fs.mkdirSync(SUB_DIR);
}

/* Get all mp4 files */
const videos = fs.readdirSync(UPLOAD_DIR).filter(f => f.endsWith(".mp4"));

if (videos.length === 0) {
  console.log("❌ No videos found in upload folder");
  process.exit(0);
}

for (const video of videos) {
  const name = path.parse(video).name;
  const videoPath = path.join(UPLOAD_DIR, video);
  const wavPath = path.join(UPLOAD_DIR, `${name}.wav`);
  const vttPath = path.join(SUB_DIR, `${name}.vtt`);

  if (fs.existsSync(vttPath)) {
    console.log(`⏩ Skipping (already exists): ${video}`);
    continue;
  }

  try {
    console.log(`🎬 Processing: ${video}`);

    console.log("🔊 Extracting audio...");
    execSync(
      `ffmpeg -y -i "${videoPath}" -vn "${wavPath}"`,
      { stdio: "inherit" }
    );

    console.log("📝 Generating subtitles...");
    execSync(
      `whisper "${wavPath}" --model base --output_format all --output_dir "${SUB_DIR}"`,
      { stdio: "inherit" }
    );

    fs.unlinkSync(wavPath);
    console.log(`✅ Done: ${name}\n`);
  } catch (err) {
    console.error(`❌ Failed: ${video}`, err.message);
  }
}

console.log("🎉 All videos processed!");
