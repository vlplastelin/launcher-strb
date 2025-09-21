const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const axios = require("axios");
const extract = require("extract-zip");
const { app } = require("electron");

const MANIFEST_URL = "https://raw.githubusercontent.com/vlplastelin/launcher-strb/main/manifest.json";
const BASE_URL     = "https://raw.githubusercontent.com/vlplastelin/launcher-strb/main/";

const GAME_DIR = path.join(
  process.env.PORTABLE_EXECUTABLE_DIR || path.dirname(app.getPath("exe")),
  "minecraft"
);

function hashFile(filePath) {
  if (!fs.existsSync(filePath)) return null;
  const data = fs.readFileSync(filePath);
  return crypto.createHash("sha1").update(data).digest("hex");
}

async function downloadFile(url, dest) {
  const writer = fs.createWriteStream(dest);
  const response = await axios.get(url, { responseType: "stream" });
  response.data.pipe(writer);

  return new Promise((resolve, reject) => {
    writer.on("finish", resolve);
    writer.on("error", reject);
  });
}

async function updateFiles(pathToGameDir = GAME_DIR) {
  console.log("GAME_DIR:", pathToGameDir);
  console.log("Checking for updates...");

  const { data: manifest } = await axios.get(MANIFEST_URL);
  const { config, files } = manifest;
  console.log("config:", config);
  // --- Обновляем/докачиваем обычные файлы ---
  for (const [relPath, expectedHash] of Object.entries(files)) {
    const localPath = path.join(pathToGameDir, relPath);
    const localHash = hashFile(localPath);

    if (localHash !== expectedHash) {
      console.log(`⬇️ Updating ${relPath}...`);
      const url = BASE_URL + relPath;
      const res = await axios.get(url, { responseType: "arraybuffer" });
      fs.mkdirSync(path.dirname(localPath), { recursive: true });
      fs.writeFileSync(localPath, res.data);
    }
  }

  // --- Работа с ZIP-архивами ---
  if (config && config.zip) {
    for (const [name, { name: folderName, path: targetPath, url }] of Object.entries(config.zip)) {
      const extractPath = path.join(pathToGameDir, targetPath, folderName);
      console.log(extractPath);
      if (!fs.existsSync(extractPath)) {
        console.log(`⬇️ Downloading archive ${name} from ${url}...`);
        const zipPath = path.join(pathToGameDir, `${name}.zip`);
        await downloadFile(url, zipPath);

        console.log(`📦 Extracting ${name} to ${path.join(pathToGameDir, targetPath)}...`);
        await extract(zipPath, { dir: path.join(pathToGameDir, targetPath) });

        fs.unlinkSync(zipPath);
      } else {
        console.log(`✅ Archive ${name} already extracted at ${extractPath}, skipping download`);
      }
    }
  }

  // --- Удаляем лишние файлы только в managedDirs ---
  if (config && Array.isArray(config.managedDirs)) {
    for (const dir of config.managedDirs) {
      const fullDir = path.join(pathToGameDir, dir);
      if (!fs.existsSync(fullDir)) continue;

      for (const file of fs.readdirSync(fullDir)) {
        const relPath = path.join(dir, file).replace(/\\/g, "/");
        if (!files[relPath]) {
          console.log(`🗑 Removing extra file: ${relPath}`);
          fs.rmSync(path.join(fullDir, file), { recursive: true, force: true });
        }
      }
    }
  }

  console.log("✅ All good!");
}

module.exports = { updateFiles };
