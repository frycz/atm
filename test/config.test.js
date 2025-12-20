const { describe, it, mock, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const path = require('path');
const fs = require('fs');

// Store original fs functions
const originalExistsSync = fs.existsSync;
const originalReadFileSync = fs.readFileSync;
const originalWriteFileSync = fs.writeFileSync;

describe('config', () => {
  let originalCwd;
  let mockExistsResult;
  let mockReadResult;
  let writeFileCalls;

  beforeEach(() => {
    originalCwd = process.cwd;
    process.cwd = () => '/fake/path';
    mockExistsResult = true;
    mockReadResult = '{}';
    writeFileCalls = [];

    // Mock fs functions but only for atm.json paths
    fs.existsSync = (filepath) => {
      if (filepath.includes('atm.json')) {
        return mockExistsResult;
      }
      return originalExistsSync(filepath);
    };

    fs.readFileSync = (filepath, encoding) => {
      if (filepath.includes('atm.json')) {
        return mockReadResult;
      }
      return originalReadFileSync(filepath, encoding);
    };

    fs.writeFileSync = (filepath, content) => {
      if (filepath.includes('atm.json')) {
        writeFileCalls.push({ filepath, content });
        return;
      }
      return originalWriteFileSync(filepath, content);
    };

    // Clear module cache
    delete require.cache[require.resolve('../src/utils/config.js')];
  });

  afterEach(() => {
    process.cwd = originalCwd;
    fs.existsSync = originalExistsSync;
    fs.readFileSync = originalReadFileSync;
    fs.writeFileSync = originalWriteFileSync;
    delete require.cache[require.resolve('../src/utils/config.js')];
  });

  describe('configExists', () => {
    it('returns true when atm.json exists', () => {
      mockExistsResult = true;

      const { configExists } = require('../src/utils/config.js');

      assert.strictEqual(configExists(), true);
    });

    it('returns false when atm.json does not exist', () => {
      mockExistsResult = false;

      const { configExists } = require('../src/utils/config.js');

      assert.strictEqual(configExists(), false);
    });
  });

  describe('readConfig', () => {
    it('reads and parses atm.json', () => {
      const configData = { defaultCommitMessage: 'save' };
      mockReadResult = JSON.stringify(configData);

      const { readConfig } = require('../src/utils/config.js');

      const result = readConfig();
      assert.deepStrictEqual(result, configData);
    });

    it('throws on invalid JSON', () => {
      mockReadResult = 'not valid json';

      const { readConfig } = require('../src/utils/config.js');

      assert.throws(() => readConfig(), SyntaxError);
    });
  });

  describe('writeConfig', () => {
    it('writes config as formatted JSON', () => {
      const { writeConfig } = require('../src/utils/config.js');

      const config = { defaultCommitMessage: 'save' };
      writeConfig(config);

      assert.strictEqual(writeFileCalls.length, 1);
      assert.strictEqual(
        writeFileCalls[0].filepath,
        path.join('/fake/path', 'atm.json')
      );
      assert.strictEqual(
        writeFileCalls[0].content,
        JSON.stringify(config, null, 2) + '\n'
      );
    });
  });
});
