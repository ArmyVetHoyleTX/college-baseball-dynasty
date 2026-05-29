// expo v56.0.6 has an empty exports:{} in its package.json.
// Node 22 strictly blocks ALL subpath access when exports exists,
// even for files that physically exist in the package.
// Removing the exports field restores normal file resolution.
const fs = require("fs");
const path = require("path");

const targets = [
  path.join(__dirname, "..", "node_modules", "expo", "package.json"),
];

for (const pkgPath of targets) {
  if (!fs.existsSync(pkgPath)) continue;

  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));

  if (pkg.exports !== undefined && Object.keys(pkg.exports).length === 0) {
    delete pkg.exports;
    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
    console.log(`✅ patch-expo: removed empty exports field from ${path.relative(process.cwd(), pkgPath)}`);
  } else if (pkg.exports === undefined) {
    console.log(`patch-expo: ${path.relative(process.cwd(), pkgPath)} already clean.`);
  } else {
    console.log(`patch-expo: ${path.relative(process.cwd(), pkgPath)} has non-empty exports, skipping.`);
  }
}
