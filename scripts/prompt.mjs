// Hidden password prompt shared by the encrypt scripts.

import { Writable } from "node:stream";
import { createInterface } from "node:readline";

export function askPassword(prompt) {
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
