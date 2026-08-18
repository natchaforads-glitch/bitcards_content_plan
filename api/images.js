import { put, list } from '@vercel/blob';

const MANIFEST_PATH = 'bitcards-manifest.json';
const TOKEN = process.env.BLOB_READ_WRITE_TOKEN;

async function readManifest() {
    try {
          const { blobs } = await list({ prefix: MANIFEST_PATH, token: TOKEN });
          const found = blobs.find((b) => b.pathname === MANIFEST_PATH);
          if (!found) return {};
          const res = await fetch(found.url, {
                  cache: 'no-store',
                  headers: { Authorization: `Bearer ${TOKEN}` },
          });
          if (!res.ok) return {};
          return await res.json();
    } catch (e) {
          console.error('readManifest error', e);
          return {};
    }
}

async function writeManifest(data) {
    await put(MANIFEST_PATH, JSON.stringify(data), {
          access: 'private',
          addRandomSuffix: false,
          allowOverwrite: true,
          contentType: 'application/json',
          token: TOKEN,
    });
}

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
        return res.status(200).end();
  }

  if (req.method === 'GET') {
        const data = await readManifest();
        return res.status(200).json(data);
  }

  if (req.method === 'POST') {
        let body = req.body;
        if (typeof body === 'string') {
                try { body = JSON.parse(body); } catch (e) { body = {}; }
        }
        const { dayId, url, action } = body || {};

      if (!dayId || (!url && action !== 'clear')) {
              return res.status(400).json({ error: 'dayId and url are required' });
      }

      const data = await readManifest();
        const key = String(dayId);
        if (!data[key]) data[key] = [];

      if (action === 'remove') {
              data[key] = data[key].filter((u) => u !== url);
      } else {
              data[key].push(url);
      }

      await writeManifest(data);
        return res.status(200).json({ success: true, images: data[key] });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
