// Encrypts dist/index.html into the published index.html.
// Uses the password from secrets.enc.json when present, otherwise asks for it.

import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { encrypt } from "pagecrypt";
import { parse as parseYaml } from "yaml";
import { askPassword } from "./prompt.mjs";

const root = new URL("../", import.meta.url);
const input = fileURLToPath(new URL("dist/index.html", root));
const output = fileURLToPath(new URL("index.html", root));
const sealed = fileURLToPath(new URL("secrets/password.enc.yaml", root));

function storedPassword() {
  try {
    const yaml = execFileSync("sops", ["--decrypt", sealed], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
    return parseYaml(yaml).pagePassword;
  } catch {
    return null;
  }
}

let password = storedPassword();

if (password) {
  console.log("Using the password from secrets/password.enc.yaml");
} else if (!process.stdin.isTTY) {
  // The pre-commit hook has no terminal to prompt on.
  console.error("No stored password. Run `npm run password:set` first.");
  process.exit(1);
} else {
  password = await askPassword("Password: ");
  if (password.length < 10) {
    console.error("Use at least 10 characters: the encrypted page can be attacked offline");
    process.exit(1);
  }
  if (password !== (await askPassword("Repeat: "))) {
    console.error("Passwords do not match");
    process.exit(1);
  }
}

await encrypt(input, output, password);

console.log(`Wrote encrypted ${output}`);
