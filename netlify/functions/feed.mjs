// Reads your private Canvas calendar feed on the server (Canvas blocks browsers
// from reading it directly) and hands the page a clean list of assignments.
// The feed link lives in the CANVAS_FEED_URL environment variable, never in the page.

const COURSE_IDS = { "BIOL 221": "41702", "BIOL 231": "41723" };

function unfold(text) {
  return text.replace(/\r\n/g, "\n").replace(/\n[ \t]/g, "");
}
function unescape(v) {
  return v.replace(/\\n/gi, " ").replace(/\\([,;\\])/g, "$1");
}
function toLocalDate(raw) {
  // all-day: 20260928 ; timed: 20261028T230000Z
  const m = raw.match(/(\d{4})(\d{2})(\d{2})(T(\d{2})(\d{2})(\d{2})(Z)?)?/);
  if (!m) return null;
  if (!m[4]) return `${m[1]}-${m[2]}-${m[3]}`;
  const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3], +m[5], +m[6], +m[7]));
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Los_Angeles" }).format(d);
}
function cleanTitle(summary) {
  const m = summary.match(/\s*\[BIOL-(\d+)-\d+\]\s*$/);
  const course = m ? `BIOL ${m[1]}` : "Other";
  let title = (m ? summary.slice(0, m.index) : summary).replace(/\s+/g, " ").trim();
  title = title
    .replace(/ \+ External Webcam - Requires Respondus LockDown Browser \+ Webcam/i, " (webcam + LockDown)")
    .replace(/ - Requires External Webcam - Requires Respondus LockDown Browser \+ Webcam/i, " (webcam + LockDown)");
  return { title, course };
}
function typeOf(title) {
  const t = title.toLowerCase();
  if (t.includes("exam")) return "Exam";
  if (t.includes("quiz")) return "Quiz";
  if (t.includes("discussion") || t.includes("canvas post")) return "Discussion";
  if (t.includes("homework")) return "Homework";
  return "Lab";
}

export default async () => {
  const feedUrl = Netlify.env.get("CANVAS_FEED_URL");
  if (!feedUrl) return Response.json({ error: "CANVAS_FEED_URL is not set" }, { status: 500 });

  let text;
  try {
    const r = await fetch(feedUrl, { headers: { "User-Agent": "assignments-widget" } });
    if (!r.ok) throw new Error("Canvas said " + r.status);
    text = unfold(await r.text());
  } catch (e) {
    return Response.json({ error: String(e.message || e) }, { status: 502 });
  }

  const items = [];
  for (const block of text.split("BEGIN:VEVENT").slice(1)) {
    const get = (key) => {
      const m = block.match(new RegExp("^" + key + "(?:;[^:\\n]*)?:(.*)$", "m"));
      return m ? m[1].trim() : "";
    };
    const uid = get("UID");
    if (!/^event-(sub-)?assignment-/.test(uid)) continue; // skip plain calendar events
    const due = toLocalDate(get("DTSTART"));
    if (!due) continue;
    const { title, course } = cleanTitle(unescape(get("SUMMARY")));
    let url = get("URL");
    if (!url) {
      const cid = COURSE_IDS[course];
      url = cid ? `https://vvc.instructure.com/calendar?include_contexts=course_${cid}&month=${due.slice(5, 7)}&year=${due.slice(0, 4)}` : "";
    }
    items.push({ id: uid, title, course, type: typeOf(title), due, url, source: "canvas" });
  }

  return Response.json(
    { items, fetchedAt: new Date().toISOString() },
    { headers: { "Cache-Control": "public, max-age=300" } }
  );
};

export const config = { path: "/api/feed" };
