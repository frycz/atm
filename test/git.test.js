const { describe, it, mock, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const childProcess = require('child_process');

describe('git', () => {
  let mockExecSync;
  let originalPlatform;

  beforeEach(() => {
    mockExecSync = mock.method(childProcess, 'execSync');
    originalPlatform = Object.getOwnPropertyDescriptor(process, 'platform');
  });

  afterEach(() => {
    mock.restoreAll();
    if (originalPlatform) {
      Object.defineProperty(process, 'platform', originalPlatform);
    }
    delete require.cache[require.resolve('../src/utils/git.js')];
  });

  describe('gitAdd', () => {
    it('executes git add .', () => {
      mockExecSync.mock.mockImplementation(() => '');

      delete require.cache[require.resolve('../src/utils/git.js')];
      const { gitAdd } = require('../src/utils/git.js');

      gitAdd();

      assert.strictEqual(mockExecSync.mock.calls.length, 1);
      assert.strictEqual(mockExecSync.mock.calls[0].arguments[0], 'git add .');
    });
  });

  describe('gitCommit', () => {
    it('escapes quotes with backslash on Unix', () => {
      Object.defineProperty(process, 'platform', { value: 'darwin' });
      mockExecSync.mock.mockImplementation(() => '');

      delete require.cache[require.resolve('../src/utils/git.js')];
      const { gitCommit } = require('../src/utils/git.js');

      gitCommit('message with "quotes"');

      assert.strictEqual(mockExecSync.mock.calls.length, 1);
      assert.strictEqual(
        mockExecSync.mock.calls[0].arguments[0],
        'git commit -m "message with \\"quotes\\""'
      );
    });

    it('escapes quotes with double quotes on Windows', () => {
      Object.defineProperty(process, 'platform', { value: 'win32' });
      mockExecSync.mock.mockImplementation(() => '');

      delete require.cache[require.resolve('../src/utils/git.js')];
      const { gitCommit } = require('../src/utils/git.js');

      gitCommit('message with "quotes"');

      assert.strictEqual(mockExecSync.mock.calls.length, 1);
      assert.strictEqual(
        mockExecSync.mock.calls[0].arguments[0],
        'git commit -m "message with ""quotes"""'
      );
    });
  });

  describe('gitPush', () => {
    it('executes git push with inherited stdio', () => {
      mockExecSync.mock.mockImplementation(() => '');

      delete require.cache[require.resolve('../src/utils/git.js')];
      const { gitPush } = require('../src/utils/git.js');

      gitPush();

      assert.strictEqual(mockExecSync.mock.calls.length, 1);
      assert.strictEqual(mockExecSync.mock.calls[0].arguments[0], 'git push');
      assert.strictEqual(mockExecSync.mock.calls[0].arguments[1].stdio, 'inherit');
    });
  });

  describe('gitInit', () => {
    it('executes git init', () => {
      mockExecSync.mock.mockImplementation(() => '');

      delete require.cache[require.resolve('../src/utils/git.js')];
      const { gitInit } = require('../src/utils/git.js');

      gitInit();

      assert.strictEqual(mockExecSync.mock.calls.length, 1);
      assert.strictEqual(mockExecSync.mock.calls[0].arguments[0], 'git init');
    });
  });

  describe('gitAddRemote', () => {
    it('executes git remote add origin with URL', () => {
      mockExecSync.mock.mockImplementation(() => '');

      delete require.cache[require.resolve('../src/utils/git.js')];
      const { gitAddRemote } = require('../src/utils/git.js');

      gitAddRemote('https://github.com/user/repo.git');

      assert.strictEqual(mockExecSync.mock.calls.length, 1);
      assert.strictEqual(
        mockExecSync.mock.calls[0].arguments[0],
        'git remote add origin https://github.com/user/repo.git'
      );
    });
  });

  describe('gitSetUpstream', () => {
    it('executes git push -u origin main', () => {
      mockExecSync.mock.mockImplementation(() => '');

      delete require.cache[require.resolve('../src/utils/git.js')];
      const { gitSetUpstream } = require('../src/utils/git.js');

      gitSetUpstream();

      assert.strictEqual(mockExecSync.mock.calls.length, 1);
      assert.strictEqual(
        mockExecSync.mock.calls[0].arguments[0],
        'git push -u origin main'
      );
    });
  });

  describe('isGitRepo', () => {
    it('returns true when inside a git repo', () => {
      mockExecSync.mock.mockImplementation(() => 'true');

      delete require.cache[require.resolve('../src/utils/git.js')];
      const { isGitRepo } = require('../src/utils/git.js');

      assert.strictEqual(isGitRepo(), true);
      assert.strictEqual(
        mockExecSync.mock.calls[0].arguments[0],
        'git rev-parse --is-inside-work-tree'
      );
    });

    it('returns false when not in a git repo', () => {
      mockExecSync.mock.mockImplementation(() => {
        throw new Error('not a git repo');
      });

      delete require.cache[require.resolve('../src/utils/git.js')];
      const { isGitRepo } = require('../src/utils/git.js');

      assert.strictEqual(isGitRepo(), false);
    });
  });

  describe('getRemoteUrl', () => {
    it('returns remote URL when available', () => {
      mockExecSync.mock.mockImplementation(() => 'https://github.com/user/repo.git\n');

      delete require.cache[require.resolve('../src/utils/git.js')];
      const { getRemoteUrl } = require('../src/utils/git.js');

      assert.strictEqual(getRemoteUrl(), 'https://github.com/user/repo.git');
    });

    it('returns null when no remote configured', () => {
      mockExecSync.mock.mockImplementation(() => {
        throw new Error('no remote');
      });

      delete require.cache[require.resolve('../src/utils/git.js')];
      const { getRemoteUrl } = require('../src/utils/git.js');

      assert.strictEqual(getRemoteUrl(), null);
    });
  });

  describe('parseRemoteUrl', () => {
    // This is a pure function, no mocking needed
    const { parseRemoteUrl } = require('../src/utils/git.js');

    it('returns null for null input', () => {
      assert.strictEqual(parseRemoteUrl(null), null);
    });

    it('returns null for undefined input', () => {
      assert.strictEqual(parseRemoteUrl(undefined), null);
    });

    it('returns null for invalid URL', () => {
      assert.strictEqual(parseRemoteUrl('not a url'), null);
    });

    it('parses GitHub SSH URL', () => {
      const result = parseRemoteUrl('git@github.com:user/repo.git');

      assert.deepStrictEqual(result, {
        host: 'github.com',
        hostType: 'github',
        owner: 'user',
        repo: 'repo',
      });
    });

    it('parses GitHub HTTPS URL', () => {
      const result = parseRemoteUrl('https://github.com/user/repo.git');

      assert.deepStrictEqual(result, {
        host: 'github.com',
        hostType: 'github',
        owner: 'user',
        repo: 'repo',
      });
    });

    it('parses GitHub HTTPS URL without .git suffix', () => {
      const result = parseRemoteUrl('https://github.com/user/repo');

      assert.deepStrictEqual(result, {
        host: 'github.com',
        hostType: 'github',
        owner: 'user',
        repo: 'repo',
      });
    });

    it('parses GitLab SSH URL', () => {
      const result = parseRemoteUrl('git@gitlab.com:user/repo.git');

      assert.deepStrictEqual(result, {
        host: 'gitlab.com',
        hostType: 'gitlab',
        owner: 'user',
        repo: 'repo',
      });
    });

    it('parses Bitbucket HTTPS URL', () => {
      const result = parseRemoteUrl('https://bitbucket.org/user/repo.git');

      assert.deepStrictEqual(result, {
        host: 'bitbucket.org',
        hostType: 'bitbucket',
        owner: 'user',
        repo: 'repo',
      });
    });

    it('returns unknown hostType for other hosts', () => {
      const result = parseRemoteUrl('git@custom.server.com:user/repo.git');

      assert.strictEqual(result.host, 'custom.server.com');
      assert.strictEqual(result.hostType, 'unknown');
      assert.strictEqual(result.owner, 'user');
      assert.strictEqual(result.repo, 'repo');
    });
  });
});
