const { describe, it, mock, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const childProcess = require('child_process');

describe('gh', () => {
  let mockExecSync;

  beforeEach(() => {
    mockExecSync = mock.method(childProcess, 'execSync');
  });

  afterEach(() => {
    mock.restoreAll();
    delete require.cache[require.resolve('../src/utils/gh.js')];
  });

  describe('isGhInstalled', () => {
    it('returns true when gh is installed', () => {
      mockExecSync.mock.mockImplementation(() => 'gh version 2.0.0');

      delete require.cache[require.resolve('../src/utils/gh.js')];
      const { isGhInstalled } = require('../src/utils/gh.js');

      assert.strictEqual(isGhInstalled(), true);
      assert.strictEqual(mockExecSync.mock.calls[0].arguments[0], 'gh --version');
    });

    it('returns false when gh is not installed', () => {
      mockExecSync.mock.mockImplementation(() => {
        throw new Error('command not found');
      });

      delete require.cache[require.resolve('../src/utils/gh.js')];
      const { isGhInstalled } = require('../src/utils/gh.js');

      assert.strictEqual(isGhInstalled(), false);
    });
  });

  describe('isGhAuthenticated', () => {
    it('returns true when gh is authenticated', () => {
      mockExecSync.mock.mockImplementation(() => 'Logged in to github.com');

      delete require.cache[require.resolve('../src/utils/gh.js')];
      const { isGhAuthenticated } = require('../src/utils/gh.js');

      assert.strictEqual(isGhAuthenticated(), true);
      assert.strictEqual(mockExecSync.mock.calls[0].arguments[0], 'gh auth status');
    });

    it('returns false when gh is not authenticated', () => {
      mockExecSync.mock.mockImplementation(() => {
        throw new Error('not authenticated');
      });

      delete require.cache[require.resolve('../src/utils/gh.js')];
      const { isGhAuthenticated } = require('../src/utils/gh.js');

      assert.strictEqual(isGhAuthenticated(), false);
    });
  });

  describe('getGhUsername', () => {
    it('returns username when available', () => {
      mockExecSync.mock.mockImplementation(() => 'testuser\n');

      delete require.cache[require.resolve('../src/utils/gh.js')];
      const { getGhUsername } = require('../src/utils/gh.js');

      assert.strictEqual(getGhUsername(), 'testuser');
      assert.strictEqual(mockExecSync.mock.calls[0].arguments[0], 'gh api user -q .login');
    });

    it('returns null when not authenticated', () => {
      mockExecSync.mock.mockImplementation(() => {
        throw new Error('not authenticated');
      });

      delete require.cache[require.resolve('../src/utils/gh.js')];
      const { getGhUsername } = require('../src/utils/gh.js');

      assert.strictEqual(getGhUsername(), null);
    });
  });

  describe('createRepo', () => {
    it('executes gh repo create with correct arguments', () => {
      mockExecSync.mock.mockImplementation(() => '');

      delete require.cache[require.resolve('../src/utils/gh.js')];
      const { createRepo } = require('../src/utils/gh.js');

      createRepo('testuser', 'testrepo');

      assert.strictEqual(mockExecSync.mock.calls.length, 1);
      assert.strictEqual(
        mockExecSync.mock.calls[0].arguments[0],
        'gh repo create testuser/testrepo --private'
      );
      assert.strictEqual(mockExecSync.mock.calls[0].arguments[1].stdio, 'inherit');
    });
  });

  describe('getRepoVisibility', () => {
    it('returns "private" when isPrivate is true', () => {
      mockExecSync.mock.mockImplementation(() => 'true\n');

      delete require.cache[require.resolve('../src/utils/gh.js')];
      const { getRepoVisibility } = require('../src/utils/gh.js');

      assert.strictEqual(getRepoVisibility('owner', 'repo'), 'private');
      assert.strictEqual(
        mockExecSync.mock.calls[0].arguments[0],
        'gh repo view owner/repo --json isPrivate -q .isPrivate'
      );
    });

    it('returns "public" when isPrivate is false', () => {
      mockExecSync.mock.mockImplementation(() => 'false\n');

      delete require.cache[require.resolve('../src/utils/gh.js')];
      const { getRepoVisibility } = require('../src/utils/gh.js');

      assert.strictEqual(getRepoVisibility('owner', 'repo'), 'public');
    });

    it('returns null for unexpected value', () => {
      mockExecSync.mock.mockImplementation(() => 'unknown\n');

      delete require.cache[require.resolve('../src/utils/gh.js')];
      const { getRepoVisibility } = require('../src/utils/gh.js');

      assert.strictEqual(getRepoVisibility('owner', 'repo'), null);
    });

    it('returns null on error', () => {
      mockExecSync.mock.mockImplementation(() => {
        throw new Error('repo not found');
      });

      delete require.cache[require.resolve('../src/utils/gh.js')];
      const { getRepoVisibility } = require('../src/utils/gh.js');

      assert.strictEqual(getRepoVisibility('owner', 'repo'), null);
    });
  });
});
