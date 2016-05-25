"use strict";

/* eslint-env node */

const spawn = require("child_process").spawn;

let server = spawn("static-server", ["-p", "1337"], { stdio: "inherit" });

let testArgs = process.argv.slice(2);
testArgs.unshift("test");

let test = spawn("jpm", testArgs, { stdio: "inherit" });

test.on("close", (code) => {
  server.kill();
});
