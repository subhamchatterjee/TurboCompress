import express from "express";
import http from "http";
import multer from "multer";
import cors from "cors";
import crypto from "crypto";
import { Server } from "socket.io";
import fs from "fs";
import path from "path";
import archiver from "archiver";
import { v4 as uuidv4 } from "uuid";
import { spawn } from "child_process";

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

const imageExt = [".jpg", ".jpeg"];
const videoExt = [".mp4"];

app.use(cors());
app.use(express.json());
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError || err.message.includes("Invalid")) {
    return res.status(400).json({ error: err.message });
  }
  next(err);
});

function fileFilter(type) {
  return (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();

    const allowed = type === "image" ? imageExt : videoExt;

    if (!allowed.includes(ext)) {
      return cb(new Error(`Invalid file type: ${ext}`), false);
    }

    cb(null, true);
  };
}

const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const unique = crypto.randomUUID();
    cb(null, unique + ext);
  }
});

const uploadImage = multer({
  storage,
  fileFilter: fileFilter("image"),
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB
});
const uploadVideo = multer({
  storage,
  fileFilter: fileFilter("video"),
  limits: { fileSize: 2 * 1024 * 1024 * 1024 } // 2GB
});

if (!fs.existsSync("jobs")) fs.mkdirSync("jobs");

io.on("connection", socket => {
  console.log("Client connected");
});

function runScript(script, args, jobId) {
  return new Promise((resolve, reject) => {
    const proc = spawn("node", [script, ...args]);

    proc.stdout.on("data", data => {
      io.emit("progress", {
        jobId,
        message: data.toString()
      });
    });

    proc.stderr.on("data", data => {
      io.emit("progress", {
        jobId,
        message: "ERROR: " + data.toString()
      });
    });

    proc.on("close", code => {
      if (code === 0) resolve();
      else reject(new Error("Process failed"));
    });
  });
}

function zipFolder(source, out) {
  return new Promise((resolve, reject) => {
    const archive = archiver("zip", { zlib: { level: 9 } });
    const stream = fs.createWriteStream(out);

    archive.directory(source, false);
    archive.pipe(stream);

    stream.on("close", resolve);
    archive.on("error", reject);

    archive.finalize();
  });
}

async function handleJob(files, type, jobId) {
  const jobDir = `jobs/${jobId}`;
  const outputDir = `${jobDir}/output`;

  fs.mkdirSync(jobDir, { recursive: true });
  fs.mkdirSync(outputDir, { recursive: true });

  const filePaths = files.map(f => path.resolve(f.path));

  const script = type === "image"
    ? "image-compress.js"
    : "video-compress.js";

  await runScript(script, [...filePaths, outputDir], jobId);

  const zipPath = `${jobDir}/result-${jobId}.zip`;
  await zipFolder(outputDir, zipPath);

  // ✅ CLEAN UP UPLOADS
  for (const f of files) {
    try {
      fs.unlinkSync(f.path);
    } catch (e) {
      console.warn("Cleanup failed:", f.path);
    }
  }

  io.emit("progress", { jobId, message: "DONE" });
}

app.post("/upload/image", uploadImage.array("files"), async (req, res) => {
  const jobId = uuidv4();

  handleJob(req.files, "image", jobId)
    .catch(err => console.error(err));

  res.json({ jobId });
});

app.post("/upload/video", uploadVideo.array("files"), async (req, res) => {
  const jobId = uuidv4();

  handleJob(req.files, "video", jobId)
    .catch(err => console.error(err));

  res.json({ jobId });
});

app.get("/download/:jobId", (req, res) => {
  const { jobId } = req.params;
  const zip = `jobs/${jobId}/result-${jobId}.zip`;

  if (!fs.existsSync(zip)) {
    return res.status(404).send("Not ready");
  }

  res.download(zip);
  res.on("finish", () => {
    fs.rmSync(`jobs/${jobId}`, { recursive: true, force: true });
  });
});

app.get("/ping", (req, res) => {
  return res.json({"success": true, "ping": "pong"});
});

server.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
