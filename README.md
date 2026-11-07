# İpek'in Çiftliği

İpek'le birlikte dede çiftliğini yeniden canlandırdığın, sakin bir 2.5D çiftlik oyunu. Telefonda ve bilgisayarda oynanır, ana ekrana uygulama gibi eklenebilir.

## Dünya
- **Çiftlik:** Tarla, Taş Ev, İpek, kediler Luna ile Mia, papağan Şakir Paşa, Zeynep'in tohum arabası; Usta Mehmet'e yaptırılan **Kümes** (tavuk → yumurta) ve **Ahır** (inek → süt, koyun → yün)
- **Gül Kasabası** (köprüden doğuya): Muhtarlık ve köy panosu, Gül Pazarı, Kahvehane, **Gül Kafe** (yemeklerini %25 fazlasına alır), Marangozhane, okul, çeşmeli meydan; Muhtar Hasan, Ayşe Teyze, Usta Mehmet, Küçük Ali
- **Çam Ormanı ve Sonbahar Korusu** (güneydeki tüneli 150 altın + 20 odunla aç): toplanabilir ürünler, hayvanlar, taş çember
- **Sahil:** İskele, deniz balıkçılığı, kırık tekne, akşamları açılan **Martı Bar** (köylüler geceleri burada)

## Yapay zekâ ile sohbet (Groq)
Karakterler yazdığına göre cevap verir ve sevgi puanları buna göre değişir. İstekler `api/chat.js` üzerinden Groq'a gider.

Vercel'de **Settings → Environment Variables** bölümüne ekle:

| Ad | Değer |
|---|---|
| `GROQ_API_KEY` | Groq anahtarın (gizli) |
| `GROQ_MODEL` | İsteğe bağlı, varsayılan `llama-3.3-70b-versatile` |

Anahtar asla koda yazılmaz. Yapay zekâya ulaşılamazsa oyun yerel sohbet moduna düşer.

## Google ile giriş ve bulut kaydı (Firebase)
Başlangıç ekranında ya da oyunda **Çanta → Hesap** sekmesinde “Google ile giriş yap”. Giriş yapınca çiftlik buluta kaydedilir; oyun içinde giriş yaparsan buluttaki kayıtla bu cihazdakinden hangisini kullanacağını seçersin.

- Firebase Console → Authentication → **Google** girişini aç.
- Authentication → Settings → **Authorized domains** listesine `ipeginiftligi.online` ve `www.ipeginiftligi.online` alan adlarını ekle.
- Güvenlik kurallarını yükle:

```bash
firebase deploy --only firestore:rules
```

Kurallar `ciftlikler/{uid}` belgesine sadece sahibinin erişmesine izin verir. Eski oyunun `farms` ve `leaderboard` koleksiyonları da çalışmaya devam eder.
