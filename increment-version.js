const fs = require('fs');
const path = require('path');

const versionPath = path.join(__dirname, 'src', 'version.json');

try {
  // Read current version
  const versionData = JSON.parse(fs.readFileSync(versionPath, "utf8"));
  const currentVersion = versionData.version;

  // Parse version (assuming format x.y.z)
  const [major, minor, patch] = currentVersion.split(".").map(Number);

  // Increment patch version
  const newVersion = `${major}.${minor}.${patch + 1}`;

  // Write back to file
  const newVersionData = { version: newVersion };
  fs.writeFileSync(versionPath, JSON.stringify(newVersionData, null, 2));

  console.log(`Version incremented from ${currentVersion} to ${newVersion}`);
} catch (error) {
  console.error("Error incrementing version:", error);
  process.exit(1);
}