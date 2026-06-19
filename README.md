[README.md](https://github.com/user-attachments/files/29140513/README.md)
# 🕌 Website Resmi PRNU Baleharjo Sragen

Website organisasi PRNU Baleharjo yang di-hosting di GitHub Pages / Vercel,  
dengan backend data menggunakan Google Sheets + Google Apps Script.

---

## 📁 Struktur File

```
.
├── index.html      ← Frontend utama (satu halaman, SPA)
├── Code.gs         ← Backend Google Apps Script (copy ke Apps Script)
├── vercel.json     ← Konfigurasi deploy Vercel
└── README.md
```

---

## 🚀 Cara Deploy

### Langkah 1 — Siapkan Google Apps Script (Backend)

1. Buka [https://script.google.com](https://script.google.com)
2. Buat project baru → klik **"+ New project"**
3. Hapus isi default, lalu **paste seluruh isi `Code.gs`**
4. Sambungkan ke Google Spreadsheet:
   - Klik menu **Extensions → Apps Script** (jika mulai dari Spreadsheet)
   - *Atau*: di editor Apps Script klik ikon **⚙ Project Settings → Script Properties → isi spreadsheetId jika perlu*
5. Klik **Deploy → New deployment**
   - Type: **Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**
6. Klik **Deploy** → **copy URL** yang muncul (format: `https://script.google.com/macros/s/.../exec`)

### Langkah 2 — Tempel URL di `index.html`

Buka `index.html`, cari baris berikut (ada di bagian atas script):

```js
window.GAS_API_URL = "PASTE_URL_WEB_APP_GOOGLE_APPS_SCRIPT_DI_SINI";
```

Ganti nilainya dengan URL yang kamu copy di Langkah 1:

```js
window.GAS_API_URL = "https://script.google.com/macros/s/XXXX/exec";
```

### Langkah 3 — Push ke GitHub

```bash
git init
git add .
git commit -m "first commit: PRNU Baleharjo website"
git remote add origin https://github.com/USERNAME/NAMA-REPO.git
git push -u origin main
```

### Langkah 4 — Deploy ke Vercel

**Cara A — via Vercel Dashboard (termudah):**
1. Buka [https://vercel.com/new](https://vercel.com/new)
2. Klik **"Import Git Repository"** → pilih repo GitHub kamu
3. Biarkan semua pengaturan default → klik **Deploy**
4. Selesai! Vercel akan memberi domain seperti `prnu-baleharjo.vercel.app`

**Cara B — via GitHub Pages:**
1. Di repo GitHub, buka **Settings → Pages**
2. Source: **Deploy from a branch**
3. Branch: `main`, folder: `/ (root)`
4. Klik **Save** → tunggu beberapa menit
5. Akses di `https://USERNAME.github.io/NAMA-REPO`

---

## 🔐 Login Admin

- Username: `admin`
- Password: `aswaja1926`

*(Bisa diubah di sheet **Users** di Google Spreadsheet)*

---

## 📋 Sheet yang Otomatis Dibuat di Google Spreadsheet

| Sheet | Isi |
|-------|-----|
| `Settings` | Pengaturan website (hero, kontak, dll) |
| `Photos` | Foto profil & banom (chunked base64) |
| `News` | Berita & kegiatan |
| `Finance` | Laporan keuangan |
| `Pengurus` | Data pengurus |
| `Inbox` | Pesan masuk dari formulir kontak |
| `GaleriPhotos` | Foto galeri |
| `Users` | Akun admin |

---

## ⚠️ Catatan Penting

- Setiap kali `Code.gs` diubah, **wajib buat deployment baru** di Apps Script
  (Deploy → Manage deployments → buat versi baru)
- URL deployment lama tetap berfungsi; tidak perlu update `index.html` kecuali URL berubah
- Upload foto besar (>5MB) mungkin lambat karena dikirim via fetch ke Apps Script
