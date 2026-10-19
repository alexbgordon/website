# alexbahia.com

Static site for GitHub Pages (repo `alexbgordon/website`, served from `main`, root folder).
Plain HTML, CSS and a little JavaScript: no build step on the server, no frameworks.
EB Garamond and Courier Prime are self-hosted in `assets/fonts/` (SIL Open Font License) and preloaded;
other scripts' fonts (Hebrew, Japanese, Ge'ez, Gentium) load from Google Fonts.

## Layout

```
index.html                        Home
poetry/index.html                 Poetry
lunde/index.html                  Languages: overview, then one tab per language (#old, #modern)
lunde/conjugator/lexicon.html     Lunde lexicon (Old Lundian), generated from the engine's data
lunde/conjugator/grammar.html     Lunde grammar
lunde/conjugator/index.html       Lunde verb conjugator
lunde/conjugator/cases.html       Lunde case conjugator   (built from grammar.html by build_tool_pages.py)
lunde/conjugator/numbers.html     Lunde number conjugator (built from grammar.html by build_tool_pages.py)
lunde/modern/lexicon/             Lundiyani lexicon (Modern Lundian)
lunde/modern/index.html           Lundiyani grammar (+ the PDF)
lunde/modern/conjugator/          Lundiyani verb conjugator (prototype)
lunde/modern/numbers.html         Lundiyani numbers (build_modern_numbers.py; data in lunde/modern/lundiyani-numbers.js)
lunde/grammar/                    Redirect to lunde/conjugator/grammar.html
gallery/index.html                Photos of notebooks and language materials
about/index.html                  About
404.html                          Not-found page (GitHub Pages serves this automatically)
assets/site.css                   Shared styles (poetry-page palette)
assets/chrome.css                 Fonts, shared header, the page card, Languages sub-nav and pager (every page)
```

## Names

- **Lunde** = the old language (its own name for itself). **Lundiyani** = the modern language.
- **Lundian** is the English name and appears only in parentheses: "Lunde (Old Lundian)", "Lundiyani (Modern Lundian)".
- Spelling (Oct 18): ł = /ɬ/ (Welsh ll; once written xl); a written xl is x + l, only where a root in x meets a suffix
  in l (ixli, kaxli); ğ = /ɟ/ (once gy). The Lundiyani PDF keeps the old spellings and number words.
- Page names: Lunde lexicon / grammar / verb conjugator / case conjugator / number conjugator;
  Lundiyani lexicon / grammar / verb conjugator / numbers. Main headings add the English name in parentheses.

## Navigation and layout

Every page has the same main menu: Home, Poetry, Languages, Gallery, About (`aria-current="page"` on the current one).
Every page puts its content on one shared card (`.ab-card` in `assets/chrome.css`): same width, position, padding and
minimum height everywhere, with `scrollbar-gutter: stable`, so nothing moves between pages.
The Languages pages start the card with the same two-row sub-nav (languages, then the current language's pages)
and end it with back/next links.

### Adding a language

The overview tabs, the sub-nav and the pager all come from one list, `LANGUAGES` in
`site_header.py` (kept with the build scripts, outside the repo). To add a language: append one entry
(`id`, tab `label`, `name`, `english`, `intro`, `items`), add its pages to `PAGES`, give each page the
`lunde-nav` / `lunde-pager` markers, and run `refresh_partials.py`.

Links are relative (`../`, `./`) so they work at the domain root and on a local server.
`404.html` uses root links (`/`), because GitHub Pages can serve it at any URL depth.

## Preview locally

```
python3 -m http.server 8080 --directory .
```

Then open http://localhost:8080/.

## Notes

- The real repo already has a `CNAME` file for alexbahia.com. Don't add or overwrite it from here.
- No home address, phone number or personal email on the site.
