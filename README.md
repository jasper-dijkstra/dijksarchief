# Het Dijksarchief

Private landing page for the family photo archive. The page holds only links; the photos stay in
private Google Photos albums.

**Live page:** https://jasper-dijkstra.github.io/dijksarchief/

## Files

| File | Purpose |
| --- | --- |
| `links.json` | The real album links. Untracked, never committed. |
| `links.enc.json` | The same links, encrypted with SOPS. This one is committed. |
| `links.example.json` | Template showing the shape of `links.json`. |
| `src/index.html` | Page template. The cards go where `<!-- LINKS -->` sits. |
| `src/styles.css` | The styling. |
| `src/icons/` | Button and site icons. The build inlines them as data URIs. |
| `scripts/build.mjs` | Renders the links, inlines the CSS, writes `dist/index.html`. |
| `scripts/encrypt.mjs` | Encrypts `dist/index.html` into the published `index.html`. |
| `scripts/check-staged.mjs` | Refuses a commit that would publish plaintext links. |
| `dist/index.html` | Plaintext build. Untracked. |
| `index.html` | The published, encrypted page. |

The repository is public, so the album links must never enter git. They live in `links.json`, which
`.gitignore` excludes, and they reach the web only inside the encrypted `index.html`. Pagecrypt
encrypts one file, which is why the build inlines the CSS.

## Setup

```sh
npm install
git config core.hooksPath .githooks
npm run links:open
```

The hook line enables the pre-commit guard; git never enables hooks on clone. The last line decrypts
`links.enc.json` into `links.json` and needs the age key described below.

## Working on a second machine

The links travel through git inside `links.enc.json`, encrypted with SOPS and an age key. Copy the
private key to the other machine, by hand and over a secure channel:

```
~/Library/Application Support/sops/age/keys.txt
```

That path is where SOPS looks on macOS. On Linux it is `~/.config/sops/age/keys.txt`. The public
recipient sits in `.sops.yaml` and is safe to commit; the private key must never enter the
repository.

After editing `links.json`, seal it again before committing:

```sh
npm run links:seal
```

`npm run build` decrypts `links.enc.json` by itself when `links.json` is missing, so a fresh clone
with the key needs no extra step.

## Edit the links

Put your albums in `links.json`. Each section becomes a heading, each entry becomes a button:

```json
{
  "sections": [
    {
      "heading": "Per jaar",
      "links": [
        {
          "title": "2024",
          "meta": "Verjaardagen en vakanties",
          "icon": "photo.png",
          "url": "https://photos.app.goo.gl/...",
          "primary": true
        }
      ]
    }
  ]
}
```

`meta`, `icon` and `primary` are optional. `icon` takes a file name from `src/icons/` —
`photo.png`, `fotoscan.png`, `diascan.png`, `video.png` or `vuurtoren.png` — or any text or emoji.
The build rejects any url that is not `https`.

To get an album link in Google Photos: open the album, choose **Share**, then **Copy link**. Anyone
with that link can see the album, so do not post it in public.

Header text, footer text and the `YOUR_EMAIL_HERE` placeholder live in
[src/index.html](src/index.html).

The full round trip after an edit:

```sh
npm run links:seal     # links.json -> links.enc.json
npm run encrypt        # build, then password prompt, writes index.html
git add -A
git commit -m "Update albums"
git push
```

## Build

```sh
npm run build
```

This writes `dist/index.html`. Open that file in a browser to check your work. Opening
`src/index.html` directly shows the page without cards, because the links are only added at build
time.

## Publish

```sh
npm run encrypt
```

This builds, then asks for a password twice and writes the encrypted `index.html`. The password is
read from a hidden prompt, so it stays out of your shell history. Commit and push `index.html`, and
GitHub Pages deploys it within a minute.

Deployment runs through `.github/workflows/deploy.yml`, which uploads only `index.html`. Set
**Settings > Pages > Source** to *GitHub Actions* once, or the workflow cannot publish.

Give the password to the family by phone or a message app, never in the same message as the link.

## The commit guard

`.githooks/pre-commit` compares the staged `index.html` against the urls in `links.json` and aborts
the commit if it finds one in plaintext. That catches the case where you commit a build instead of
an encrypted page. Bypass it with `--no-verify` only if you are certain the file holds no real links.

## Keep it out of search engines

The `robots` meta tag disappears once Pagecrypt wraps the file, because a crawler then sees only the
Pagecrypt shell. Add a `robots.txt` at the root as a second barrier:

```
User-agent: *
Disallow: /
```

This asks crawlers to stay away. It does not stop anyone who has the address.
