import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

// apps-script.gs dosyasını sahte Google servisleriyle çalıştırır.
function kur(geminiAnahtar = 'gemini-test', cevap = { kod: 200, govde: { candidates: [{ content: { parts: [{ text: '{"yazilar":[]}' }] } }] } }) {
  const satirlar = [];
  const cagrilar = [];
  const sayfa = {
    getDataRange: () => ({ getValues: () => (satirlar.length ? satirlar : [['']]) }),
    appendRow: (r) => satirlar.push(r),
    deleteRow: (n) => satirlar.splice(n - 1, 1),
  };
  let n = 0;
  const ctx = vm.createContext({
    SpreadsheetApp: { getActive: () => ({ getSheets: () => [sayfa] }) },
    ContentService: { MimeType: { JSON: 'json' }, createTextOutput: (t) => ({ setMimeType: () => JSON.parse(t) }) },
    LockService: { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) },
    Utilities: { getUuid: () => 'id' + ++n },
    UrlFetchApp: { fetch: (u, o) => { cagrilar.push({ u, o }); return { getResponseCode: () => cevap.kod, getContentText: () => JSON.stringify(cevap.govde) }; } },
  });
  const kod = readFileSync(new URL('./apps-script.gs', import.meta.url), 'utf8').replace('BURAYA-GEMINI-ANAHTARI', geminiAnahtar);
  vm.runInContext(kod, ctx);
  const post = (b) => JSON.parse(JSON.stringify(ctx.doPost({ postData: { contents: JSON.stringify(b) } })));
  const get = () => JSON.parse(JSON.stringify(ctx.doGet()));
  return { post, get, cagrilar };
}

const coz = { islem: 'coz', b64: 'QUJD', talimat: 'T' };

test('çözüm anahtarı başlıkta gönderir, yanıta sızdırmaz', () => {
  const { post, cagrilar } = kur();
  const y = post(coz);
  assert.deepEqual(y, { metin: '{"yazilar":[]}' });
  assert.equal(cagrilar[0].o.headers['x-goog-api-key'], 'gemini-test');
  assert.ok(!JSON.stringify(y).includes('gemini-test'));
});

test('çözüm hatalarını sınıflar', () => {
  assert.deepEqual(kur('BURAYA-GEMINI-ANAHTARI').post(coz), { hata: 'ayar' });
  assert.deepEqual(kur('k', { kod: 429, govde: {} }).post(coz), { hata: 'kota' });
  assert.deepEqual(kur('k', { kod: 500, govde: {} }).post(coz), { hata: 'model', ayrinti: 500 });
  assert.deepEqual(kur('k', { kod: 200, govde: { candidates: [{}] } }).post(coz), { hata: 'model', ayrinti: 'bos-yanit' });
  assert.deepEqual(kur('k', { kod: 200, govde: { candidates: [{ finishReason: 'SAFETY' }] } }).post(coz), { hata: 'model', ayrinti: 'SAFETY' });
  assert.deepEqual(kur().post({ ...coz, b64: 5 }), { hata: 'istek' });
});

test('ekler, listeler ve siler', () => {
  const { post, get } = kur();
  assert.deepEqual(post({ islem: 'ekle', sinif: '6', kural: 'EKOK deme' }), [{ id: 'id1', sinif: '6', kural: 'EKOK deme' }]);
  assert.equal(get().length, 1);
  assert.deepEqual(post({ islem: 'sil', id: 'id1' }), []);
});

test('formül başlangıcını temizler, geçersiz isteği reddeder', () => {
  const { post } = kur();
  assert.equal(post({ islem: 'ekle', sinif: '5', kural: '=IMPORTXML("a")' })[0].kural, 'IMPORTXML("a")');
  assert.deepEqual(post({ islem: 'ekle', sinif: '99', kural: 'x' }), { hata: 'istek' });
  assert.deepEqual(post({ islem: 'bilinmeyen' }), { hata: 'istek' });
});

test('sınıf başına üst sınır', () => {
  const { post } = kur();
  for (let i = 0; i < 50; i++) post({ islem: 'ekle', sinif: '7', kural: 'k' + i });
  assert.deepEqual(post({ islem: 'ekle', sinif: '7', kural: 'fazla' }), { hata: 'dolu' });
});
