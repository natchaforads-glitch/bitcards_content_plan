import { put, list } from '@vercel/blob';

const META_PATH = 'bitcards-postmeta.json';
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

async function readMeta() {
  try {
    const { blobs } = await list({ prefix: META_PATH, token: TOKEN });
    const found = blobs.find((b) => b.pathname === META_PATH);
    if (!found) return {};
    const res = await fetch(found.url, {
      cache: 'no-store',
      headers: { Authorization: `Bearer ${TOKEN}` },
    });
    if (!res.ok) return {};
    return await res.json();
  } catch (e) {
    console.error('readMeta error', e);
    return {};
  }
}

async function writeMeta(data) {
  await put(META_PATH, JSON.stringify(data), {
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
    const data = await readMeta();
    return res.status(200).json({ role, meta: data });
  }

  if (req.method === 'POST') {
    if (role !== 'edit') {
      return res.status(401).json({ error: 'Edit password required' });
    }

    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch (e) { body = {}; }
    }
    const { dayId, patch } = body || {};

    if (!dayId || typeof patch !== 'object') {
      return res.status(400).json({ error: 'dayId and patch object are required' });
    }

    const data = await readMeta();
    const key = String(dayId);
    data[key] = { ...(data[key] || {}), ...patch };

    await writeMeta(data);
    return res.status(200).json({ success: true, meta: data[key] });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
