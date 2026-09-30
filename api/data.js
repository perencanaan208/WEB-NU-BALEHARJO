// Vercel Serverless Function: /api/data?part=core|news|settings|pengurus|galeri|penta
// Mengambil data dari Google Apps Script lalu disajikan dari CDN Vercel ke semua pengunjung.
// Pengunjung mendapat respons dari edge terdekat, bukan menunggu Apps Script di setiap kunjungan.
//
// Ganti nilai GAS_URL bila deployment Apps Script berubah.

const GAS_URL =
  "https://script.google.com/macros/s/AKfycbwTjm0QrYNznOjsdbQ-FYqcSUoU4Y-CAGij2KP4DanJrhmSnsPTX8iM3pH3Yxeuv4hS/exec";

const MEDIA_PARTS = ["news", "settings", "pengurus", "galeri", "penta"];

module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const part = String((req.query && req.query.part) || "core");
  let payload;
  if (part === "core") payload = { fn: "loadCoreData", args: [] };
  else if (MEDIA_PARTS.includes(part)) payload = { fn: "loadMedia", args: [part] };
  else return res.status(400).json({ ok: false, error: "part tidak dikenal" });

  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), 9000);

  try {
    const upstream = await fetch(GAS_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload),
      redirect: "follow",
      signal: ctl.signal,
    });
    const data = await upstream.json();
    clearTimeout(timer);

    if (!data || !data.ok || !data.result) {
      throw new Error((data && data.error) || "Respons Apps Script tidak valid");
    }

    // s-maxage: dianggap segar di CDN. stale-while-revalidate: setelah itu tetap langsung
    // disajikan (basi) sambil diperbarui di latar belakang → pengunjung tidak menunggu Apps Script.
    const fresh = part === "core" ? 30 : 120;
    res.setHeader("Cache-Control", `public, s-maxage=${fresh}, stale-while-revalidate=86400`);
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    return res.status(200).send(JSON.stringify({ ok: true, result: data.result }));
  } catch (err) {
    clearTimeout(timer);
    // Jangan cache error; klien otomatis jatuh ke jalur cadangan (langsung ke GAS).
    res.setHeader("Cache-Control", "no-store");
    return res.status(502).json({ ok: false, error: String((err && err.message) || err) });
  }
};
