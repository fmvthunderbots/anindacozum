const sinirla = (v, a, b) => Math.min(b, Math.max(a, v));

export function sureYaz(ms) {
  const sn = Math.round(ms / 1000), dk = Math.floor(sn / 60);
  return dk ? `${dk} dk ${sn % 60} sn` : `${sn} sn`;
}

const UST_SIMGE = { '⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4', '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9', '⁻': '-', '⁺': '+' };
const ALT_SIMGE = { '₀': '0', '₁': '1', '₂': '2', '₃': '3', '₄': '4', '₅': '5', '₆': '6', '₇': '7', '₈': '8', '₉': '9' };

// "2[1|3]", "[1|4|3]", "2^{3}", "x_{1}", "0,~{3}", "√12", "@{B}", "↔{KL}" -> düz metin, alt alta kesir
// (isteğe bağlı genişletme sayısıyla), üs, alt indis, devir, kök, daire içine alınmış şık ve üst işaret parçaları.
export function parcala(text) {
  // El yazısı fontunda üst/alt simge karakterleri yok; model yine de kullanırsa işaretli biçime çevir.
  text = text
    .replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹⁻⁺]+/g, (m) => `^{${[...m].map((c) => UST_SIMGE[c]).join('')}}`)
    .replace(/[₀₁₂₃₄₅₆₇₈₉]+/g, (m) => `_{${[...m].map((c) => ALT_SIMGE[c]).join('')}}`);
  const parcalar = [];
  let son = 0;
  const kalip = /\[(?<pay>[^|\]]+)\|(?<payda>[^|\]]+)(?:\|(?<genis>[^|\]]+))?\]|\^\{(?<us>[^}]+)\}|\^(?<usKisa>[-−]?[0-9A-Za-z]+)|~\{(?<devir>[^}]+)\}|_\{(?<alt>[^}]+)\}|√(?<kok>\([^)]*\)|[0-9A-Za-z,.]+)|@\{(?<daire>[^}]+)\}|(?<ustTip>↔|→|⌒)\{(?<ust>[^}]+)\}/g;
  for (const m of text.matchAll(kalip)) {
    const g = m.groups;
    if (m.index > son) parcalar.push({ metin: text.slice(son, m.index) });
    if (g.pay !== undefined) parcalar.push(g.genis ? { pay: g.pay.trim(), payda: g.payda.trim(), genis: g.genis.trim() } : { pay: g.pay.trim(), payda: g.payda.trim() });
    else if (g.devir !== undefined) parcalar.push({ devir: g.devir });
    else if (g.alt !== undefined) parcalar.push({ alt: g.alt });
    // Kök çizgisi zaten grup gösterir: √(16 × 3) içi parantezsiz yazılır.
    else if (g.kok !== undefined) parcalar.push({ kok: g.kok.replace(/^\((.*)\)$/, '$1') });
    else if (g.daire !== undefined) parcalar.push({ daire: g.daire.trim() });
    // Doğru ↔{KL}, ışın →{EF}, açı adı ⌒{KOD}: işaret harflerin üstüne çizilir.
    else if (g.ust !== undefined) parcalar.push({ ust: g.ust, tip: g.ustTip });
    else parcalar.push({ us: g.us ?? g.usKisa });
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

// İkinci yapay zeka: ilk çözümü öğretmen gözüyle denetler.
export function kontrolEkle(talimat, yazilar) {
  return `${talimat}\n\nBu sayfa bir kez çözüldü. Şimdi sen bu çözümü denetleyen matematik öğretmenisin. Çözüm:\n${JSON.stringify({ yazilar })}\n\nGörüntüdeki her soruyu kendin yeniden çöz ve bu çözümle karşılaştır. Yanlış sonucu, hatalı veya eksik adımı, çözülmeden kalmış soruyu ve yukarıdaki yazım kurallarına ya da sınıf düzeyine uymayan gösterimi düzelt. Yanlış yere yazılmış ya da basılı metnin üstüne binen satırı doğru boşluğa taşı. Doğru olan satırları aynen bırak. Denetim hakkında not yazma. Sayfanın tüm çözümünü aynı JSON biçiminde döndür.`;
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
  5: 'Öğrenci doğal sayılar, dört işlem, kesirler (basit, bileşik, tam sayılı; denk kesirler, sıralama, toplama-çıkarma), ondalık gösterim, yüzde, temel geometri (açı, üçgen, dörtgen, çevre, alan) ve veri bilir. Negatif sayı, harfli ifade, denklem ve x kullanma; problemleri aritmetik adımlarla, gerekirse şekil veya model düşünerek çöz. Bu bölümün yazım tarzı: doğruyu ↔{KL}, ışını →{EF} (başlangıç noktası önce), doğru parçasını [PR] diye yaz; birden çok gösterim varsa "↔{KL} veya ↔{LK}". Açıyı m(⌒{KOD}) = 112° diye adlandır. Uzunluğu |CD| = 24 cm, dikliği d ⊥ [AL], paralelliği k // m diye yaz. Çemberde "yarıçap = 20 cm", "çap = 40 cm" yaz. Çok basamaklı toplama, çıkarma ve çarpmayı alt alta yap: her sayıyı ayrı satıra sağa hizalı yaz, işaretini sol başa koy (+ 1050, × 75), sonuçtan önceki satıra yalnızca "______" çizgisi yaz, sonra sonucu birimiyle yaz (11250 TL). Sözel problemlerde "Kalan = 175 - 75 = 100", "Toplam: 12000 + 11250 = 23250 TL" gibi etiketli satırlar kullan. Ondalık gösterimin okunuşunu yazıyla ver: 7,62 "yedi tam yüzde altmış iki". Yüzdeyi %40, kesri [2|5], ondalığı 0,4 diye yaz. Noktalı yere kavramın adını yaz ("dik açılı üçgen"), seçme sorularında cevabı "M noktası", "3 tanesi", "III. ifade yanlıştır." gibi kısa cümleyle ver; doğru ifadelerin yanına ✓, yanlışların yanına ✗ koy.',
  6: 'Öğrenci üslü ifadeler (doğal sayı üssü), işlem önceliği, bölünebilme, asal çarpanlar, EBOB-EKOK, kümeler, tam sayılar (sıralama, mutlak değer), kesirlerle dört işlem, ondalık işlemler, oran, cebirsel ifade yazma ve değerini bulma, açılar, alan ve hacim bilir. Denklem çözme ve rasyonel sayı işlemleri bu düzeyde yoktur; bilinmeyeni aritmetik akıl yürütmeyle bul. Bu bölümün yazım tarzı: asal çarpanların çarpımını × ile yaz: 84 = 2 × 2 × 3 × 7 (üslü gösterim istenmedikçe kullanma). Çarpan ağacında her satıra ayrılan asal çarpanı ve kalan sayıyı yaz, satırları sağa kaydırarak alt alta diz: "40", "2   20", "  2   10", "    2   5". Asal çarpan algoritmasında bölen listesi yap, her satıra "120 | 2", "60 | 2" ... "1" yaz. Asal sayıları seçerken kutunun içine ✓ koy. Katları ve bölenleri listele: "12\'nin katları: 12, 24, 36, ..., 168, 180"; bölenleri çarpan çiftleriyle bul: "1 · 16, 2 · 8, 4 · 4", sonra "1 + 2 + 4 + 8 + 16 = 31 m". Çevre ve alanda formülü parantezle yaz: "Çevresi = (5 + 13) × 2 = 18 × 2 = 36". Veri sorularında sayıları küçükten büyüğe sırala, ortancayı @{15} ile daire içine al, "tepe değeri: 15" yaz, aritmetik ortalamayı kesirle göster: [14 + 15 + 15 + 15 + 20 + 30 + 45|7] = [154|7] = 22.',
  7: 'Öğrenci tam sayılarla dört işlem, rasyonel sayılar ve işlemleri, cebirsel ifadelerle toplama-çıkarma ve sayıyla çarpma, birinci dereceden bir bilinmeyenli denklem kurma ve çözme, oran-orantı, yüzde problemleri, doğrular ve açılar, çokgenler, çember ve daire bilir. Denklem çözerken her adımda eşitliğin iki tarafına aynı işlemi uygula. Bu bölümün yazım tarzı: tam sayıları işlemlerde işaretiyle ve parantez içinde yaz, pozitif sonucu da + ile ver: (+15) + (-12) = +3, (+20) ÷ (-2) = -10. Negatif rasyonel sayıyı parantez içinde yaz: (-[1|27]). -3^{2} = -9 ile (-3)^{2} = +9 farkına dikkat et. Örüntülerde kuralı n ile yaz: "Kural: 5n + 2", "10. adım: 5 · 10 + 2 = 52". Cebirsel ifadede dağılmayı göster: 6 · (2x + 5) = 12x + 30, (12x + 30) - (4x + 12) = 12x + 30 - 4x - 12 = 8x + 18. Denklemi sözel ifadeye çevirirken "Hangi sayının 8 fazlası 12\'ye eşittir?" biçimini kullan. Uzunluğu |AB| = 2a - 6, çevreyi Ç(ABC) = ... diye yaz.',
  8: 'Öğrenci çarpanlar ve katlar, üslü ifadeler (tam sayı üssü, bilimsel gösterim), kareköklü ifadeler, olasılık, cebirsel ifadeler ve özdeşlikler, çarpanlara ayırma, doğrusal denklemler, eğim, eşitsizlikler, Pisagor bağıntısı, eşlik-benzerlik, dönüşüm geometrisi ve geometrik cisimler bilir. Bu bölümün yazım tarzı: pozitif çarpanları bulurken çarpan çiftlerini iki sütun halinde alt alta yaz ("1   120", "2   60", "3   40" ...), tekrar başlayınca dur. Asal çarpanlara ayırırken bölen listesi yap, her satıra "216 | 2", "108 | 2" ... "1" yaz ve sonucu 2^{3} · 3^{3} diye ver. EBOB ve EKOK\'u EBOB(12, 15) = 3, EKOK(12, 15) = 60 diye yaz; üslü çarpımlarda EBOB için ortak tabanların küçük üslerini, EKOK için bütün tabanların büyük üslerini al. Üslü denklemde önce tabanları eşitle, sonra üsleri eşitle ve denklemi alt alta çöz: (5^{3})^{x+2} = (5^{2})^{x-1}, 3x + 6 = 2x - 2, x = -8. Ondalık gösterimin çözümlenmesinde değeri satırın yanına yaz: 9 · 10^{-1} + 8 · 10^{-2} = 0,98. Alan ve uzunluk sorularında satırları etiketle: "Büyük karenin alanı: (2x + 8)^{2} = 4x^{2} + 32x + 64"; özdeşliği açarak göster ve çıkarmada parantezi dağıt. Orantıyı okla kur: "360° → 6000 kg", "90° → 1500 kg". Grafik ve şekil sorularında bulduğun değerleri ilgili dilimin, sütunun veya kenarın hemen yanına yaz.',
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
