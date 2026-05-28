# ⚙️ Johen Gaming Store - Backend (REST API)

![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)
![Midtrans](https://img.shields.io/badge/Midtrans-000000?style=for-the-badge&logo=midtrans&logoColor=white)

Ini adalah *core engine* (API Server) untuk **Johen Gaming Store**. Dibangun menggunakan arsitektur modular NestJS dengan dokumentasi *prototype-based* untuk memastikan setiap iterasi API dapat dikembangkan dan diuji secara independen.

## 🚀 Fitur Utama
- **Manajemen Transaksi:** Integrasi mulus dengan Midtrans Payment Gateway (Snap API & Webhook).
- **Otomatisasi Kredensial:** Pengiriman email otomatis (Nodemailer) berisi data akun rahasia kepada pembeli setelah pembayaran Lunas.
- **Database & Auth:** Komunikasi terpusat dengan Supabase untuk manajemen pengguna, keamanan RLS, dan penyimpanan inventaris.
- **Valuasi Kalkulator:** Logika perhitungan harga otomatis untuk akun game yang masuk.

---

## 🛠️ Panduan Instalasi Lokal (Local Setup)

Ikuti langkah ini untuk menjalankan server API secara lokal di komputermu.

### 1. Persiapan
- Node.js terinstal.
- Akun **Supabase** (dengan tabel yang sudah terkonfigurasi).
- Akun **Midtrans** (Sandbox mode).
- Akun Gmail untuk fitur pengiriman email.

### 2. Kloning & Instalasi
\`\`\`bash
git clone https://github.com/username-kamu/johen-backend.git
cd johen-backend
npm install
\`\`\`

### 🔐 3. Konfigurasi Environment Variables (.env)
Buat sebuah file bernama `.env` di folder paling luar (root) proyek backend ini. Isi dengan format berikut dan ganti dengan data milikmu:

\`\`\`env
# PORT APLIKASI
PORT=3000

# SUPABASE CONFIG
SUPABASE_URL=https://[PROJECT-ID].supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1Ni... (Gunakan Service Role Key, BUKAN Anon Key)

# MIDTRANS CONFIG
MIDTRANS_SERVER_KEY=SB-Mid-server-... (Dapatkan dari dashboard Midtrans Sandbox)

# NODEMAILER (GMAIL CONFIG)
EMAIL_USER=email-kamu@gmail.com
EMAIL_PASS=16_digit_app_password_google
\`\`\`
> *Catatan: Gunakan **App Password** Gmail (16 digit), bukan password login biasa.*

### 4. Jalankan Server
Untuk mode pengembangan (*development*), gunakan perintah ini agar server otomatis *restart* jika ada perubahan kode:
\`\`\`bash
npm run start:dev
\`\`\`
Server akan berjalan di `http://localhost:3000` (atau sesuai port di `.env`).

### ⚠️ 5. Mengetes Webhook Midtrans di Localhost
Jika kamu ingin mengetes fitur pembayaran Midtrans secara lokal, Midtrans tidak bisa menembak langsung ke `localhost`. Kamu harus menggunakan layanan *tunneling* seperti **Ngrok** atau **Localtunnel** untuk mengekspos localhost kamu ke internet.

1. Jalankan `npx localtunnel --port 3000`
2. Copy URL yang dihasilkan (misal: `https://abcd-123.loca.lt`).
3. Masukkan URL tersebut ke **Payment Notification URL** di Dashboard Midtrans kamu dengan format: `https://abcd-123.loca.lt/payment/webhook`.
