const spawn = require('child_process').spawn;

let server = spawn("static-server", ["-p", "1337"], { stdio: 'inherit' });

let test_args = process.argv.slice(2);
test_args.unshift("test");

let test = spawn("jpm", test_args, { stdio: 'inherit' });

test.on('close', (code) => {
  server.kill();
});