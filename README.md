# atm

[Read blog post](https://frycz.github.io/projects/atm)

In the era of AI tools, drafting new ideas is easier than ever. `atm` helps you set up private GitHub repos for your ideas and save iterations quickly.

With a single `atm init` command, the tool prepares a private repository. Develop your project by adding changes and quickly pushing them with `atm s`. That's it.

No need to visit `github.com` to create a private repo and set it up locally. No need for "add" -> "commit" -> "push" repetitive flow.

## Installation

```bash
# Global installation (recommended)
bun install -g @frycz/atm
# or
npm install -g @frycz/atm
```

Alternatively, you can use `bunx` or `npx`

```bash
bunx @frycz/atm
# or
npx @frycz/atm
# later remember
bunx @frycz/atm [command]
# or
npx @frycz/atm [command]
```



## Prerequisites

- [Node.js](https://nodejs.org/) >= 14
- [GitHub CLI](https://cli.github.com/) (`gh`) installed and authenticated

## Quick Start

```bash
# Create a new private GitHub repo
atm init repo-name

# go to the repo directory (if not already there)
cd [repo-directory]

# Add or modify files
# Then commit all and push to origin with one command:
atm s

# Or with a custom commit message
atm s add new feature
```

## Commands

### `atm init [directory]`

Initialize a new private GitHub repository in interactive mode. This command will:

1. Prompt for your GitHub username (auto-detected from `gh`)
2. Prompt for a repository name
3. Prompt for a local directory (defaults to `./<repo-name>`)
4. Create a private repository on GitHub
5. Initialize a local git repository with a README
6. Push the initial commit

```bash
$ atm init
GitHub username [yourname]:
Repository name: my-project
Directory [./my-project]:

Creating private repo yourname/my-project...
Initializing git...
Pushing to GitHub...

Done! Repository created at /path/to/my-project
```

#### Using `atm init` in an existing repository

If you run `atm init` inside an existing git repository, it will detect this and offer to create only the `atm.json` configuration file. This is useful when you want to start using `atm` with a project that already has a GitHub remote set up.

```bash
$ cd existing-project
$ atm init

Git repository detected in: /path/to/existing-project

Remote URL: git@github.com:yourname/existing-project.git
Host: github
Visibility: private

This will only create an atm.json file. No new repository will be created.

Create atm.json in this directory? [y/N]: y

atm.json created successfully.
You can now use 'atm s' to save and push changes.
```

### `atm s`

Quick save - stages all changes, commits with the default message from config, and pushes to origin.

```bash
atm s
```

### `atm s <message>`

Stages all changes, commits with your custom message, and pushes to origin.

```bash
atm s fix login bug
atm s add user authentication
```

### `atm -h` / `atm --help`

Print help.

```bash
atm -h
```

### `atm -v` / `atm --version`

Print version.

```bash
atm -v
```

## Configuration

After running `atm init`, a `atm.json` file is created in your repository containing:

```json
{
  "defaultCommitMessage": "save"
}
```

You can change the default commit message used by `atm s` by editing this file.

## Troubleshooting

### gh CLI is not installed

Install the GitHub CLI from [https://cli.github.com/](https://cli.github.com/)

**macOS:**

```bash
brew install gh
```

**Windows:**

```bash
winget install GitHub.cli
```

**Linux:**

```bash
# Debian/Ubuntu
sudo apt install gh

# Fedora
sudo dnf install gh
```

### gh CLI is not authenticated

Run the following command and follow the prompts:

```bash
gh auth login
```

### atm.json not found

You need to initialize the repository first:

```bash
atm init
```

## FAQ

Q: What does "atm" stand for?<br>
A: It's "all to main".

Q: Can I tell my friend about `atm`?<br>
A: Yes, go ahead!

## Development

```bash
# Run local version
node bin/atm.js <command>
# Run tests
node --test
# Login to npm
npm login
# Publish to npm
npm publish --access public
```

## License

MIT
