function help() {
  console.log(`
atm - Set up private GitHub repos and push commits quickly.

Usage:
  atm init              Initialize a new GitHub repo
  atm s                 Commit with message "save" and push
  atm <message>         Commit with custom message and push
  atm -h, --help        Show this help
  atm -v, --version     Show version

Examples:
  atm init              Create a new private GitHub repo
  atm s                 Quick save (commit "save" + push)
  atm "fix bug"         Commit with message "fix bug" + push
`);
}

module.exports = { help };
