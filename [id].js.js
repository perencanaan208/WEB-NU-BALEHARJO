// Vercel Serverless Function — /api/berita/:id (di-rewrite dari /berita/:id)
// Tujuan: menghasilkan meta tag Open Graph (judul, ringkasan, foto) YANG BEDA
// untuk setiap berita, supaya saat link dibagikan ke WhatsApp/Facebook/Telegram,
// preview yang muncul adalah foto & judul berita tsb — bukan tampilan default situs.
// Bot share (WhatsApp dsb) TIDAK menjalankan JavaScript, hanya membaca <meta> di HTML
// mentah, makanya perlu di-generate di server seperti ini (bukan lewat SPA).

const GAS_URL = "https://script.google.com/macros/s/AKfycbwTjm0QrYNznOjsdbQ-FYqcSUoU4Y-CAGij2KP4DanJrhmSnsPTX8iM3pH3Yxeuv4hS/exec";
const SITE_URL = "https://nubaleharjo.vercel.app"; // ganti jika domain berbeda

function stripHtml(s) {
  return String(s || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}
function escapeHtml(s) {
  return String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

module.exports = async (req, res) => {
  const { id } = req.query;

  let title = "PRNU Baleharjo Sragen - Official Website";
  let description = "Portal resmi Pengurus Ranting Nahdlatul Ulama Desa Baleharjo, Sukodono, Sragen.";
  let imageUrl = SITE_URL + "/og-image.jpg";
  const redirectUrl = SITE_URL + "/#berita-" + encodeURIComponent(id || "");

  try {
    const r = await fetch(GAS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fn: "getNews", args: [] }),
    });
    const data = await r.json();
    if (data && data.ok) {
      const list = JSON.parse(data.result || "[]");
      const item = list.find((n) => String(n.ID) === String(id));
      if (item) {
        title = item.TITLE || title;
        description = stripHtml(item.SUMMARY || item.CONTENT).slice(0, 160) || description;
        const img = item.IMG || "";
        if (img.indexOf("data:image") === 0) {
          // Foto tersimpan sbg base64 di spreadsheet → proxy lewat /api/og-image/:id
          // supaya jadi URL gambar sungguhan yang bisa diambil bot share.
          imageUrl = SITE_URL + "/api/og-image/" + encodeURIComponent(id);
        } else if (img) {
          imageUrl = img;
        }
      }
    }
  } catch (e) {
    // Kalau backend gagal diakses, cukup fallback ke meta default situs (di atas)
  }

  const html = `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="utf-8">
<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeHtml(description)}">
<meta property="og:type" content="article">
<meta property="og:title" content="${escapeHtml(title)}">
<meta property="og:description" content="${escapeHtml(description)}">
<meta property="og:image" content="${imageUrl}">
<meta property="og:url" content="${redirectUrl}">
<meta property="og:site_name" content="PRNU Baleharjo Sragen">
<meta property="og:locale" content="id_ID">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${escapeHtml(title)}">
<meta name="twitter:description" content="${escapeHtml(description)}">
<meta name="twitter:image" content="${imageUrl}">
<meta http-equiv="refresh" content="0;url=${redirectUrl}">
<script>location.replace(${JSON.stringify(redirectUrl)});</script>
</head>
<body>
  Mengalihkan ke halaman berita, mohon tunggu sebentar…
  <a href="${redirectUrl}">Klik di sini jika tidak berpindah otomatis</a>
</body>
</html>`;

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=300, s-maxage=600, stale-while-revalidate=86400");
  res.status(200).send(html);
};
