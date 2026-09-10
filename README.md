# Dijks Archief

Private landing page for the family photo archive. The page holds only links; the photos stay in
private Google Photos albums.

**Live page:** https://jasper-dijkstra.github.io/dijksarchief/

## Files

| File | Purpose |
| --- | --- |
| `src/index.html` | The markup. Edit this one. |
| `src/styles.css` | The styling. Edit this one. |
| `build.mjs` | Inlines the CSS into the HTML and writes the root `index.html`. |
| `index.html` | Generated. Do not edit by hand; the next build overwrites it. |

Pagecrypt encrypts a single file, so the published page must carry its CSS inside a `<style>` block.
The build step keeps the source readable and produces that self-contained file.

## Build

Node 18 or newer, no dependencies to install.

```sh
npm run build
```

While editing, open `src/index.html` directly in a browser. It loads `src/styles.css` and looks the
same as the built page.

## Edit the links

Open [src/index.html](src/index.html) and replace every `YOUR_GOOGLE_PHOTOS_LINK_HERE` with a real
album link. Replace `YOUR_EMAIL_HERE` in the footer as well.

To get an album link in Google Photos: open the album, choose **Share**, then **Copy link**. Anyone
with that link can see the album, so do not post it in public.

To add an album, copy one `<li>` block and change the title, the subtitle and the `href`. To add a
group, copy a whole `<section>` block and give the `<h2>` a new `id`, then point the section's
`aria-labelledby` at that same `id`.

Run `npm run build` after every change, then commit both the source and the generated `index.html`.

## Publish

1. Run `npm run build`, then commit and push to `main`.
2. In the repository, go to **Settings > Pages**.
3. Under **Build and deployment**, set **Source** to *Deploy from a branch*, branch `main`, folder
   `/ (root)`.
4. Wait for the deployment, then open the live page.

## Password protection

GitHub Pages serves static files, so the page has no server-side login. Use
[Pagecrypt](https://github.com/Greenheart/pagecrypt) to encrypt the file in the browser. The visitor
types a password, and only then does the browser decrypt the HTML.

```sh
npm run build
npx pagecrypt index.html index.html "<password>"
```

The second command overwrites the generated `index.html` with the encrypted version. That is safe,
because the readable source stays in `src/`. Re-run both commands after every change.

Give the password to the family by phone or a message app, never in the same message as the link.

## Keep it out of search engines

The `robots` meta tag disappears once Pagecrypt wraps the file, because a crawler then sees only the
Pagecrypt shell. Add a `robots.txt` at the root as a second barrier:

```
User-agent: *
Disallow: /
```

This asks crawlers to stay away. It does not stop anyone who has the address.
