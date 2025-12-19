const { version } = require('../../package.json');

function showVersion() {
  console.log(version);
}

module.exports = { showVersion };
