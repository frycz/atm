const { describe, it, mock, beforeEach, afterEach } = require("node:test");
const assert = require("node:assert");

describe("run function", () => {
  let mockHelp;
  let mockInit;
  let mockSave;
  let mockShowVersion;
  let mockConsoleError;
  let mockProcessExit;

  beforeEach(() => {
    // Clear all module caches first
    delete require.cache[require.resolve("../src/index.js")];
    delete require.cache[require.resolve("../src/commands/help.js")];
    delete require.cache[require.resolve("../src/commands/init.js")];
    delete require.cache[require.resolve("../src/commands/save.js")];
    delete require.cache[require.resolve("../src/commands/version.js")];

    // Now require the modules and set up mocks BEFORE requiring index.js
    const helpModule = require("../src/commands/help.js");
    mockHelp = mock.method(helpModule, "help");
    mockHelp.mock.mockImplementation(() => {});

    const initModule = require("../src/commands/init.js");
    mockInit = mock.method(initModule, "init");
    mockInit.mock.mockImplementation(() => {});

    const saveModule = require("../src/commands/save.js");
    mockSave = mock.method(saveModule, "save");
    mockSave.mock.mockImplementation(() => {});

    const versionModule = require("../src/commands/version.js");
    mockShowVersion = mock.method(versionModule, "showVersion");
    mockShowVersion.mock.mockImplementation(() => {});

    // Mock console and process.exit
    mockConsoleError = mock.method(console, "error");
    mockProcessExit = mock.method(process, "exit");
    mockProcessExit.mock.mockImplementation(() => {
      throw new Error("process.exit called");
    });
  });

  afterEach(() => {
    mock.restoreAll();
  });

  it("shows help when no args provided", () => {
    const { run } = require("../src/index.js");

    run([]);

    assert.strictEqual(mockHelp.mock.calls.length, 1);
  });

  it("shows help with -h flag", () => {
    const { run } = require("../src/index.js");

    run(["-h"]);

    assert.strictEqual(mockHelp.mock.calls.length, 1);
  });

  it("shows help with --help flag", () => {
    const { run } = require("../src/index.js");

    run(["--help"]);

    assert.strictEqual(mockHelp.mock.calls.length, 1);
  });

  it("shows version with -v flag", () => {
    const { run } = require("../src/index.js");

    run(["-v"]);

    assert.strictEqual(mockShowVersion.mock.calls.length, 1);
  });

  it("shows version with --version flag", () => {
    const { run } = require("../src/index.js");

    run(["--version"]);

    assert.strictEqual(mockShowVersion.mock.calls.length, 1);
  });

  it("runs init command", () => {
    const { run } = require("../src/index.js");

    run(["init"]);

    assert.strictEqual(mockInit.mock.calls.length, 1);
    assert.strictEqual(mockInit.mock.calls[0].arguments[0], undefined);
  });

  it("runs init command with path argument", () => {
    const { run } = require("../src/index.js");

    run(["init", "my-repo"]);

    assert.strictEqual(mockInit.mock.calls.length, 1);
    assert.strictEqual(mockInit.mock.calls[0].arguments[0], "my-repo");
  });

  it("runs init command with nested path argument", () => {
    const { run } = require("../src/index.js");

    run(["init", "some-dir/my-project"]);

    assert.strictEqual(mockInit.mock.calls.length, 1);
    assert.strictEqual(mockInit.mock.calls[0].arguments[0], "some-dir/my-project");
  });

  it('calls save with no message for "atm s"', () => {
    const { run } = require("../src/index.js");

    run(["s"]);

    assert.strictEqual(mockSave.mock.calls.length, 1);
    assert.strictEqual(mockSave.mock.calls[0].arguments.length, 0);
  });

  it('calls save with message for "atm s message"', () => {
    const { run } = require("../src/index.js");

    run(["s", "fix", "bug"]);

    assert.strictEqual(mockSave.mock.calls.length, 1);
    assert.strictEqual(mockSave.mock.calls[0].arguments[0], "fix bug");
  });

  it('calls save with multi-word message for "atm s message with spaces"', () => {
    const { run } = require("../src/index.js");

    run(["s", "add", "new", "feature", "to", "app"]);

    assert.strictEqual(mockSave.mock.calls.length, 1);
    assert.strictEqual(
      mockSave.mock.calls[0].arguments[0],
      "add new feature to app"
    );
  });

  it("errors on unknown command", () => {
    const { run } = require("../src/index.js");

    assert.throws(() => run(["unknown"]), /process\.exit called/);
    assert.strictEqual(mockProcessExit.mock.calls[0].arguments[0], 1);
    assert.ok(
      mockConsoleError.mock.calls[0].arguments[0].includes("Unknown command")
    );
  });

  it("errors with helpful message for unknown command", () => {
    const { run } = require("../src/index.js");

    assert.throws(() => run(["foo"]), /process\.exit called/);

    const errorMessages = mockConsoleError.mock.calls.map(
      (call) => call.arguments[0]
    );
    assert.ok(errorMessages.some((msg) => msg.includes("Unknown command: foo")));
    assert.ok(errorMessages.some((msg) => msg.includes("atm s foo")));
  });

  it("errors on empty message after s", () => {
    const { run } = require("../src/index.js");

    assert.throws(() => run(["s", "   "]), /process\.exit called/);
    assert.strictEqual(mockProcessExit.mock.calls[0].arguments[0], 1);
    assert.ok(
      mockConsoleError.mock.calls[0].arguments[0].includes(
        "Commit message cannot be empty"
      )
    );
  });
});
