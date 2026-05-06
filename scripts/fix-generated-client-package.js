const fs = require("fs");

const packagePath = "generated/typescript/airbnb-client/package.json";

if (!fs.existsSync(packagePath)) {
  console.error(`Package not found: ${packagePath}`);
  process.exit(1);
}

const pkg = JSON.parse(fs.readFileSync(packagePath, "utf8"));

pkg.scripts = pkg.scripts || {};
pkg.scripts.build = "concurrently 'npm run build:cjs' 'npm run build:es' 'npm run build:types'";

fs.writeFileSync(packagePath, JSON.stringify(pkg, null, 2));

console.log("Generated client package.json updated for npm.");
