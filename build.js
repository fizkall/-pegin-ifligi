// Vercel yayını sırasında çalışır: dosyaları dist/ klasörüne kopyalar ve
// GROQ_API_KEY ortam değişkenini index.html'e gömer. Anahtar GitHub'a hiç girmez.
const fs = require('fs');
const out = 'dist';
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out);
const key = (process.env.GROQ_API_KEY || '').trim();
let html = fs.readFileSync('index.html', 'utf8');
html = html.replace('"__GROQ_KEY__"', JSON.stringify(key));
fs.writeFileSync(out + '/index.html', html);
for (const f of ['sw.js', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png']) fs.copyFileSync(f, out + '/' + f);
console.log('Hazır. Groq anahtarı ' + (key ? 'gömüldü (' + key.slice(0, 4) + '…)' : 'BULUNAMADI: Vercel’de GROQ_API_KEY ekle'));
