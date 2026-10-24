# Ping — landing page

A single-page product site for Ping, an AI assistant you reach by text message: you save one phone number, text it from any phone, and it replies to that same number.

There is no build step and no dependency. `index.html` holds the markup, `styles.css` the presentation and `app.js` the behaviour; all three are served as-is.

## Run it

```bash
python3 -m http.server 3000
```

Then open http://localhost:3000.

## Files

| File | Purpose |
| --- | --- |
| `index.html` | Markup, metadata and the two structured-data blocks |
| `styles.css` | All layout and visual styling |
| `app.js` | Poll, signup, copy button and the scroll-played conversation |
| `manifest.webmanifest` | Installable web-app manifest and icon set |
| `icon.svg`, `icon-32.png`, `icon-192.png`, `icon-512.png`, `icon-maskable-512.png`, `apple-touch-icon.png` | App icon in every size the platforms ask for |
| `llms.txt` | Plain-text product summary for answer engines |

## What is interactive

- **Would you use this?** One answer per visitor, stored in `localStorage`, against a seeded sample total. Both buttons lock once you answer.
- **Early access signup** Email validation, a delivered-message confirmation, stored in `localStorage`.
- **Copy number** Writes the demo number to the clipboard.
- **The sample thread** Plays as a conversation when it scrolls into view: the message is typed into the composer, sent, then answered. Skipped entirely under `prefers-reduced-motion` or without `IntersectionObserver`.

Nothing is sent to a server. The poll and signups are demo state in the visitor's browser, and the phone number is a placeholder.

## Search and answer engines

The page carries a canonical link, Open Graph and Twitter tags, and two JSON-LD graphs: `SoftwareApplication` and `FAQPage`. The FAQ markup repeats the visible questions word for word, and `llms.txt` mirrors the same facts, including that the demo number and poll totals are not real.

The canonical and `og:image` values are root-relative because this repo has no fixed domain yet; make them absolute once it is deployed.
