// Vercel yayını sırasında çalışır: site dosyalarını dist/ klasörüne kopyalar ve
// GROQ_API_KEY ortam değişkenini index.html'e gömer. Anahtar GitHub'a hiç girmez.
const fs = require('fs');
const out = 'dist';
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out);
const key = (process.env.GROQ_API_KEY || '').trim();
const SKIP = new Set(['build.js', 'package.json', 'vercel.json', 'firebase.json', 'firestore.rules', 'README.md']);
for (const f of fs.readdirSync('.')) {
  if (SKIP.has(f) || f.startsWith('.') || !fs.statSync(f).isFile()) continue;
  if (!/\.(html|css|js|png|svg|ico|txt|xml|webmanifest|json)$/.test(f)) continue;
  if (f === 'index.html') fs.writeFileSync(out + '/index.html', fs.readFileSync(f, 'utf8').replace('"__GROQ_KEY__"', JSON.stringify(key)));
  else fs.copyFileSync(f, out + '/' + f);
}
console.log('Hazır: ' + fs.readdirSync(out).join(', '));
console.log('Groq anahtarı ' + (key ? 'gömüldü' : 'BULUNAMADI: Vercel’de GROQ_API_KEY ekle'));
