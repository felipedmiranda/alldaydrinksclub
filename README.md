# All Day Drinks Club

The website for Malabar × Barcada: the concept, the full menu, the six bars, and a builder that prices an event bar and sends the request to Felipe. Planned home: **malabar.ph** and **barcada.ph**.

It is a plain static page plus one small function, with nothing to install or build.

## Files

- `index.html`: the whole site (styles, content and code). The brand font, Venice Blvd Black, is embedded in it.
- `page.html`: the same page without the outer `<html>/<head>/<body>` tags, used for the Claude preview link. After editing `index.html`, copy the change here too.
- `img/`: photos. `img/tk/` holds covers of @malabar.ph TikTok videos, taken from Metricool.
- `menu-malabar.pdf`, `menu-barcada.pdf`: the menus behind the two Download buttons.
- `api/request.js`: receives "Send request" and emails it to Felipe through Resend.
- `tests/`: run with `npm test` (Node 18 or newer).

## Where to change content (in the `<script>` at the bottom of `index.html`)

- `MENU`: drinks and prices (June 2026 board).
- `STORES`: the six bars, with their Google score, review count and place link (October 2026). A score from fewer than 20 reviews is hidden.
- `PRICING`: event rates (October 2026). Cart ₱10,000 · Kiosk Bar ₱20,000 · Big Bar ₱40,000 a day for 4 hours, plus ₱2,500 per extra hour. Drinks ₱100–160 at 12 oz, +₱20 at 16 oz, +₱40 at 22 oz. Floaties ₱20 per guest, signature drink ₱5,000, extra bartender ₱5,000 a day.

## Going live (Vercel)

1. Vercel → Add New → Project → import this repository. No build settings are needed.
2. Resend: create a free account at resend.com with felipe@bolero.ph, then create an API key.
3. Vercel → this project → Settings → Environment Variables: add `RESEND_API_KEY`, then redeploy.
4. Vercel → Settings → Domains: add `malabar.ph`, `www.malabar.ph`, `barcada.ph` and `www.barcada.ph`. At dotPH, add the DNS records Vercel shows.
5. Optional: verify malabar.ph in Resend and set `REQUEST_FROM` (for example `All Day Drinks Club <events@malabar.ph>`) so requests can go to any inbox, and `REQUEST_TO` to change who receives them.

## Hosting details

- `vercel.json`: clean addresses, security headers, one-week image caching, and `/page` sends people to the home page.
- `robots.txt` and `sitemap.xml` point search engines to https://malabar.ph, the main address (www and barcada.ph forward to it).
- `img/share.jpg` is the picture shown when the link is shared (WhatsApp, Facebook, Messenger).
