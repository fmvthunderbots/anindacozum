import assert from 'node:assert/strict';
import test from 'node:test';
import { duzeltmeEkle, kurallariTemizle, parcala, talimatYap, temizle } from './core.js';

test('düzeltme önceki çözümü ve isteği ekler', () => {
  const t = duzeltmeEkle('TEMEL', [{ text: '12', x: 1, y: 2, h: 20 }], 'Kesirle göster');
  assert.ok(t.startsWith('TEMEL') && t.includes('"text":"12"') && t.includes('Kesirle göster'));
});

test('kesirleri parçalar', () => {
  assert.deepEqual(parcala('a=2[1|3] kalır'), [{ metin: 'a=2' }, { pay: '1', payda: '3' }, { metin: ' kalır' }]);
  assert.deepEqual(parcala('[1|2][3|4]'), [{ pay: '1', payda: '2' }, { pay: '3', payda: '4' }]);
  assert.deepEqual(parcala('[düz] 3/4'), [{ metin: '[düz] 3/4' }]);
});

test('yalnızca seçili sınıfın kurallarını ekler', () => {
  const k = [{ id: 'a', sinif: '5', kural: 'cebirsiz' }, { id: 'b', sinif: '6', kural: 'EKOK deme' }];
  const t = talimatYap('TEMEL', '6', k);
  assert.ok(t.includes('EKOK deme') && t.includes('6. sınıf') && !t.includes('cebirsiz'));
  assert.ok(!talimatYap('TEMEL', '7', k).includes('kalıcı kuralları'));
});

test('kural yanıtını doğrular', () => {
  assert.deepEqual(kurallariTemizle([{ id: 'a', sinif: '5', kural: 'x' }, { id: 1, kural: 'y' }, null]), [{ id: 'a', sinif: '5', kural: 'x' }]);
  assert.throws(() => kurallariTemizle({ hata: 'x' }));
});

test('geçerli yazıyı korur', () => {
  assert.deepEqual(temizle({ yazilar: [{ text: ' 12 ', x: 100, y: 200, h: 22 }] }), [{ text: '12', x: 100, y: 200, h: 22 }]);
});

test('sayfa dışını ve aşırı boyutu sınırlar', () => {
  assert.deepEqual(temizle({ yazilar: [{ text: 'a', x: -5, y: 5000, h: 900 }] }), [{ text: 'a', x: 0, y: 985, h: 45 }]);
});

test('h yoksa varsayılan kullanır', () => {
  assert.equal(temizle({ yazilar: [{ text: 'a', x: 1, y: 1 }] })[0].h, 20);
});

test('bozuk öğeleri ve bozuk yapıyı atar', () => {
  assert.deepEqual(temizle({ yazilar: [{ text: '', x: 1, y: 1 }, { text: 'a', x: 'b', y: 1 }, null, { text: 5, x: 1, y: 1 }] }), []);
  assert.deepEqual(temizle(null), []);
  assert.deepEqual(temizle({ yazilar: 'x' }), []);
});
