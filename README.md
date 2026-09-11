# Het Dijksarchief

Private landing page for the family photo archive. The page holds only links; the photos stay in
private Google Photos albums.

**Live page:** https://jasper-dijkstra.github.io/dijksarchief/

## Procedures

Pre-commit hooks automatically runs the `index.html` encryption and stages it for commit.

```sh
git add -A
git commit -m "commit message"
git push
```

Deploying the site requires a tagged release. From a clean branch, run:

```sh
npm run release -- minor # or patch, major, or an exact version such as 1.4.0
git push --follow-tags
```

The tag triggers the deploy workflow, and the new version appears in the footer. It refuses to
deploy when the tag and `package.json` disagree, so set the version through `npm run release`.

Run `npm run build` to preview: it writes `dist/index.html`, the same page without the password.

## Files

| File | Purpose |
| --- | --- |
| `secrets/links.enc.yaml` | The album links, encrypted with SOPS. Edit this file directly. |
| `secrets/password.enc.yaml` | The page password, encrypted with SOPS. |
| `links.example.json` | Template showing the shape of the links file. |
| `src/index.html` | Page template. The cards go where `<!-- LINKS -->` sits. |
| `src/styles.css` | The styling. |
| `src/icons/` | Button and site icons. The build inlines them as data URIs. |
| `scripts/build.mjs` | Renders the links, inlines the CSS, writes `dist/index.html`. |
| `scripts/encrypt.mjs` | Encrypts `dist/index.html` into the published `index.html`. |
| `scripts/check-staged.mjs` | Refuses a commit that would publish plaintext links. |
| `dist/index.html` | Plaintext build. Untracked. |
| `index.html` | The published, encrypted page. |

The repository is public, so the album links never enter git in the clear. SOPS keeps them encrypted
in `secrets/`, and they reach the web only inside the encrypted `index.html`. Pagecrypt encrypts one
file, which is why the build inlines the CSS.

## Setup

```sh
npm install
git config core.hooksPath .githooks
```

The hook line enables the pre-commit hook; git never enables hooks on clone.

Install the `signageos.signageos-vscode-sops` extension. It decrypts `secrets/links.enc.yaml` when
you open it and re-encrypts on save, so you edit it like an ordinary YAML file. Outside VS Code, use
`sops secrets/links.enc.yaml`, which does the same in your terminal editor.

Anything in `secrets/` that is not `*.enc.yaml` is gitignored, so a stray decrypted copy cannot be
committed by accident.

## The page password

```sh
npm run password:set
```

This asks for a password and stores it in `secrets/password.enc.yaml`, encrypted with the same age
key. After that `npm run encrypt` reads it from there and stops prompting.

Use at least 10 characters. Anyone can download the published page and attack the password offline.

## Working on a second machine

Everything travels through git, encrypted with SOPS and an age key. Copy the private key to the
other machine, by hand and over a secure channel:

```
~/Library/Application Support/sops/age/keys.txt
```

That path is where SOPS looks on macOS. On Linux it is `~/.config/sops/age/keys.txt`, on Windows
`%AppData%\sops\age\keys.txt`. The public recipient sits in `.sops.yaml` and is safe to commit; the
private key must never enter the repository.

### On Windows

Everything works, with three notes. Install `sops` and `age` first, for example with
`winget install sops` and `winget install age`. Run the git commands from Git Bash, PowerShell or
the VS Code terminal; the pre-commit hook needs the `sh` that ships with Git for Windows, which is
always present. And `.gitattributes` forces LF endings on `.githooks/`, because `sh` rejects a
script with CRLF endings.

## Edit the links

Put your albums in `secrets/links.enc.yaml`. Each section becomes a heading, each entry becomes a
button:

```yaml
sections:
  - heading: Per jaar
    links:
      - title: "2024"
        meta: "Verjaardagen en vakanties \n 2024"
        icon: photo.png
        url: https://sites.google.com/...
        primary: true
```

`meta`, `icon` and `primary` are optional. In `meta`, a `\n` starts a second line that renders in
italics. `icon` takes a file name from `src/icons/` — `photo.png`, `fotoscan.png`, `diascan.png`,
`video.png` or `vuurtoren.png` — or any text or emoji. The build rejects any url that is not `https`.

To get an album link in Google Photos: open the album, choose **Share**, then **Copy link**. Anyone
with that link can see the album, so do not post it in public.

Header and footer text live in [src/index.html](src/index.html).

## Build

```sh
npm run build
```

This writes `dist/index.html`. Open that file in a browser to check your work. Opening
`src/index.html` directly shows the page without cards, because the links are only added at build
time.

`npm run encrypt` does the same and then encrypts the result into `index.html`. The pre-commit hook
runs both, so you rarely need either by hand.

## Deployment

`.github/workflows/deploy.yml` triggers on `v*` tags and uploads only `index.html`. Set
**Settings > Pages > Source** to *GitHub Actions* once, or the workflow cannot publish. The workflow
refuses to deploy when the tag and `package.json` disagree.

Give the password to the family by phone or a message app, never in the same message as the link.

## The commit guard

`.githooks/pre-commit` compares the staged `index.html` against the urls in `secrets/links.enc.yaml`
and aborts the commit if it finds one in plaintext. That catches the case where the encryption step
failed. Bypass it with `--no-verify` only if you are certain the file holds no real links.

## Keep it out of search engines

The `robots` meta tag disappears once Pagecrypt wraps the file, because a crawler then sees only the
Pagecrypt shell. Add a `robots.txt` at the root as a second barrier:

```
User-agent: *
Disallow: /
```

This asks crawlers to stay away. It does not stop anyone who has the address.
