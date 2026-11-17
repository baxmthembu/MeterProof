# MeterProof logo

**The idea:** a P whose round counter is a meter dial. The red needle is the reading, the one thing MeterProof helps you prove.

## Files

| File | Use |
|---|---|
| `meterproof-symbol.svg` | Master. Ink letter, red needle, on light backgrounds |
| `meterproof-symbol-reversed.svg` | On dark backgrounds: paper letter, coral needle |
| `meterproof-symbol-black.svg` / `-white.svg` | One colour: fax, stamps, embossing, single-colour print |
| `meterproof-symbol-small.svg` | Small-size cut for 16 to 48 px: bigger dial and needle. Use it for favicons only |
| `meterproof-lockup.png` | Symbol plus name, 1200 × 300, transparent. Source: `lockup.html` |
| `og.png` | Share image, 1200 × 630. Source: `og.html` |
| `web/` | Favicon, app icon and PWA icon set; `web/app-tile.svg` and `web/maskable-tile.svg` are the dark tile masters |

Where the app uses them:
- `components/logo.tsx` draws the symbol inline. The header, login card, legal pages and footer use `<Logo />`.
- `app/favicon.ico`, `app/icon.svg` (switches to the reversed colours in dark mode), `app/apple-icon.png`, `app/manifest.ts` with `public/icon-192.png`, `icon-512.png` and `maskable-512.png`, `app/opengraph-image.png` and `app/twitter-image.png`.
- `lib/pdf.ts` draws the mark in grey beside "Prepared with MeterProof" on every page of the dispute pack. It stays out of the letterhead on purpose: the letter is from the household, not from MeterProof.

## Colour

| Name | HEX | RGB | Token |
|---|---|---|---|
| Ink (letter) | #1D1614 | 29 22 20 | `--color-ink` |
| Brick red (needle) | #BB3D31 | 187 61 49 | `--color-accent-2` |
| Paper (reversed letter) | #F6F3EF | 246 243 239 | `--color-board-type` |
| Coral (needle on dark) | #EF8B7B | 239 139 123 | `--color-accent` |

CMYK and Pantone matches are not set yet; get them from a printer's proof before any print run.

## Type

The name is set in **General Sans Semibold** (Fontshare, free for commercial use), tracking about -3.5%. In the app it is live text, so it stays crisp and accessible. The lockup PNG and share image were rendered from HTML with the web font; there is no outlined vector wordmark yet.

## Rules

- **Clear space:** keep the width of the stem (a fifth of the symbol's width) clear on every side.
- **Minimum size:** symbol 16 px on screen (use the small cut below 48 px), 5 mm in print. Lockup 96 px wide.
- **Backgrounds:** master on paper or white; reversed on ink or photos darker than 50% grey.
- **Don't:** rotate it (the needle stops being a reading); recolour the letter red; put the needle in any colour but brick red or coral; add a shadow, outline or gradient; stretch it; put the master on a busy photo.

## Open items

- A trademark search (CIPC in South Africa, plus a reverse image search) before you rely on the mark commercially.
- An outlined vector lockup if a printer or partner needs one: convert General Sans Semibold "MeterProof" to paths in a vector editor.
