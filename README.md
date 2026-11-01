# Big Moments

A scrapbook of our biggest moments. Each one is a book on the shelf; open it to relive the trip.

```bash
npm install
npm run dev
```

## The Disney Adventure voyage

The door to our stateroom swings open and leads straight into the voyage. You scroll through the trip: the sky follows the time of day, the ship sails along the bottom, and each moment develops as you reach it. It ends with a map of the ship where you can revisit everything by place.

- Story and layout: `public/content/disney-adventure.json`
- Photos: `public/moments/disney-adventure/`
- Stickers: `public/moments/disney-adventure/stickers/` (generated with Higgsfield; prompts in `sticker-prompts.md`)

## Editing (local only)

Run `npm run dev`, open the voyage and click **edit** (top right):

- Click a moment to select it, then **paste (Ctrl+V)** or **drop** photos onto it.
- Click any text or caption to rewrite it in place, and drag photos to nudge them.
- Use the panel to set the time of day, the place on the ship map, effects (horn, fireworks, lanterns) and stickers, or to add and delete moments.

Changes save automatically into the project. The deployed site has no edit mode, so commit and push to publish.

**Editing from your phone:** run `npm run dev:phone` on your computer, then open the `Network:` address it prints (e.g. `http://192.168.1.23:5173`) on your phone, on the same Wi-Fi.

## Adding a new big moment

Add an entry to `src/moments.ts` and create `public/content/<id>.json` in the same shape as the Disney one.

## The toy house

The little treehouse in the bottom-right corner opens the toy house. There are two homes, the Treehouse and the Pink Penthouse, each with three floors the toys walk around on, and a searchable friends catalogue beside them. **+ Add a toy** takes a photo (the phone camera opens), cuts the toy out of the background on the device, and asks for their name, birthday, origin, personality, gender and favourite memory. Tap a toy for their card, where you can edit them, move them to another floor, or remove them.

On Vercel, toys are stored in Vercel Blob (see Deploying). When running locally without a Blob token, they're kept in `.local-toys/` on your computer instead.

## The lock

The site opens on a card-catalogue drawer with a 4-digit code. The code is checked on the server, which then sets a cookie; without it, the story, photos and videos (`/content`, `/moments`, `/uploads`) are refused, even by direct link. The passcode and how to change it are in `server/auth.ts`.

## Deploying

Import the repo into Vercel (it auto-detects Vite). Then, in **Project → Settings → Environment Variables**, add:

- `AUTH_SECRET`: a long random string. Make one with:
  `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

Then, under **Storage**, create a **Blob** store and connect it to the project; this adds `BLOB_READ_WRITE_TOKEN` automatically and is where the toy house keeps its toys.

Redeploy after adding these. Without `AUTH_SECRET`, the private files stay locked for everyone.
