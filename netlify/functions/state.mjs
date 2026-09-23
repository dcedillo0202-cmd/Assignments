// Remembers what you've checked off (and anything you add by hand) so it's the
// same on your phone, laptop, and inside Notion. Stored with Netlify Blobs.
import { getStore } from "@netlify/blobs";

const KEY = "state";
// On first run, anything due before this day counts as already done.
const START_DAY = "2026-09-22";

async function load(store) {
  const s = await store.get(KEY, { type: "json" });
  return s || { done: {}, manual: [], seeded: false };
}

export default async (req) => {
  const store = getStore("assignments");

  if (req.method === "GET") {
    return Response.json(await load(store), { headers: { "Cache-Control": "no-store" } });
  }

  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  let body;
  try { body = await req.json(); } catch { return Response.json({ error: "bad json" }, { status: 400 }); }

  const s = await load(store);
  if (body.action === "seed" && !s.seeded && Array.isArray(body.items)) {
    for (const it of body.items) if (it && it.due < START_DAY) s.done[it.id] = s.done[it.id] || new Date().toISOString();
    s.seeded = true;
  } else if (body.action === "done" && typeof body.id === "string") {
    if (body.value) s.done[body.id] = new Date().toISOString();
    else delete s.done[body.id];
  } else if (body.action === "add" && body.item && typeof body.item.title === "string") {
    const it = body.item;
    s.manual.push({
      id: "manual-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      title: it.title.slice(0, 200), course: String(it.course || "Other").slice(0, 40),
      type: String(it.type || "Other").slice(0, 40), due: String(it.due || "").slice(0, 10), url: "", source: "manual",
    });
    if (s.manual.length > 500) s.manual = s.manual.slice(-500);
  } else if (!body.action || body.action !== "seed") {
    return Response.json({ error: "unknown action" }, { status: 400 });
  }

  await store.setJSON(KEY, s);
  return Response.json(s, { headers: { "Cache-Control": "no-store" } });
};

export const config = { path: "/api/state" };
