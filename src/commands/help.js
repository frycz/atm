function help() {
  console.log(`
atm - Set up private GitHub repos and push commits quickly.

Usage:
  atm init [path]       Initialize a new GitHub repo
  atm s                 Commit with default message and push
  atm s <message>       Commit with custom message and push
  atm -h, --help        Show this help
  atm -v, --version     Show version

Examples:
  atm init              Interactive setup
  atm init my-repo      Create repo in ./my-repo
  atm init foo/bar      Create repo in ./foo/bar
  atm init ~/projects/app  Create repo at absolute path
  atm s                 Quick save (commit + push)
  atm s fix bug         Commit with message "fix bug" + push
`);
}

module.exports = { help };
