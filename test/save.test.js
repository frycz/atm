const { describe, it, mock, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');

describe('save command', () => {
  let mockConfigExists;
  let mockReadConfig;
  let mockGitAdd;
  let mockGitCommit;
  let mockGitPush;
  let mockConsoleError;
  let mockConsoleLog;
  let mockProcessExit;
  let configModule;
  let gitModule;

  beforeEach(() => {
    // Mock config module
    configModule = require('../src/utils/config.js');
    mockConfigExists = mock.method(configModule, 'configExists');
    mockReadConfig = mock.method(configModule, 'readConfig');

    // Mock git module
    gitModule = require('../src/utils/git.js');
    mockGitAdd = mock.method(gitModule, 'gitAdd');
    mockGitCommit = mock.method(gitModule, 'gitCommit');
    mockGitPush = mock.method(gitModule, 'gitPush');

    // Mock console
    mockConsoleError = mock.method(console, 'error');
    mockConsoleLog = mock.method(console, 'log');

    // Mock process.exit to prevent actually exiting
    mockProcessExit = mock.method(process, 'exit');
    mockProcessExit.mock.mockImplementation(() => {
      throw new Error('process.exit called');
    });
  });

  afterEach(() => {
    mock.restoreAll();
    delete require.cache[require.resolve('../src/utils/config.js')];
    delete require.cache[require.resolve('../src/utils/git.js')];
    delete require.cache[require.resolve('../src/commands/save.js')];
  });

  it('exits with error when config does not exist', () => {
    mockConfigExists.mock.mockImplementation(() => false);

    delete require.cache[require.resolve('../src/commands/save.js')];
    const { save } = require('../src/commands/save.js');

    assert.throws(() => save(), /process\.exit called/);
    assert.strictEqual(mockConsoleError.mock.calls.length, 1);
    assert.ok(mockConsoleError.mock.calls[0].arguments[0].includes('atm.json not found'));
    assert.strictEqual(mockProcessExit.mock.calls[0].arguments[0], 1);
  });

  it('uses default commit message from config when no message provided', () => {
    mockConfigExists.mock.mockImplementation(() => true);
    mockReadConfig.mock.mockImplementation(() => ({ defaultCommitMessage: 'auto-save' }));
    mockGitAdd.mock.mockImplementation(() => {});
    mockGitCommit.mock.mockImplementation(() => {});
    mockGitPush.mock.mockImplementation(() => {});

    delete require.cache[require.resolve('../src/commands/save.js')];
    const { save } = require('../src/commands/save.js');

    save();

    assert.strictEqual(mockGitAdd.mock.calls.length, 1);
    assert.strictEqual(mockGitCommit.mock.calls.length, 1);
    assert.strictEqual(mockGitCommit.mock.calls[0].arguments[0], 'auto-save');
    assert.strictEqual(mockGitPush.mock.calls.length, 1);
  });

  it('uses provided message over default', () => {
    mockConfigExists.mock.mockImplementation(() => true);
    mockReadConfig.mock.mockImplementation(() => ({ defaultCommitMessage: 'auto-save' }));
    mockGitAdd.mock.mockImplementation(() => {});
    mockGitCommit.mock.mockImplementation(() => {});
    mockGitPush.mock.mockImplementation(() => {});

    delete require.cache[require.resolve('../src/commands/save.js')];
    const { save } = require('../src/commands/save.js');

    save('custom message');

    assert.strictEqual(mockGitCommit.mock.calls[0].arguments[0], 'custom message');
  });

  it('exits with error when no commit message available', () => {
    mockConfigExists.mock.mockImplementation(() => true);
    mockReadConfig.mock.mockImplementation(() => ({}));

    delete require.cache[require.resolve('../src/commands/save.js')];
    const { save } = require('../src/commands/save.js');

    assert.throws(() => save(), /process\.exit called/);
    assert.ok(mockConsoleError.mock.calls[0].arguments[0].includes('No commit message'));
  });

  it('handles "nothing to commit" gracefully', () => {
    mockConfigExists.mock.mockImplementation(() => true);
    mockReadConfig.mock.mockImplementation(() => ({ defaultCommitMessage: 'save' }));
    mockGitAdd.mock.mockImplementation(() => {});
    mockGitCommit.mock.mockImplementation(() => {
      const error = new Error('git commit failed');
      error.stderr = 'nothing to commit, working tree clean';
      throw error;
    });

    delete require.cache[require.resolve('../src/commands/save.js')];
    const { save } = require('../src/commands/save.js');

    save();

    assert.strictEqual(mockConsoleLog.mock.calls.length, 1);
    assert.strictEqual(mockConsoleLog.mock.calls[0].arguments[0], 'Nothing to commit.');
    // Should not call gitPush
    assert.strictEqual(mockGitPush.mock.calls.length, 0);
  });

  it('exits with error on other git errors', () => {
    mockConfigExists.mock.mockImplementation(() => true);
    mockReadConfig.mock.mockImplementation(() => ({ defaultCommitMessage: 'save' }));
    mockGitAdd.mock.mockImplementation(() => {});
    mockGitCommit.mock.mockImplementation(() => {
      const error = new Error('some other git error');
      throw error;
    });

    delete require.cache[require.resolve('../src/commands/save.js')];
    const { save } = require('../src/commands/save.js');

    assert.throws(() => save(), /process\.exit called/);
    assert.ok(mockConsoleError.mock.calls[0].arguments[0].includes('some other git error'));
  });
});
