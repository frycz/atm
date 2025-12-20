const { execSync } = require('child_process');

function exec(cmd, options = {}) {
  try {
    const result = execSync(cmd, { encoding: 'utf8', stdio: 'pipe', shell: true, ...options });
    return result === null ? null : result.trim();
  } catch (err) {
    if (options.ignoreError) return null;
    throw err;
  }
}

function gitAdd() {
  exec('git add .');
}

function gitCommit(message) {
  // Escape quotes: "" for Windows CMD, \" for Unix shells
  const escaped = process.platform === 'win32'
    ? message.replace(/"/g, '""')
    : message.replace(/"/g, '\\"');
  exec(`git commit -m "${escaped}"`);
}

function gitPush() {
  exec('git push', { stdio: 'inherit' });
}

function gitInit() {
  exec('git init');
}

function gitAddRemote(url) {
  exec(`git remote add origin ${url}`);
}

function gitSetUpstream() {
  exec('git push -u origin main', { stdio: 'inherit' });
}

function isGitRepo() {
  try {
    exec('git rev-parse --is-inside-work-tree');
    return true;
  } catch {
    return false;
  }
}

function getRemoteUrl() {
  try {
    return exec('git remote get-url origin');
  } catch {
    return null;
  }
}

function parseRemoteUrl(url) {
  if (!url) return null;

  // Patterns for common git hosts
  // SSH: git@github.com:user/repo.git
  // HTTPS: https://github.com/user/repo.git
  const patterns = [
    { regex: /git@([^:]+):([^/]+)\/(.+?)(\.git)?$/, type: 'ssh' },
    { regex: /https?:\/\/([^/]+)\/([^/]+)\/(.+?)(\.git)?$/, type: 'https' },
  ];

  for (const { regex } of patterns) {
    const match = url.match(regex);
    if (match) {
      const host = match[1];
      const owner = match[2];
      const repo = match[3].replace(/\.git$/, '');

      // Determine host type
      let hostType = 'unknown';
      if (host.includes('github')) hostType = 'github';
      else if (host.includes('gitlab')) hostType = 'gitlab';
      else if (host.includes('bitbucket')) hostType = 'bitbucket';

      return { host, hostType, owner, repo };
    }
  }

  return null;
}

module.exports = {
  gitAdd,
  gitCommit,
  gitPush,
  gitInit,
  gitAddRemote,
  gitSetUpstream,
  isGitRepo,
  getRemoteUrl,
  parseRemoteUrl,
};
