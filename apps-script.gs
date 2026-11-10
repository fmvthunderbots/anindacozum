// Google E-Tablo > Uzantılar > Apps Script içine yapıştır. Kurallar tablonun ilk sayfasında durur.
// Bu değeri yalnızca Apps Script düzenleyicisinde doldur; GitHub'a yüklenen kopyaya yazma.
const GEMINI_ANAHTAR = 'BURAYA-GEMINI-ANAHTARI';
const MODEL = 'gemini-3.6-flash';
const SINIFLAR = ['5', '6', '7', '8'];
const SINIF_BASI_EN_COK = 50;

function sayfa_() {
  return SpreadsheetApp.getActive().getSheets()[0];
}

function liste_() {
  return sayfa_().getDataRange().getValues()
    .filter((r) => r[0])
    .map((r) => ({ id: String(r[0]), sinif: String(r[1]), kural: String(r[2]) }));
}

function yanit_(veri) {
  return ContentService.createTextOutput(JSON.stringify(veri)).setMimeType(ContentService.MimeType.JSON);
}

function doGet() {
  return yanit_(liste_());
}

function coz_(b) {
  if (GEMINI_ANAHTAR.startsWith('BURAYA')) return { hata: 'ayar' };
  if (typeof b.b64 !== 'string' || typeof b.talimat !== 'string' || b.b64.length > 8000000 || b.talimat.length > 40000) return { hata: 'istek' };
  const r = UrlFetchApp.fetch('https://generativelanguage.googleapis.com/v1beta/models/' + MODEL + ':generateContent', {
    method: 'post',
    contentType: 'application/json',
    headers: { 'x-goog-api-key': GEMINI_ANAHTAR },
    muteHttpExceptions: true,
    payload: JSON.stringify({
      systemInstruction: { parts: [{ text: b.talimat }] },
      contents: [{ parts: [{ inlineData: { mimeType: 'image/jpeg', data: b.b64 } }, { text: 'Bu sayfayı çöz.' }] }],
      generationConfig: { responseMimeType: 'application/json' },
    }),
  });
  const kod = r.getResponseCode();
  if (kod === 429) return { hata: 'kota' };
  if (kod === 400 || kod === 401 || kod === 403) return { hata: 'ayar' };
  if (kod !== 200) return { hata: 'model', ayrinti: kod };
  const aday = JSON.parse(r.getContentText()).candidates;
  const metin = aday && aday[0] && aday[0].content && aday[0].content.parts ? aday[0].content.parts.map((p) => p.text || '').join('') : '';
  return metin ? { metin: metin } : { hata: 'model', ayrinti: (aday && aday[0] && aday[0].finishReason) || 'bos-yanit' };
}

function doPost(e) {
  let b;
  try {
    b = JSON.parse(e.postData.contents);
  } catch (_) {
    return yanit_({ hata: 'istek' });
  }
  if (b.islem === 'coz') return yanit_(coz_(b));

  const kilit = LockService.getScriptLock();
  kilit.waitLock(10000);
  try {
    if (b.islem === 'ekle') {
      // Baştaki = + - @ kaldırılır, yoksa E-Tablo metni formül olarak çalıştırır.
      const kural = String(b.kural || '').replace(/^[\s=+\-@']+/, '').slice(0, 300).trim();
      const sinif = String(b.sinif);
      if (!kural || !SINIFLAR.includes(sinif)) return yanit_({ hata: 'istek' });
      if (liste_().filter((k) => k.sinif === sinif).length >= SINIF_BASI_EN_COK) return yanit_({ hata: 'dolu' });
      sayfa_().appendRow([Utilities.getUuid(), sinif, kural, new Date()]);
    } else if (b.islem === 'sil') {
      const i = sayfa_().getDataRange().getValues().findIndex((r) => String(r[0]) === String(b.id));
      if (i >= 0) sayfa_().deleteRow(i + 1);
    } else {
      return yanit_({ hata: 'istek' });
    }
    return yanit_(liste_());
  } finally {
    kilit.releaseLock();
  }
}
