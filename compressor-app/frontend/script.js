const socket = io("http://localhost:3000");
const acceptMap = {
  image: ".jpg,.jpeg",
  video: ".mp4"
};

let currentJob = null;

socket.on("progress", data => {
  if (data.jobId !== currentJob) return;

  const box = document.getElementById("progress");

  if (data.message === "DONE") {
    box.innerHTML += "<p>✅ Finished</p>";

    const downloadLink = document.getElementById("download");
    downloadLink.href = `http://localhost:3000/download/${currentJob}`;
    downloadLink.classList.add("ready");
    return;
  }

  box.innerHTML += `<p>${data.message}</p>`;
  box.scrollTop = box.scrollHeight;
});

function updateAccept() {
  const type = document.getElementById("type").value;
  const input = document.getElementById("files");

  input.accept = acceptMap[type];
  input.value = ""; // reset selection when switching mode
  handleFileChange();
}

async function upload() {
  const type = document.getElementById("type").value;
  const files = document.getElementById("files").files;
  const progress = document.getElementById("progress");
  const downloadLink = document.getElementById("download");

  if (!files.length) return alert("Select files");

  progress.innerHTML = "";
  downloadLink.classList.remove("ready");
  progress.classList.toggle("uploading", files.length > 0);

  const form = new FormData();
  for (const f of files) form.append("files", f);

  try {
    const res = await fetch(`http://localhost:3000/upload/${type}`, {
      method: "POST",
      body: form
    });

    // ✅ backend returned error status
    if (!res.ok) {
      const err = await res.text();
      throw new Error(err || "Upload failed");
    }

    const data = await res.json();
    currentJob = data.jobId;

    progress.innerHTML =
      `<p>🚀 Job started: ${currentJob}</p>`;

  } catch (err) {
    progress.innerHTML =
      `<p style="color:red;">❌ Job Failed: ${err.message}</p>`;
  }
}

function handleFileChange() {
  const input = document.getElementById("files");
  const progress = document.getElementById("progress");
  const downloadLink = document.getElementById("download");
  const uploadContainer = document.getElementById("upload-container");

  progress.innerHTML = "";
  downloadLink.classList.remove("ready");
  progress.classList.remove("uploading");
  uploadContainer.classList.toggle("uploading", input.files.length > 0);
}

updateAccept();
