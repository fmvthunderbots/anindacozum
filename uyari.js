(() => {
  const ANAHTAR = 'anindacozum_uyari_v2';
  const perde = document.getElementById('girisUyari');
  const ilkAdim = document.getElementById('uyariIlkAdim');
  const devamDugme = document.getElementById('uyariDevam');
  const sonAdim = document.getElementById('uyariSonAdim');
  const evetDugme = document.getElementById('uyariEvet');
  if (!perde || !ilkAdim || !devamDugme || !sonAdim || !evetDugme) return;

  let okundu = false;
  try {
    localStorage.removeItem('anindacozum_uyari_v1');
    okundu = localStorage.getItem(ANAHTAR) === '1';
  } catch (_) {}

  if (okundu) return;

  perde.hidden = false;
  document.body.classList.add('uyari-acik');
  devamDugme.focus();

  let onayZamani = 0;

  devamDugme.addEventListener('click', () => {
    ilkAdim.hidden = true;
    sonAdim.hidden = false;
    onayZamani = Date.now();
    evetDugme.focus();
  });

  evetDugme.addEventListener('click', () => {
    if (Date.now() - onayZamani < 350) return;
    try {
      localStorage.setItem(ANAHTAR, '1');
    } catch (_) {}
    perde.hidden = true;
    document.body.classList.remove('uyari-acik');
  });
})();
