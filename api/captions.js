import { put, list } from '@vercel/blob';

const CAPTIONS_PATH = 'bitcards-captions.json';
const TOKEN = process.env.BLOB_READ_WRITE_TOKEN;
const EDIT_PASSWORD = process.env.EDIT_PASSWORD;
const VIEW_PASSWORD = process.env.VIEW_PASSWORD;

function getRole(req) {
  const supplied = req.headers['x-access-password'];
  if (!supplied) return null;
  if (EDIT_PASSWORD && supplied === EDIT_PASSWORD) return 'edit';
  if (VIEW_PASSWORD && supplied === VIEW_PASSWORD) return 'view';
  return null;
}

async function readCaptions() {
  try {
    const { blobs } = await list({ prefix: CAPTIONS_PATH, token: TOKEN });
    const found = blobs.find((b) => b.pathname === CAPTIONS_PATH);
    if (!found) return {};
    const res = await fetch(found.url, {
      cache: 'no-store',
      headers: { Authorization: `Bearer ${TOKEN}` },
    });
    if (!res.ok) return {};
    return await res.json();
  } catch (e) {
    console.error('readCaptions error', e);
    return {};
  }
}

async function writeCaptions(data) {
  await put(CAPTIONS_PATH, JSON.stringify(data), {
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
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Access-Password');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const role = getRole(req);

  if (req.method === 'GET') {
    if (!role) {
      return res.status(401).json({ error: 'Invalid or missing password' });
    }
    const data = await readCaptions();
    return res.status(200).json({ role, captions: data });
  }

  if (req.method === 'POST') {
    if (role !== 'edit') {
      return res.status(401).json({ error: 'Edit password required' });
    }

    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch (e) { body = {}; }
    }
    const { dayId, caption, action } = body || {};

    if (!dayId) {
      return res.status(400).json({ error: 'dayId is required' });
    }

    const data = await readCaptions();
    const key = String(dayId);

    if (action === 'reset') {
      delete data[key];
    } else {
      data[key] = caption;
    }

    await writeCaptions(data);
    return res.status(200).json({ success: true, caption: data[key] });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
