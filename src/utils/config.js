const fs = require('fs');
const path = require('path');

const CONFIG_FILE = 'atm.json';

// Walk up from startDir to the filesystem root looking for atm.json,
// the same way git discovers .git.
function findConfigDir(startDir) {
  let dir = path.resolve(startDir || process.cwd());

  while (true) {
    if (fs.existsSync(path.join(dir, CONFIG_FILE))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}

function getConfigPath() {
  const dir = findConfigDir();
  return path.join(dir || process.cwd(), CONFIG_FILE);
}

// True when atm.json exists in the current directory or any of its parents.
function configExists() {
  return findConfigDir() !== null;
}

// True only when atm.json exists in the current directory itself.
function configExistsHere() {
  return fs.existsSync(path.join(process.cwd(), CONFIG_FILE));
}

function readConfig() {
  const content = fs.readFileSync(getConfigPath(), 'utf8');
  return JSON.parse(content);
}

function writeConfig(config) {
  const configPath = path.join(process.cwd(), CONFIG_FILE);
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n');
}

module.exports = {
  findConfigDir,
  configExists,
  configExistsHere,
  readConfig,
  writeConfig,
};
