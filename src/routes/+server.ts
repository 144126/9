import { env } from '$env/dynamic/private';

export const POST = async ({ request }) => {
  const { t } = await request.json();
  if (!t) return new Response('missing text', { status: 400 });

  const id = crypto.randomUUID();

  const embRes = await fetch(
    `https://generativelanguage.googleapis.com/v1/models/gemini-embedding-2:embedContent?key=${env.GEMINI}`,
    { method: 'POST', body: JSON.stringify({ content: { parts: [{ text: t }] } }), headers: { 'Content-Type': 'application/json' } }
  );
  if (!embRes.ok) { const err = await embRes.text(); return new Response(err, { status: 500 }); }
  const { embedding } = await embRes.json();

  const qRes = await fetch(
    `${env.QDRANT_URL}/collections/i/points?wait=true`,
    { method: 'PUT', body: JSON.stringify({ points: [{ id, vector: embedding.values, payload: { t, s: '' } }] }), headers: { 'Content-Type': 'application/json', 'api-key': env.QDRANT_KEY } }
  );
  if (!qRes.ok) { const err = await qRes.text(); return new Response(err, { status: 500 }); }

  return new Response(JSON.stringify({ id }), { headers: { 'content-type': 'application/json' } });
};
