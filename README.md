# alexbahia.com

Static site for GitHub Pages (repo `alexbgordon/website`, served from `main`, root folder).
Plain HTML and CSS: no build step, no frameworks, no external requests.

**Status:** skeleton only. Every page body is a labelled placeholder.

## Layout

```
index.html              Home
poetry/index.html       Poetry
lunde/index.html        Lunde overview (Old Lundian: conjugator, grammar, case tool)
lunde/modern/index.html Modern Lunde (Lundiyani), shown under the Lunde tab
languages/index.html    Other languages and in-progress work
gallery/index.html      Photos of textbooks and language materials
about/index.html        About
404.html                Not-found page (GitHub Pages serves this automatically)
assets/site.css         Shared styles
```

The site has two halves: Poetry, and Languages (Lunde, Other languages, Gallery).

## Navigation

Every page has the same main menu, in this order: Home, Poetry, Lunde, Other languages, Gallery, About.
The current tab is marked with `aria-current="page"`. The Lunde pages also have a
sub-menu: Old Lundian | Modern Lunde. On narrow screens the menu wraps onto extra lines
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
