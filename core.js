const sinirla = (v, a, b) => Math.min(b, Math.max(a, v));

// "2[1|3] kalır" -> düz metin ve alt alta kesir parçaları.
export function parcala(text) {
  const parcalar = [];
  let son = 0;
  for (const m of text.matchAll(/\[([^|\]]+)\|([^|\]]+)\]/g)) {
    if (m.index > son) parcalar.push({ metin: text.slice(son, m.index) });
    parcalar.push({ pay: m[1].trim(), payda: m[2].trim() });
    son = m.index + m[0].length;
  }
  if (son < text.length) parcalar.push({ metin: text.slice(son) });
  return parcalar;
}

export function kurallariTemizle(ham) {
  if (!Array.isArray(ham)) throw new Error('Kural listesi okunamadı.');
  return ham.filter((k) => typeof k?.id === 'string' && typeof k?.kural === 'string' && k.kural.trim());
}

export function duzeltmeEkle(talimat, yazilar, not) {
  return `${talimat}\n\nBu sayfa daha önce çözüldü. Önceki çözümün:\n${JSON.stringify({ yazilar })}\n\nÖğretmenin düzeltme isteği: ${not}\nİsteği uygula ve sayfanın tüm çözümünü aynı JSON biçiminde yeniden ver. İstekten etkilenmeyen satırları ve konumlarını aynen koru.`;
}

export function talimatYap(temel, sinif, kurallar) {
  const secili = kurallar.filter((k) => k.sinif === sinif).map((k) => '- ' + k.kural.trim());
  let t = `${temel}\n\nBu kağıt ${sinif}. sınıf içindir. Çözümleri bu sınıf düzeyine uygun yöntemle yap.`;
  if (secili.length) t += `\n\nBölüm öğretmenlerinin bu sınıf için kalıcı kuralları. Hepsine uy; çelişirse listede sonra gelen geçerlidir:\n${secili.join('\n')}`;
  return t;
}

// Model çıktısı güvenilmez girdi: bozuk öğeleri at, koordinatları sayfaya sığdır.
export function temizle(ham) {
  const liste = Array.isArray(ham?.yazilar) ? ham.yazilar : [];
  return liste
    .filter((a) => typeof a?.text === 'string' && a.text.trim() && Number.isFinite(a.x) && Number.isFinite(a.y))
    .slice(0, 150)
    .map((a) => ({
      text: a.text.trim().slice(0, 200),
      x: sinirla(a.x, 0, 980),
      y: sinirla(a.y, 0, 985),
      h: sinirla(Number.isFinite(a.h) ? a.h : 20, 10, 45),
    }));
}
