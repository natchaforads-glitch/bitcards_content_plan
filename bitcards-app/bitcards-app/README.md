# Bitcards 30-Day Content Plan — Shared Version

This is a small Vercel project (not just one HTML file) so that images
uploaded by anyone (e.g. the graphic designer) are visible to **everyone**
who opens the link.

## What's inside

- `index.html` — the app itself (30-day content plan, editable captions,
  image gallery per day)
- `api/images.js` — a tiny serverless function that stores "which image
  URLs belong to which day" so every visitor sees the same gallery
- `package.json` — tells Vercel this project needs the `@vercel/blob` package

## One-time setup before deploying

1. **Push these 3 files/folders to a GitHub repo** (or use `vercel deploy`
   from this folder if you have the Vercel CLI installed), then import
   that repo into a new Vercel project as usual.

2. **Add Vercel Blob storage to the project** (only needs doing once):
   - Open the project in the Vercel dashboard
   - Go to the **Storage** tab
   - Click **Create Database** → choose **Blob** → click **Connect** to
     this project
   - Vercel automatically adds the `BLOB_READ_WRITE_TOKEN` environment
     variable — no need to copy/paste anything manually

3. **Redeploy** (Vercel usually does this automatically after you connect
   the Blob store — if not, trigger a redeploy from the dashboard).

That's it. After this, anyone who uploads an image through the app will
have it appear for every other visitor automatically, because:

- The image file itself is uploaded to **Cloudinary** (cloud name:
  `ngmjvhnq`, unsigned upload preset: `bitcards_uploads`) — this part was
  already set up.
- The **list of which image belongs to which day** is stored via
  `api/images.js` in Vercel Blob storage, which is shared across all
  visitors — this is the piece that was missing before and now makes the
  gallery fully shared.

## If something goes wrong

- If uploads succeed but don't show up for other people, check that the
  Blob store is actually connected (Storage tab in Vercel dashboard) and
  that a redeploy happened after connecting it.
- If uploads fail immediately, check the browser console — a Cloudinary
  403 usually means the upload preset `bitcards_uploads` was accidentally
  changed away from "Unsigned" mode.
