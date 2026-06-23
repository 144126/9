import { env } from '$env/dynamic/private';

const PAGE = 20;

export const POST = async ({ request }) => {
  const { t } = await request.json();
  if (!t) return new Response('missing text', { status: 400 });

  const id = crypto.randomUUID();
  const d = Date.now();

  const embRes = await fetch(
    `https://generativelanguage.googleapis.com/v1/models/gemini-embedding-2:embedContent?key=${env.GEMINI}`,
    { method: 'POST', body: JSON.stringify({ content: { parts: [{ text: t }] } }), headers: { 'Content-Type': 'application/json' } }
  );
  if (!embRes.ok) { const err = await embRes.text(); return new Response(err, { status: 500 }); }
  const { embedding } = await embRes.json();

  const qRes = await fetch(
    `${env.QDRANT_URL}/collections/i/points?wait=true`,
    { method: 'PUT', body: JSON.stringify({ points: [{ id, vector: embedding.values, payload: { t, d, s: '' } }] }), headers: { 'Content-Type': 'application/json', 'api-key': env.QDRANT_KEY } }
  );
  if (!qRes.ok) { const err = await qRes.text(); return new Response(err, { status: 500 }); }

  return new Response(JSON.stringify({ id }), { headers: { 'content-type': 'application/json' } });
};

export const GET = async ({ url }) => {
  const s = url.searchParams.get('s');
  const p = url.searchParams.get('p');
  const t = url.searchParams.get('t');
  const e = url.searchParams.get('e');
  const h = { 'Content-Type': 'application/json', 'api-key': env.QDRANT_KEY };

  const must = [];
  if (t || e) {
    const range = {} as Record<string, number>;
    if (t) range.gte = Number(t);
    if (e) range.lte = Number(e);
    must.push({ key: 'd', range });
  }

  if (s) {
    const embRes = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-embedding-2:embedContent?key=${env.GEMINI}`,
      { method: 'POST', body: JSON.stringify({ content: { parts: [{ text: s }] } }), headers: { 'Content-Type': 'application/json' } }
    );
    if (!embRes.ok) { const err = await embRes.text(); return new Response(err, { status: 500 }); }
    const { embedding } = await embRes.json();

    const body: Record<string, unknown> = { vector: embedding.values, limit: PAGE, with_payload: true, offset: p ? (Number(p) - 1) * PAGE : 0 };
    if (must.length) body.filter = { must };

    const qRes = await fetch(`${env.QDRANT_URL}/collections/i/points/search`, { method: 'POST', body: JSON.stringify(body), headers: h });
    if (!qRes.ok) { const err = await qRes.text(); return new Response(err, { status: 500 }); }
    const { result } = await qRes.json();
    return new Response(JSON.stringify(result), { headers: { 'content-type': 'application/json' } });
  }

  const body: Record<string, unknown> = { limit: PAGE, with_payload: true };
  if (p) body.offset = p;
  if (must.length) body.filter = { must };

  const qRes = await fetch(`${env.QDRANT_URL}/collections/i/points/scroll`, { method: 'POST', body: JSON.stringify(body), headers: h });
  if (!qRes.ok) { const err = await qRes.text(); return new Response(err, { status: 500 }); }
  const { result } = await qRes.json();
  return new Response(JSON.stringify(result), { headers: { 'content-type': 'application/json' } });
};
