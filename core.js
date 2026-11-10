const sinirla = (v, a, b) => Math.min(b, Math.max(a, v));

const UST_SIMGE = { '⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4', '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9', '⁻': '-', '⁺': '+' };
const ALT_SIMGE = { '₀': '0', '₁': '1', '₂': '2', '₃': '3', '₄': '4', '₅': '5', '₆': '6', '₇': '7', '₈': '8', '₉': '9' };

// "2[1|3]", "2^{3}", "x_{1}", "0,~{3}" -> düz metin, alt alta kesir, üs, alt indis ve devir parçaları.
export function parcala(text) {
  // El yazısı fontunda üst/alt simge karakterleri yok; model yine de kullanırsa işaretli biçime çevir.
  text = text
    .replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹⁻⁺]+/g, (m) => `^{${[...m].map((c) => UST_SIMGE[c]).join('')}}`)
    .replace(/[₀₁₂₃₄₅₆₇₈₉]+/g, (m) => `_{${[...m].map((c) => ALT_SIMGE[c]).join('')}}`);
  const parcalar = [];
  let son = 0;
  for (const m of text.matchAll(/\[([^|\]]+)\|([^|\]]+)\]|\^\{([^}]+)\}|\^([-−]?[0-9A-Za-z]+)|~\{([^}]+)\}|_\{([^}]+)\}|√(\([^)]*\)|[0-9A-Za-z,.]+)/g)) {
    if (m.index > son) parcalar.push({ metin: text.slice(son, m.index) });
    if (m[1] !== undefined) parcalar.push({ pay: m[1].trim(), payda: m[2].trim() });
    else if (m[5] !== undefined) parcalar.push({ devir: m[5] });
    else if (m[6] !== undefined) parcalar.push({ alt: m[6] });
    // Kök çizgisi zaten grup gösterir: √(16 × 3) içi parantezsiz yazılır.
    else if (m[7] !== undefined) parcalar.push({ kok: m[7].replace(/^\((.*)\)$/, '$1') });
    else parcalar.push({ us: m[3] ?? m[4] });
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
  return `${talimat}\n\nBu sayfa daha önce çözüldü. Önceki çözümün (içerik ve konum referansı):\n${JSON.stringify({ yazilar })}\n\nÖğretmenin düzeltme isteği (zorunlu; yukarıdaki kurallarla çelişirse bu istek geçerlidir): ${not}\nBu isteği eksiksiz uygula: istenen değişikliği ilgili bütün satırlarda yap, gerekirse satırları yeniden yaz, böl veya taşı. İstekle ilgisi olmayan satırları aynen koru. İstek hakkında açıklama, onay, not veya özür yazma; sayfaya yalnızca çözümü yaz. Sayfanın tüm çözümünü aynı JSON biçiminde döndür.`;
}

// Model isteği uygulamadığında bir kez daha bununla sorulur.
export const ISRAR = '\n\nÖNEMLİ: Bir önceki yanıtın öğretmenin isteğini uygulamadı ya da sayfaya istekle ilgili bir not yazdı. Bu kez isteği kesinlikle uygula ve değişikliği çözümde göster. Sayfaya yalnızca çözümü yaz.';

const META = /(yapamad|uygulayamad|düzeltemed|değiştiremed|gerçekleştiremed|üzgünüm|özür dilerim|maalesef|isteğin|talebin|düzeltme isteğ|öğretmenin isteğ)/;
// Model bazen çözüm yerine istek hakkında not düşer; bunlar kağıda yazılmaz.
export const metaMi = (text) => META.test(text.toLocaleLowerCase('tr'));
export const metaVar = (ham) => (Array.isArray(ham?.yazilar) ? ham.yazilar : []).some((a) => typeof a?.text === 'string' && metaMi(a.text));

const iz = (yazilar) => JSON.stringify(yazilar.map((a) => [a.text, Math.round(a.x / 10), Math.round(a.y / 10)]));
export const degismedi = (onceki, yeni) => iz(onceki) === iz(yeni);

// Öğrencinin o düzeyde bildiği yöntemler; üst sınıfın yöntemi alt sınıfta kullanılmasın.
const DUZEY = {
  5: 'Öğrenci doğal sayılar, dört işlem, kesirler (basit, bileşik, tam sayılı; denk kesirler, sıralama, toplama-çıkarma), ondalık gösterim, yüzde, temel geometri (açı, üçgen, dörtgen, çevre, alan) ve veri bilir. Negatif sayı, harfli ifade, denklem ve x kullanma; problemleri aritmetik adımlarla, gerekirse şekil veya model düşünerek çöz.',
  6: 'Öğrenci üslü ifadeler (doğal sayı üssü), işlem önceliği, bölünebilme, asal çarpanlar, EBOB-EKOK, kümeler, tam sayılar (sıralama, mutlak değer), kesirlerle dört işlem, ondalık işlemler, oran, cebirsel ifade yazma ve değerini bulma, açılar, alan ve hacim bilir. Denklem çözme ve rasyonel sayı işlemleri bu düzeyde yoktur; bilinmeyeni aritmetik akıl yürütmeyle bul.',
  7: 'Öğrenci tam sayılarla dört işlem, rasyonel sayılar ve işlemleri, cebirsel ifadelerle toplama-çıkarma ve sayıyla çarpma, birinci dereceden bir bilinmeyenli denklem kurma ve çözme, oran-orantı, yüzde problemleri, doğrular ve açılar, çokgenler, çember ve daire bilir. Denklem çözerken her adımda eşitliğin iki tarafına aynı işlemi uygula.',
  8: 'Öğrenci çarpanlar ve katlar, üslü ifadeler (tam sayı üssü, bilimsel gösterim), kareköklü ifadeler, olasılık, cebirsel ifadeler ve özdeşlikler, çarpanlara ayırma, doğrusal denklemler, eğim, eşitsizlikler, Pisagor bağıntısı, eşlik-benzerlik, dönüşüm geometrisi ve geometrik cisimler bilir.',
};

export function talimatYap(temel, sinif, kurallar) {
  const secili = kurallar.filter((k) => k.sinif === sinif).map((k) => '- ' + k.kural.trim());
  let t = `${temel}\n\nBu kağıt ${sinif}. sınıf içindir. Çözümleri bu sınıf düzeyine uygun yöntemle yap. ${DUZEY[sinif] ?? ''}`.trimEnd();
  if (secili.length) t += `\n\nBölüm öğretmenlerinin bu sınıf için kalıcı kuralları. Hepsine uy; çelişirse listede sonra gelen geçerlidir:\n${secili.join('\n')}`;
  return t;
}

// Model çıktısı güvenilmez girdi: bozuk öğeleri at, koordinatları sayfaya sığdır.
export function temizle(ham) {
  const liste = Array.isArray(ham?.yazilar) ? ham.yazilar : [];
  return liste
    .filter((a) => typeof a?.text === 'string' && a.text.trim() && !metaMi(a.text) && Number.isFinite(a.x) && Number.isFinite(a.y))
    .slice(0, 150)
    .map((a) => ({
      text: a.text.trim().slice(0, 200),
      x: sinirla(a.x, 0, 980),
      y: sinirla(a.y, 0, 985),
      h: sinirla(Number.isFinite(a.h) ? a.h : 20, 10, 45),
    }));
}
