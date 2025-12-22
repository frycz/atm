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

  it('logs stderr and exits on git error with stderr', () => {
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

    assert.throws(() => save(), /process\.exit called/);
    assert.strictEqual(mockConsoleLog.mock.calls.length, 1);
    assert.strictEqual(mockConsoleLog.mock.calls[0].arguments[0], 'nothing to commit, working tree clean');
    assert.strictEqual(mockProcessExit.mock.calls[0].arguments[0], 1);
  });

  it('logs stdout and exits on git error with stdout but no stderr', () => {
    mockConfigExists.mock.mockImplementation(() => true);
    mockReadConfig.mock.mockImplementation(() => ({ defaultCommitMessage: 'save' }));
    mockGitAdd.mock.mockImplementation(() => {});
    mockGitCommit.mock.mockImplementation(() => {
      const error = new Error('git commit failed');
      error.stdout = 'On branch main\nYour branch is up to date';
      throw error;
    });

    delete require.cache[require.resolve('../src/commands/save.js')];
    const { save } = require('../src/commands/save.js');

    assert.throws(() => save(), /process\.exit called/);
    assert.strictEqual(mockConsoleLog.mock.calls.length, 1);
    assert.strictEqual(mockConsoleLog.mock.calls[0].arguments[0], 'On branch main\nYour branch is up to date');
    assert.strictEqual(mockProcessExit.mock.calls[0].arguments[0], 1);
  });

  it('logs error message and exits on git error with no stderr or stdout', () => {
    mockConfigExists.mock.mockImplementation(() => true);
    mockReadConfig.mock.mockImplementation(() => ({ defaultCommitMessage: 'save' }));
    mockGitAdd.mock.mockImplementation(() => {});
    mockGitCommit.mock.mockImplementation(() => {
      throw new Error('some other git error');
    });

    delete require.cache[require.resolve('../src/commands/save.js')];
    const { save } = require('../src/commands/save.js');

    assert.throws(() => save(), /process\.exit called/);
    assert.strictEqual(mockConsoleError.mock.calls.length, 1);
    assert.ok(mockConsoleError.mock.calls[0].arguments[0].includes('some other git error'));
    assert.strictEqual(mockProcessExit.mock.calls[0].arguments[0], 1);
  });

  it('handles gitAdd errors', () => {
    mockConfigExists.mock.mockImplementation(() => true);
    mockReadConfig.mock.mockImplementation(() => ({ defaultCommitMessage: 'save' }));
    mockGitAdd.mock.mockImplementation(() => {
      const error = new Error('git add failed');
      error.stderr = 'fatal: not a git repository';
      throw error;
    });

    delete require.cache[require.resolve('../src/commands/save.js')];
    const { save } = require('../src/commands/save.js');

    assert.throws(() => save(), /process\.exit called/);
    assert.strictEqual(mockConsoleLog.mock.calls[0].arguments[0], 'fatal: not a git repository');
    assert.strictEqual(mockGitCommit.mock.calls.length, 0);
    assert.strictEqual(mockGitPush.mock.calls.length, 0);
  });

  it('handles gitPush errors', () => {
    mockConfigExists.mock.mockImplementation(() => true);
    mockReadConfig.mock.mockImplementation(() => ({ defaultCommitMessage: 'save' }));
    mockGitAdd.mock.mockImplementation(() => {});
    mockGitCommit.mock.mockImplementation(() => {});
    mockGitPush.mock.mockImplementation(() => {
      const error = new Error('git push failed');
      error.stderr = 'fatal: remote origin not found';
      throw error;
    });

    delete require.cache[require.resolve('../src/commands/save.js')];
    const { save } = require('../src/commands/save.js');

    assert.throws(() => save(), /process\.exit called/);
    assert.strictEqual(mockConsoleLog.mock.calls[0].arguments[0], 'fatal: remote origin not found');
  });
});
