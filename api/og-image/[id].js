// Vercel Serverless Function — /api/og-image/:id
// Proxy gambar berita: foto berita disimpan sbg base64 di Google Sheet (bukan URL
// publik), jadi tidak bisa langsung dipakai og:image. Function ini mengambil
// base64-nya, mendekode jadi file gambar sungguhan, lalu mengirimnya sebagai
// response image biasa — supaya WhatsApp/Facebook bisa mengambilnya sbg thumbnail.

const GAS_URL = "https://script.google.com/macros/s/AKfycbwTjm0QrYNznOjsdbQ-FYqcSUoU4Y-CAGij2KP4DanJrhmSnsPTX8iM3pH3Yxeuv4hS/exec";

module.exports = async (req, res) => {
  const { id } = req.query;
  try {
    const r = await fetch(GAS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fn: "getNews", args: [] }),
    });
    const data = await r.json();
    const list = JSON.parse((data && data.result) || "[]");
    const item = list.find((n) => String(n.ID) === String(id));
    const dataUri = (item && item.IMG) || "";
    const match = /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/.exec(dataUri);

    if (!match) {
      res.writeHead(302, { Location: "/og-image.jpg" });
      return res.end();
    }

    const mime = match[1];
    const buffer = Buffer.from(match[2], "base64");
    res.setHeader("Content-Type", mime);
    res.setHeader("Cache-Control", "public, max-age=86400, stale-while-revalidate=604800");
    res.status(200).send(buffer);
  } catch (e) {
    res.writeHead(302, { Location: "/og-image.jpg" });
    res.end();
  }
};
