const express = require("express");
const fileUpload = require("express-fileupload");
const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(express.static("public"));
app.use(fileUpload());

let clients = [];

app.get("/logs", (req, res) => {
  res.set({
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    "Connection": "keep-alive"
  });
  res.flushHeaders();
  clients.push(res);
});

function sendLog(msg) {
  clients.forEach(c => c.write(`data: ${msg}\n\n`));
}

app.post("/upload", (req, res) => {
  if (!req.files) return res.send("no file");
  const file = req.files.file;
  const uploadPath = path.join(__dirname, "resi.xlsx");

  file.mv(uploadPath, err => {
    if (err) return res.send("upload gagal");
    sendLog("File resi.xlsx berhasil upload");
    res.send("ok");
  });
});

app.get("/run", (req, res) => {
  sendLog("Memulai tracking...");
  const proc = spawn("node", [path.join(__dirname, "tracking.js")]);

  proc.stdout.on("data", data => sendLog(data.toString()));
  proc.stderr.on("data", data => sendLog("ERROR: " + data.toString()));
  proc.on("close", code => sendLog("Tracking selesai"));

  res.send("started");
});

app.get("/download", (req, res) => {
  const hasilPath = path.join(__dirname, "hasil_spx.xlsx");
  if (fs.existsSync(hasilPath)) {
    res.download(hasilPath);
  } else {
    res.send("file hasil belum ada");
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server jalan di http://localhost:${PORT}`);
});

const path = require("path");

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});
