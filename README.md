# alexbahia.com

Static site for GitHub Pages (repo `alexbgordon/website`, served from `main`, root folder).
Plain HTML, CSS and a little JavaScript: no build step on the server, no frameworks. Web fonts load from Google Fonts.

**Status:** work in progress. Home and About are still placeholders.

## Layout

```
index.html              Home
poetry/index.html       Poetry
lunde/index.html        Lunde overview
lunde/conjugator/       Old Lundian conjugator (Alex's tool: conjugator, grammar, cases, base-12 numbers)
lunde/modern/index.html Modern Lunde (Lundiyani) grammar
lunde/modern/lexicon/   Lunde lexicon (word list)
gallery/index.html      Photos of textbooks and language materials
about/index.html        About
404.html                Not-found page (GitHub Pages serves this automatically)
assets/site.css         Shared styles (poetry-page palette and fonts)
assets/chrome.css       Shared header, Lunde sub-nav and pager (loaded by every page)
```

The site has two halves: Poetry, and Languages (Lunde, Gallery).

## Navigation

Every page has the same main menu, in this order: Home, Poetry, Lunde, Gallery, About.
The current tab is marked with `aria-current="page"`. The Lunde pages also share a
sub-menu (Overview | Old Lundian conjugator | Modern Lunde | Lexicon) and back/next links. On narrow screens the menu wraps onto extra lines
below the site title (CSS only, no JavaScript).

Links are relative (`../`, `./`) so they work at the domain root and on a local server.
`404.html` uses root links (`/`), because GitHub Pages can serve it at any URL depth.
Links point to folders (`lunde/`), so preview with a local server rather than opening files directly.

## Preview locally

```
python3 -m http.server 8080 --directory .
```

Then open http://localhost:8080/.

## Notes

- The real repo already has a `CNAME` file for alexbahia.com. Don't add or overwrite it from here.
- No home address, phone number or personal email on the site.
- The language is "Lunde". The modern stage is "Modern Lunde (Lundiyani)".
