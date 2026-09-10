// Refuses a commit when the staged index.html still contains a real album link from links.json.
// The repository is public, so only the encrypted build may be committed.

import { readFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";

const root = new URL("../", import.meta.url);

let links;
try {
  links = JSON.parse(await readFile(new URL("links.json", root), "utf8"));
} catch (error) {
  if (error.code === "ENOENT") process.exit(0);
  throw error;
}

let staged;
try {
  staged = execFileSync("git", ["show", ":index.html"], { encoding: "utf8" });
} catch {
  process.exit(0); // index.html is not staged
}

const urls = links.sections.flatMap((section) => section.links.map((link) => link.url));
const leaked = urls.filter((url) => staged.includes(url));

if (leaked.length > 0) {
  console.error("Commit blocked: index.html contains plaintext album links.");
  console.error("Run `npm run encrypt` and stage the encrypted file instead.");
  console.error(`First leaked link: ${leaked[0]}`);
  process.exit(1);
}
