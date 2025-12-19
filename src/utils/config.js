const fs = require('fs');
const path = require('path');

const CONFIG_FILE = 'atm.json';

function getConfigPath() {
  return path.join(process.cwd(), CONFIG_FILE);
}

function configExists() {
  return fs.existsSync(getConfigPath());
}

function readConfig() {
  const content = fs.readFileSync(getConfigPath(), 'utf8');
  return JSON.parse(content);
}

function writeConfig(config) {
  fs.writeFileSync(getConfigPath(), JSON.stringify(config, null, 2) + '\n');
}

module.exports = {
  configExists,
  readConfig,
  writeConfig,
};
