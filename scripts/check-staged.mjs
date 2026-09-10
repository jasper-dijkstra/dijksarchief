// Refuses a commit when the staged index.html still contains a real album link.
// The repository is public, so only the encrypted build may be committed.

import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { parse as parseYaml } from "yaml";

const root = new URL("../", import.meta.url);

function readLinks() {
  try {
    const sealed = fileURLToPath(new URL("secrets/links.enc.yaml", root));
    return parseYaml(execFileSync("sops", ["--decrypt", sealed], { encoding: "utf8" }));
  } catch {
    return null;
  }
}

const links = readLinks();
if (!links) process.exit(0);

let staged;
try {
  staged = execFileSync("git", ["show", ":index.html"], { encoding: "utf8" });
} catch {
  process.exit(0); // index.html is not staged
}

const urls = links.sections.flatMap((section) => section.links.map((link) => link.url));

// The build escapes hrefs, so a raw url from the JSON does not appear verbatim in the HTML.
const escapeHtml = (value) =>
  String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const leaked = urls.filter((url) => staged.includes(url) || staged.includes(escapeHtml(url)));

if (leaked.length > 0) {
  console.error("Commit blocked: index.html contains plaintext album links.");
  console.error("Run `npm run encrypt` and stage the encrypted file instead.");
  console.error(`First leaked link: ${leaked[0]}`);
  process.exit(1);
}
