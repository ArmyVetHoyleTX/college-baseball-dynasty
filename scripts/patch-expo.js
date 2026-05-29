// Patches expo's package.json to expose the ./config-plugins subpath.
// expo v56.0.6 ships config-plugins.js but doesn't list it in exports{},
// which Node 22 blocks due to strict package exports enforcement.
const fs = require("fs");
const path = require("path");

const expoPkgPath = path.join(__dirname, "..", "node_modules", "expo", "package.json");

if (!fs.existsSync(expoPkgPath)) {
  console.log("patch-expo: node_modules/expo not found, skipping.");
  process.exit(0);
}

const pkg = JSON.parse(fs.readFileSync(expoPkgPath, "utf8"));

if (!pkg.exports) pkg.exports = {};

const patches = {
  "./config-plugins": "./config-plugins.js",
  "./metro-config": "./metro-config.js",
};

let changed = false;
for (const [key, val] of Object.entries(patches)) {
  if (!pkg.exports[key]) {
    pkg.exports[key] = val;
    changed = true;
  }
}

if (changed) {
  fs.writeFileSync(expoPkgPath, JSON.stringify(pkg, null, 2));
  console.log("✅ patch-expo: added missing subpath exports to expo/package.json");
} else {
  console.log("patch-expo: already patched, nothing to do.");
}
