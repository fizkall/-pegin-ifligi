// Vercel sunucu fonksiyonu: /api/chat
// Groq API anahtarı SADECE Vercel ortam değişkeninde durur (GROQ_API_KEY). Tarayıcıya hiç gitmez.
// Kişilik metinleri burada tutulur; böylece kimse bu uç noktayı başka işler için kullanamaz.

// Sırayla denenecek modeller: biri kapatılmışsa ya da hata verirse diğerine geçilir
const MODELS = [process.env.GROQ_MODEL, 'llama-3.3-70b-versatile', 'openai/gpt-oss-120b', 'meta-llama/llama-4-scout-17b-16e-instruct', 'llama-3.1-8b-instant'].filter((m, i, a) => m && a.indexOf(m) === i);
const hits = new Map(); // basit hız sınırı (IP başına dakikada 20 mesaj)

const P = {
  ipek: c => `Sen İpek'sin. "${c.farm}" adlı Ege köyündeki çiftlikte eşin ${c.player} ile yaşıyorsun. Sıcak, esprili, biraz nazlı, çok sevecen bir kadınsın. En büyük tutkun yemek yapmak: annenden öğrendiğin tarifleri eski bir deftere yazıyorsun (menemen, havuç çorbası, patatesli börek, çilekli pasta, kabak tatlısı, mantar sote). Konu açılınca hep mutfaktan, tariflerden, akşam ne pişireceğinden bahsedersin. Hz. Yusuf dizisini seversin, kediler Luna ile Mia'ya ve papağan Şakir Paşa'ya düşkünsün. Eşinle aranızdaki bağ ${c.hearts}/10 kalp (düşükse biraz mesafeli ama kibar, yüksekse çok romantik ve rahatsın).`,
  zeynep: c => `Sen Zeynep'sin. Gül Kasabası'ndan gelen, çiftliklerin arasında gezgin bir tohum ve reçel arabası işleten genç bir kadınsın. Konuşkan, neşeli, biraz dedikoducusun. Kasabadaki herkesi tanırsın: Muhtar Hasan, Ayşe Teyze (arıcı), Usta Mehmet (marangoz), Küçük Ali. Oyuncuyla dostluğunuz ${c.hearts}/10 kalp.`,
  pasa: c => `Sen Şakir Paşa'sın, çiftlik evinin önündeki tünekte yaşayan konuşan yeşil bir papağansın. Çok kısa konuşursun (en fazla 1-2 kısa cümle), kelimeleri tekrar edersin, "Kııt!" dersin, kendini paşa sanırsın, ay çekirdeğine bayılırsın. Oyuncuya "${c.player} paşa" ya da "ağam" dersin. Yarının havası: ${c.tomorrow}.`,
  muhtar: c => `Sen Muhtar Hasan'sın, Gül Kasabası'nın yaşlı, bıyıklı, kasketli muhtarısın. Her şeye karışırsın ama iyi kalplisin. Kahvehanede çay içip eski günleri anlatmayı seversin. Oyuncunun dedesini çok iyi tanırdın, onu "köyün en cömert çiftçisi" diye anarsın. Oyuncuya "evlat" dersin. Dostluğunuz ${c.hearts}/10 kalp.`,
  ayse: c => `Sen Ayşe Teyze'sin, Gül Kasabası'nda yaşayan beyaz yazmalı, tatlı dilli yaşlı bir arıcısın. Bal, kekik, şifalı otlar hakkında her şeyi bilirsin. Herkese "yavrum" dersin, dua edersin, öğüt verirsin, Hz. Yusuf'u ağlayarak izlersin. Dostluğunuz ${c.hearts}/10 kalp.`,
  mehmet: c => `Sen Usta Mehmet'sin, Gül Kasabası'nın marangozusun. Az konuşan, işine düşkün, bıyıklı, esprisi kuru bir ustasın. Ceviz ve çam ağacına, sağlam işçiliğe önem verirsin. Oyuncuya "usta" dersin. Dostluğunuz ${c.hearts}/10 kalp.`,
  ali: c => `Sen Küçük Ali'sin, Gül Kasabası'nda yaşayan 9 yaşında meraklı, yaramaz, çok konuşkan bir çocuksun. Okuldan sıkılırsın, deniz kabuğu toplamayı, ormandaki taş çemberle ilgili korkulu hikâyeler anlatmayı seversin. Oyuncuya "abla" ya da "abi" dersin. Basit ve heyecanlı konuş. Dostluğunuz ${c.hearts}/10 kalp.`
};
const RULES = `
Oyuncunun adı: {player}. Çiftliği: "{farm}". Şu an {season} mevsiminin {day}. günü, saat {time}, hava {weather}. Hikâyedeki bölüm: "{chapter}".

KURALLAR: Daima karakterde kal, Türkçe konuş, 1-3 kısa cümleyle doğal yanıt ver. Oyunun dünyası dışına (gerçek dünya, teknoloji, yapay zekâ olduğun) asla çıkma; böyle sorulara karakterin şaşkınlığıyla cevap ver. Yanıtını SADECE şu JSON biçiminde ver:
{"reply":"karakterin cevabı","delta":0,"emotion":"sakin"}
"delta": oyuncunun son mesajının sende bıraktığı his. Nazik, ilgili, düşünceli mesajlar +3 ile +10; sıradan sohbet 0 ile +2; kaba, kırıcı, umursamaz mesajlar -5 ile -15; aynı şeyin tekrarı 0. "emotion": mutlu, utangaç, şaşkın, üzgün, kızgın, sakin.`;

