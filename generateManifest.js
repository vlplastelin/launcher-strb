const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const ROOT_DIR = "minecraft";
const manifest = { files: {} };

// Загружаем config.json
let config = {};
if (fs.existsSync("config.json")) {
  config = JSON.parse(fs.readFileSync("config.json", "utf8"));
}
manifest.config = config;

function hashFile(filePath) {
  const data = fs.readFileSync(filePath);
  return crypto.createHash("sha1").update(data).digest("hex");
}

function walk(dir, base = "") {
  for (const file of fs.readdirSync(dir)) {
    const fullPath = path.join(dir, file);
    const relPath = path.join(base, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      walk(fullPath, relPath);
    } else {
      manifest.files[relPath.replace(/\\/g, "/")] = hashFile(fullPath);
    }
  }
}

if (fs.existsSync(ROOT_DIR)) {
  walk(ROOT_DIR, ROOT_DIR);
}

fs.writeFileSync("manifest.json", JSON.stringify(manifest, null, 2));
console.log("✅ manifest.json создан с учётом config.json!");
