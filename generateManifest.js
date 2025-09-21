const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const ROOT_DIR = "minecraft"; // папка, которую сканируем
const manifest = {};

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
      manifest[relPath.replace(/\\/g, "/")] = hashFile(fullPath);
    }
  }
}

walk(ROOT_DIR, ROOT_DIR);

fs.writeFileSync("manifest.json", JSON.stringify(manifest, null, 2));
console.log("✅ manifest.json создан!");
