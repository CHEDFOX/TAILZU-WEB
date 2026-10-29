// x0bot.com/v1/site/event (rewritten here by vercel.json): the server's
// copy of a Lead the pixel just reported, for the visitors whose browser
// blocks the pixel. A beacon: the page is already on its way to the store or
// the installer, and nothing waits for this answer. See _meta.js.
const { config, leadPayload, postEvent } = require("./_meta");

module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).end();
  const c = config();
  if (c.pixelId && c.token) {
    let body = null;
    try { body = typeof req.body === "string" ? JSON.parse(req.body) : req.body; } catch {}
    const payload = leadPayload(req, body);
    // Awaited: a function is frozen once it answers, and the post with it.
    if (payload) await postEvent(payload).catch((err) => console.warn(`[meta] Lead not sent: ${err.message}`));
  }
  res.status(204).end();
};
