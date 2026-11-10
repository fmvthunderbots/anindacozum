# Anında Çözüm

PDF çalışma kağıdını yükle; yapay zeka soruları çözüp el yazısıyla sayfanın üstüne yazsın. Sunucusuz: GitHub Pages'te çalışır, her kullanıcı kendi API anahtarını girer, site sahibine maliyet çıkmaz.

## Yayınlama

1. Bu klasörü bir GitHub deposuna yükle.
2. Depoda **Settings → Pages → Deploy from a branch → main / (root)** seç.
3. Birkaç dakika sonra site `https://KULLANICI.github.io/DEPO/` adresinde açılır.

## Anahtar

- **Gemini:** ücretsiz, [aistudio.google.com/apikey](https://aistudio.google.com/apikey). Ücretsiz katmanda gönderilen veriler Google ürün geliştirmede kullanılabilir.
- **Claude:** ücretli API kredisi, [platform.claude.com](https://platform.claude.com/settings/keys). Claude aboneliği API anahtarı yerine geçmez.

## Ortak anahtar ve öğretmen kuralları

Gemini anahtarı ve kurallar site kodunda değil, bir Google E-Tablo'ya bağlı Apps Script'te durur. Kullanıcıdan anahtar veya şifre istenmez; site adresini bilen herkes kullanabilir. `GEMINI_ANAHTAR` değerini yalnızca Apps Script düzenleyicisinde doldur, bu depodaki `apps-script.gs` dosyasına yazma.

1. Yeni bir E-Tablo aç: [sheets.new](https://sheets.new).
2. **Uzantılar → Apps Script**. İçindekini sil, `apps-script.gs` dosyasını yapıştır.
3. En üstteki `GEMINI_ANAHTAR` değerini doldur, kaydet.
4. **Dağıt → Yeni dağıtım → Web uygulaması**. "Şu kullanıcı olarak çalıştır: Ben", "Erişimi olanlar: Herkes".
5. Verilen `/exec` ile biten adresi `ayar.js` içine yaz.

`apps-script.gs` değişirse **Dağıtımları yönet → Yeni sürüm** ile yeniden dağıt.

## Geliştirme

```bash
node --test core.test.mjs apps-script.test.mjs
```

Yerelde herhangi bir statik sunucuyla açılır (`file://` ile çalışmaz).
