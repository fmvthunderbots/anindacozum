(() => {
  const ANAHTAR = 'anindacozum_uyari_v1';
  const perde = document.getElementById('girisUyari');
  const dugme = document.getElementById('uyariOnay');
  if (!perde || !dugme) return;

  let okundu = false;
  try {
    okundu = localStorage.getItem(ANAHTAR) === '1';
  } catch (_) {}

  if (okundu) return;

  perde.hidden = false;
  document.body.classList.add('uyari-acik');
  dugme.focus();

  dugme.addEventListener('click', () => {
    try {
      localStorage.setItem(ANAHTAR, '1');
    } catch (_) {}
    perde.hidden = true;
    document.body.classList.remove('uyari-acik');
  });
})();
