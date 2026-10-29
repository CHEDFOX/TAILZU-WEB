// x0bot.com/site-events.js (rewritten here by vercel.json): Meta's pixel,
// with the dataset id from Vercel's settings. See _meta.js.
const { siteEventsScript } = require("./_meta");

module.exports = (req, res) => {
  res.setHeader("Content-Type", "application/javascript; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=300, s-maxage=300");
  res.status(200).send(siteEventsScript());
};
