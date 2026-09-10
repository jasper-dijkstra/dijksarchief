// Stores the page password in secrets/password.enc.yaml, encrypted with SOPS.
// Run this once; after that `npm run encrypt` no longer prompts.

import { writeFile, rm, mkdir } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { askPassword } from "./prompt.mjs";

const root = new URL("../", import.meta.url);
const plain = fileURLToPath(new URL("secrets/password.yaml", root));
const sealed = fileURLToPath(new URL("secrets/password.enc.yaml", root));

const password = await askPassword("New page password: ");
if (password.length < 10) {
  console.error("Use at least 10 characters: the encrypted page can be attacked offline");
  process.exit(1);
}
if (password !== (await askPassword("Repeat: "))) {
  console.error("Passwords do not match");
  process.exit(1);
}

await mkdir(new URL("secrets/", root), { recursive: true });
await writeFile(plain, `pagePassword: ${JSON.stringify(password)}\n`, { mode: 0o600 });

try {
  const encrypted = execFileSync("sops", ["--encrypt", plain], { encoding: "utf8" });
  await writeFile(sealed, encrypted, "utf8");
} finally {
  await rm(plain, { force: true });
}

console.log(`Wrote ${sealed}`);
