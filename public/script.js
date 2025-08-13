const uploadForm = document.getElementById('uploadForm');
const fileInput = document.getElementById('fileInput');
const progress = document.getElementById('progress');
const result = document.getElementById('result');
const ctaStart = document.getElementById('ctaStart');

ctaStart?.addEventListener('click', () => {
  document.getElementById('upload')?.scrollIntoView({ behavior: 'smooth' });
});

uploadForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const files = fileInput.files;
  if (!files || files.length < 3) {
    alert('Ajoute au moins 3 photos');
    return;
  }
  progress.classList.remove('hidden');
  result.innerHTML = '';

  const fd = new FormData();
  const style = document.getElementById('style')?.value || 'corporate';
  fd.append('style', style);
  [...files].forEach(f => fd.append('photos', f));

  try {
    const endpoint = paid ? '/api/generate?paid=1' : '/api/generate';
    const res = await fetch(endpoint, { method: 'POST', body: fd });
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    (data.images || []).forEach(url => {
      const img = document.createElement('img');
      img.src = typeof url === 'string' ? url : (url?.url || '');
      img.alt = 'Résultat IA';
      img.style.width = '100%';
      img.style.borderRadius = '12px';
      result.appendChild(img);
    });
    if ((data.images || []).length) downloadAll.classList.remove('hidden');
  } catch (err) {
    console.error(err);
    alert('Échec de génération. Vérifie tes clés API côté serveur.');
  } finally {
    progress.classList.add('hidden');
  }
});

// Plans -> Stripe
document.querySelectorAll('[data-plan]').forEach(btn => {
  btn.addEventListener('click', async () => {
    const plan = btn.getAttribute('data-plan');
    try {
      const r = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan })
      });
    if ((data.images || []).length) downloadAll.classList.remove('hidden');
      const data = await r.json();
      if (data.url) window.location = data.url;
      else alert('Erreur de paiement');
    } catch (e) {
      alert('Erreur de paiement');
    }
  });
});

// Success/Cancel banners
if (location.search.includes('success=1')) alert('Paiement réussi ✅ — Génère tes portraits !');
if (location.search.includes('canceled=1')) alert('Paiement annulé.');


const downloadAll = document.getElementById('downloadAll');
const urlParams = new URLSearchParams(location.search);
const paid = urlParams.has('success'); // consider success=1 as paid

downloadAll?.addEventListener('click', async () => {
  const imgs = [...document.querySelectorAll('#result img')].map(i => i.src);
  if (!imgs.length) return alert('Aucune image à zipper.');
  try {
    const r = await fetch('/api/zip', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ images: imgs })
    });
    if ((data.images || []).length) downloadAll.classList.remove('hidden');
    const blob = await r.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'headshots.zip';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  } catch (e) { alert('Échec du zip'); }
});


// --- Auth (magic link) ---
const btnSignin = document.getElementById('btnSignin');
const signinModal = document.getElementById('signinModal');
const closeModal = document.getElementById('closeModal');
const sendLink = document.getElementById('sendLink');
const emailInput = document.getElementById('emailInput');
const whoami = document.getElementById('whoami');
const historyGrid = document.getElementById('historyGrid');

btnSignin?.addEventListener('click', ()=> signinModal.classList.remove('hidden'));
closeModal?.addEventListener('click', ()=> signinModal.classList.add('hidden'));

sendLink?.addEventListener('click', async ()=> {
  const email = emailInput.value.trim();
  if (!email) return alert('Entrez un email');
  const r = await fetch('/api/auth/request', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ email }) });
  const data = await r.json();
  if (data.ok) {
    document.getElementById('signinMsg').textContent = data.demo_link ? 'Lien de connexion (DEMO) copié en console serveur.' : 'Lien envoyé. Consultez votre email.';
  } else {
    alert(data.error || 'Erreur');
  }
});

async function fetchMe() {
  const r = await fetch('/api/me');
  const data = await r.json();
  if (data.email) {
    whoami.textContent = data.email;
    btnSignin.classList.add('hidden');
    loadHistory();
  }
}

async function loadHistory() {
  try {
    const r = await fetch('/api/history');
    if (!r.ok) return;
    const data = await r.json();
    historyGrid.innerHTML = '';
    (data.items || []).forEach(item => {
      const wrap = document.createElement('div');
      wrap.className = 'card';
      const meta = document.createElement('div');
      meta.className = 'muted';
      meta.textContent = `${item.created_at} • ${item.style} • ${item.paid ? 'payé' : 'gratuit'}`;
      wrap.appendChild(meta);
      const grid = document.createElement('div');
      grid.className = 'grid';
      (item.urls || []).forEach(u => {
        const img = document.createElement('img');
        img.src = u;
        img.style.width = '100%';
        img.style.borderRadius = '12px';
        grid.appendChild(img);
      });
      wrap.appendChild(grid);
      historyGrid.appendChild(wrap);
    });
  } catch {}
}

if (location.pathname === '/auth') {
  // bridge /auth?token=... to /api/auth/verify
  const token = new URLSearchParams(location.search).get('token');
  if (token) location.href = `/api/auth/verify?token=${encodeURIComponent(token)}`;
}

fetchMe();