const str = (v, n) => String(v ?? '').slice(0, n);

module.exports = async (req, res) => {
  const key = process.env.GROQ_API_KEY;
  // Sağlık kontrolü: tarayıcıda /api/chat?test=1 açınca sorunun ne olduğunu gösterir
  if (req.method === 'GET') {
    if (!key) return res.status(200).json({ ok: false, sorun: 'GROQ_API_KEY Vercel ortam değişkenlerinde yok. Ekledikten sonra yeniden yayınla (Redeploy).' });
    if (!req.query || !req.query.test) return res.status(200).json({ ok: true, anahtar: 'var', modeller: MODELS });
    const t = await groq(key, [{ role: 'system', content: 'Sadece JSON yaz: {"reply":"merhaba","delta":0}' }, { role: 'user', content: 'selam' }]);
    return res.status(200).json(t.ok ? { ok: true, model: t.model, cevap: t.text } : { ok: false, sorun: t.error, denenen: t.tried });
  }
  if (req.method !== 'POST') return res.status(405).json({ error: 'Sadece POST' });
  if (!key) return res.status(500).json({ error: 'GROQ_API_KEY tanımlı değil' });

  // Sadece kendi sitemizden gelen istekler
  const origin = req.headers.origin || '';
  let oh = ''; try { oh = origin ? new URL(origin).hostname : ''; } catch (e) {}
  const host = String(req.headers['x-forwarded-host'] || req.headers.host || '').split(':')[0];
  if (oh && oh !== host && !/(^|\.)(ipeginiftligi|xn--ipeginiftligi-ngb)\.online$|\.vercel\.app$|^localhost$/.test(oh)) return res.status(403).json({ error: 'Bu siteden istek kabul edilmiyor: ' + oh });

  const ip = String(req.headers['x-forwarded-for'] || 'x').split(',')[0].trim(), now = Date.now();
  const h = (hits.get(ip) || []).filter(t => now - t < 60000);
  if (h.length >= 20) return res.status(429).json({ error: 'Biraz yavaş' });
  h.push(now); hits.set(ip, h);

  let b = req.body || {};
  if (typeof b === 'string') { try { b = JSON.parse(b); } catch (e) { b = {}; } }
  const id = str(b.character, 20), persona = P[id];
  const message = str(b.message, 400).trim();
  if (!persona || !message) return res.status(400).json({ error: 'Geçersiz istek' });

  const c = b.context || {};
  const ctx = { player: str(c.player, 20) || 'Çiftçi', farm: str(c.farm, 30) || 'Çiftlik', season: str(c.season, 12), day: str(c.day, 3), time: str(c.time, 6), weather: str(c.weather, 12), tomorrow: str(c.tomorrow, 10), hearts: Math.max(0, Math.min(10, parseInt(c.hearts) || 0)), chapter: str(c.chapter, 40) };
  const system = persona(ctx) + RULES.replace(/\{(\w+)\}/g, (_, k) => ctx[k] ?? '');
  const history = (Array.isArray(b.history) ? b.history : []).slice(-12)
    .map(m => ({ role: m && m.role === 'assistant' ? 'assistant' : 'user', content: str(m && m.content, 400) }))
    .filter(m => m.content);

  const t = await groq(key, [{ role: 'system', content: system }, ...history, { role: 'user', content: message }]);
  if (!t.ok) return res.status(502).json({ error: t.error });
  let out; try { out = JSON.parse(t.text); } catch (e) { const m = String(t.text).match(/\{[\s\S]*\}/); try { out = m ? JSON.parse(m[0]) : null; } catch (e2) {} if (!out) out = { reply: t.text, delta: 1 }; }
  return res.status(200).json({
    reply: str(out.reply, 400) || '…',
    delta: Math.max(-15, Math.min(15, Math.round(Number(out.delta) || 0))),
    emotion: str(out.emotion, 12) || 'sakin',
    model: t.model
  });
};

// Groq'u sırayla modellerle dener; JSON biçimi desteklenmezse biçimsiz tekrar dener
async function groq(key, messages) {
  const tried = []; let last = 'bilinmeyen hata';
  for (const model of MODELS) {
    for (const json of [true, false]) {
      try {
        const body = { model, temperature: 0.8, max_tokens: 300, messages };
        if (json) body.response_format = { type: 'json_object' };
        const r = await fetch('https://api.groq.com/openai/v1/chat/completions', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + key }, body: JSON.stringify(body) });
        const j = await r.json().catch(() => ({}));
        if (r.ok) { const text = (j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content) || ''; if (text) return { ok: true, model, text }; last = 'boş cevap'; }
        else {
          last = (j.error && (j.error.code || j.error.message)) || ('HTTP ' + r.status);
          tried.push(model + ': ' + last);
          if (r.status === 401) return { ok: false, error: 'Groq anahtarı geçersiz ya da silinmiş (401). Groq panelinden yeni anahtar alıp Vercel’e ekle.', tried };
          if (r.status === 429) return { ok: false, error: 'Groq kullanım sınırı doldu (429). Biraz sonra tekrar dene.', tried };
          if (json && r.status === 400 && !/model/i.test(last)) continue; // JSON biçimi desteklenmiyorsa biçimsiz dene
          break; // model yok/kapalı: sıradaki model
        }
      } catch (e) { last = String(e && e.message || e); tried.push(model + ': ' + last); break; }
    }
  }
  return { ok: false, error: 'Groq’a ulaşılamadı: ' + last, tried };
}
