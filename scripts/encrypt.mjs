// Encrypts dist/index.html into the published index.html.
// The password is read from a hidden prompt so it never lands in argv or shell history.

import { Writable } from "node:stream";
import { createInterface } from "node:readline";
import { fileURLToPath } from "node:url";
import { encrypt } from "pagecrypt";

const root = new URL("../", import.meta.url);
const input = fileURLToPath(new URL("dist/index.html", root));
const output = fileURLToPath(new URL("index.html", root));

function askPassword(prompt) {
  let muted = false;
  const stdout = new Writable({
    write(chunk, encoding, callback) {
      if (!muted) process.stdout.write(chunk, encoding);
      callback();
    },
  });

  const rl = createInterface({ input: process.stdin, output: stdout, terminal: true });

  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      rl.close();
      process.stdout.write("\n");
      resolve(answer);
    });
    muted = true;
  });
}

const password = await askPassword("Password: ");
if (password.length < 8) {
  console.error("Password must be at least 8 characters");
  process.exit(1);
}

const confirmation = await askPassword("Repeat: ");
if (password !== confirmation) {
  console.error("Passwords do not match");
  process.exit(1);
}

await encrypt(input, output, password);

console.log(`Wrote encrypted ${output}`);
