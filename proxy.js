// /api/proxy.js
// Serverless function ini bertindak sebagai perantara (proxy) antara
// domain Vercel dan Google Apps Script (GAS), sehingga address bar
// browser tetap menunjukkan domain Vercel, bukan script.google.com.

const GAS_URL = "https://script.google.com/macros/s/AKfycbzYPMyWY0ChkAEmWmUXCEfqz-TuPTuS4Fc8FbBrbcX3d65pp8XB8PACOFFSVxoeEKKM/exec";

export default async function handler(req, res) {
  try {
    // Susun ulang query string & path tambahan (jika ada) agar tetap diteruskan ke GAS
    const targetUrl = new URL(GAS_URL);
    const incomingUrl = new URL(req.url, `https://${req.headers.host}`);
    incomingUrl.searchParams.forEach((value, key) => {
      targetUrl.searchParams.set(key, value);
    });

    const fetchOptions = {
      method: req.method,
      redirect: "follow",
      headers: {
        "Content-Type": req.headers["content-type"] || "application/json",
      },
    };

    // Teruskan body untuk method selain GET/HEAD
    if (req.method !== "GET" && req.method !== "HEAD") {
      fetchOptions.body = typeof req.body === "string"
        ? req.body
        : JSON.stringify(req.body || {});
    }

    const gasResponse = await fetch(targetUrl.toString(), fetchOptions);
    const contentType = gasResponse.headers.get("content-type") || "text/html; charset=utf-8";
    let body = await gasResponse.text();

    // Jika HTML, ganti referensi domain GAS agar link/asset relatif tetap
    // mengarah lewat proxy ini, bukan langsung ke script.google.com
    if (contentType.includes("text/html")) {
      body = body.replace(/https:\/\/script\.google\.com\/macros\/s\/[^"'\s)]+/g, "/api/proxy");
    }

    res.status(gasResponse.status);
    res.setHeader("Content-Type", contentType);
    // Hilangkan header yang bisa memblokir tampilan dalam konteks domain sendiri
    res.removeHeader && res.removeHeader("X-Frame-Options");
    res.send(body);
  } catch (err) {
    res.status(500).send("Terjadi kesalahan saat menghubungkan ke server: " + err.message);
  }
}
