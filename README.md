# TurboCompress ⚡

TurboCompress is a fast, web-based image and video compression tool built with Node.js.
It supports batch uploads, real-time progress tracking, and automatic ZIP download of processed files.

Designed to run locally or on AWS with minimal cost.

---

## ✨ Features

* Image compression (JPEG / PNG / WebP)
* Video compression with ffmpeg
* Automatic video splitting for large files
* Batch upload support
* Real-time compression progress (WebSocket)
* ZIP download of all processed files
* Job isolation (no file conflicts)
* Auto cleanup of temporary files
* Lightweight frontend UI
* AWS EC2 deployment ready

---

## 🛠 Tech Stack

* Node.js + Express
* Sharp (image processing)
* FFmpeg (video compression)
* Socket.IO (live progress)
* Multer (file uploads)
* Archiver (ZIP packaging)
* Vanilla JS frontend

---

## 📁 Project Structure

```
compressor-app/
  backend/
    server.js
    image-compress.js
    video-compress.js

  frontend/
    index.html
    script.js
    style.css

local/
  output-images/
  output-videos/
  image-compress.js
  video-compress.js
```

---


## 🚀 Running locally

```
cd local
npm install
node image-compress.js /path/to/images/folder
node video-compress.js /path/to/videos/folder
```

---

## ☁ Deploy on AWS

TurboCompress runs smoothly on AWS EC2 Free Tier.

1. Launch Ubuntu EC2 instance
2. Install Node + ffmpeg
3. Clone repo
4. Run with PM2

Detailed deployment guide coming soon.

---

## 🔒 Limits

File types and sizes are restricted for safety:

Images: `.jpg .jpeg`
Videos: `.mp4`

---

## 📌 Roadmap

* Increase file type support
* Drag & drop uploader
* Per-file progress bars
* Cancel compression
* Job history UI
* Docker support

---

## 📜 License

MIT License

---

Made with ⚡ for fast media compression.
