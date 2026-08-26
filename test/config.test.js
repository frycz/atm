const { describe, it, mock, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const path = require('path');
const fs = require('fs');
const os = require('os');

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

describe('config lookup in real directories', () => {
  let originalCwd;
  let tmpRoot;
  let projectDir;
  let nestedDir;

  beforeEach(() => {
    originalCwd = process.cwd;
    // Real temp tree: <tmpRoot>/project/atm.json and <tmpRoot>/project/a/b
    tmpRoot = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'atm-test-')));
    projectDir = path.join(tmpRoot, 'project');
    nestedDir = path.join(projectDir, 'a', 'b');
    fs.mkdirSync(nestedDir, { recursive: true });
    fs.writeFileSync(
      path.join(projectDir, 'atm.json'),
      JSON.stringify({ defaultCommitMessage: 'save' }, null, 2) + '\n'
    );
    delete require.cache[require.resolve('../src/utils/config.js')];
  });

  afterEach(() => {
    process.cwd = originalCwd;
    fs.rmSync(tmpRoot, { recursive: true, force: true });
    delete require.cache[require.resolve('../src/utils/config.js')];
  });

  it('finds atm.json in a parent directory', () => {
    process.cwd = () => nestedDir;

    const { findConfigDir, configExists, readConfig } = require('../src/utils/config.js');

    assert.strictEqual(findConfigDir(), projectDir);
    assert.strictEqual(configExists(), true);
    assert.deepStrictEqual(readConfig(), { defaultCommitMessage: 'save' });
  });

  it('finds atm.json in the current directory', () => {
    process.cwd = () => projectDir;

    const { findConfigDir } = require('../src/utils/config.js');

    assert.strictEqual(findConfigDir(), projectDir);
  });

  it('stops at the closest atm.json when projects are nested', () => {
    fs.writeFileSync(path.join(nestedDir, 'atm.json'), '{}\n');
    process.cwd = () => nestedDir;

    const { findConfigDir } = require('../src/utils/config.js');

    assert.strictEqual(findConfigDir(), nestedDir);
  });

  it('returns null when no atm.json exists up to the root', () => {
    fs.rmSync(path.join(projectDir, 'atm.json'));
    process.cwd = () => nestedDir;

    const { findConfigDir, configExists } = require('../src/utils/config.js');

    assert.strictEqual(findConfigDir(), null);
    assert.strictEqual(configExists(), false);
  });

  it('accepts an explicit start directory', () => {
    process.cwd = () => tmpRoot;

    const { findConfigDir } = require('../src/utils/config.js');

    assert.strictEqual(findConfigDir(nestedDir), projectDir);
    assert.strictEqual(findConfigDir(), null);
  });

  it('configExistsHere ignores atm.json in parent directories', () => {
    process.cwd = () => nestedDir;

    const { configExistsHere, configExists } = require('../src/utils/config.js');

    assert.strictEqual(configExistsHere(), false);
    assert.strictEqual(configExists(), true);
  });

  it('writeConfig writes to the current directory, not the found root', () => {
    process.cwd = () => nestedDir;

    const { writeConfig } = require('../src/utils/config.js');

    writeConfig({ defaultCommitMessage: 'nested' });

    assert.deepStrictEqual(
      JSON.parse(fs.readFileSync(path.join(nestedDir, 'atm.json'), 'utf8')),
      { defaultCommitMessage: 'nested' }
    );
  });
});
