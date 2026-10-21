(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const money = n => '$' + n.toFixed(2);
  const pexels = id => `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=600`;

  const PRODUCTS = [
    { id: 'food', name: 'Royal Canin Premium Food', blurb: 'Balanced nutrition for every life stage.', price: 49.99, rating: 4.5, tag: 'Best seller', img: pexels(3658120) },
    { id: 'toys', name: 'Interactive Pet Toys', blurb: 'Puzzle toys that keep busy minds happy.', price: 24.99, rating: 5, tag: 'New', img: pexels(4587958) },
    { id: 'gear', name: 'Designer Pet Accessories', blurb: 'Collars and leads that are comfy and stylish.', price: 34.99, rating: 4, tag: 'Popular', img: pexels(1643456) }
  ];

  const store = {
    get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} }
  };

  /* Toast */
  let tt;
  const toast = msg => { const t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(tt); tt = setTimeout(() => t.classList.remove('show'), 3800); };

  /* Nav */
  const nav = $('#nav'), burger = $('#burger');
  burger.addEventListener('click', () => { const o = nav.classList.toggle('open'); burger.setAttribute('aria-expanded', o); });
  $$('#nav a').forEach(a => a.addEventListener('click', () => { nav.classList.remove('open'); burger.setAttribute('aria-expanded', false); }));
  const links = $$('#nav a:not(.btn)');
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) links.forEach(l => l.classList.toggle('on', l.getAttribute('href') === '#' + e.target.id));
  }), { rootMargin: '-45% 0px -50% 0px' });
  $$('section[id]').forEach(s => io.observe(s));

  /* Products */
  $('#products').innerHTML = PRODUCTS.map(p => `
    <article class="product">
      <div class="pic"><img src="${p.img}" alt="${p.name}" loading="lazy"><span class="tag">${p.tag}</span></div>
      <div class="info"><h3>${p.name}</h3><p>${p.blurb}</p>
        <div class="meta"><span class="price">${money(p.price)}</span>
        <span class="stars" role="img" aria-label="${p.rating} out of 5">${'★'.repeat(Math.round(p.rating))}${'☆'.repeat(5 - Math.round(p.rating))}</span></div>
        <button class="btn small" data-add="${p.id}">Add to cart</button></div>
    </article>`).join('');

  /* Cart */
  let cart = store.get('pol_cart', {});
  const drawer = $('#drawer'), veil = $('#veil');
  const toggleCart = open => {
    drawer.classList.toggle('open', open); drawer.setAttribute('aria-hidden', !open); veil.hidden = !open;
    if (open) $('#cartClose').focus();
  };
  const renderCart = () => {
    const items = Object.entries(cart).map(([id, q]) => ({ ...PRODUCTS.find(p => p.id === id), q })).filter(i => i.id);
    $('#cartList').innerHTML = items.length ? items.map(i => `
      <li><b>${i.name}</b><span>${money(i.price * i.q)}</span>
      <span class="qty"><button data-dec="${i.id}" aria-label="Remove one ${i.name}">−</button>${i.q}<button data-inc="${i.id}" aria-label="Add one ${i.name}">+</button></span></li>`).join('')
      : '<li class="empty">Your cart is empty. Add something from the shop.</li>';
    $('#cartCount').textContent = items.reduce((n, i) => n + i.q, 0);
    $('#cartTotal').textContent = money(items.reduce((n, i) => n + i.price * i.q, 0));
    store.set('pol_cart', cart);
  };
  const change = (id, d) => { cart[id] = (cart[id] || 0) + d; if (cart[id] <= 0) delete cart[id]; renderCart(); };
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-add],[data-inc],[data-dec]'); if (!b) return;
    if (b.dataset.add) { change(b.dataset.add, 1); toast(PRODUCTS.find(p => p.id === b.dataset.add).name + ' added to cart.'); }
    else change(b.dataset.inc || b.dataset.dec, b.dataset.inc ? 1 : -1);
  });
  $('#cartOpen').addEventListener('click', () => toggleCart(true));
  $('#cartClose').addEventListener('click', () => toggleCart(false));
  veil.addEventListener('click', () => toggleCart(false));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') toggleCart(false); });
  $('#checkout').addEventListener('click', () => {
    if (!Object.keys(cart).length) return toast('Add an item before placing an order.');
    // Connect your payment or order API here.
    cart = {}; renderCart(); toggleCart(false); toast('Order request sent. We will contact you to confirm pickup.');
  });
  renderCart();

  /* Opening hours (shop time: New York) */
  const HOURS = { weekday: [8, 20], weekend: [9, 18] };
  const nyNow = () => new Date(new Date().toLocaleString('en-US', { timeZone: 'America/New_York' }));
  const range = d => (d === 0 || d === 6) ? HOURS.weekend : HOURS.weekday;
  const fmt = h => (h % 12 || 12) + (h < 12 ? ' AM' : ' PM');
  const now = nyNow(), [o, c] = range(now.getDay()), st = $('#status');
  const hr = now.getHours() + now.getMinutes() / 60;
  if (hr >= o && hr < c) { st.textContent = 'Open now, closes ' + fmt(c); st.classList.add('open'); }
  else st.textContent = 'Closed, opens ' + fmt(hr < o ? o : range((now.getDay() + 1) % 7)[0]) + (hr < o ? '' : ' tomorrow');
  $$('.hours tr').forEach(r => r.classList.toggle('today', r.dataset.days.split(',').includes(String(now.getDay()))));

  /* Booking */
  const date = $('#date'), time = $('#time');
  date.min = new Date().toISOString().slice(0, 10);
  date.addEventListener('change', () => {
    if (!date.value) return;
    const [y, m, d] = date.value.split('-').map(Number);
    const [open, close] = range(new Date(y, m - 1, d).getDay());
    let html = '<option value="">Choose a time</option>';
    for (let h = open; h < close; h++) for (const mm of ['00', '30']) html += `<option>${fmt(h).replace(' ', ':' + mm + ' ')}</option>`;
    time.innerHTML = html;
  });
  $$('[data-service]').forEach(a => a.addEventListener('click', () => {
    const r = $(`input[name=service][value="${a.dataset.service}"]`); if (r) r.checked = true;
  }));
  $('#bookForm').addEventListener('submit', e => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(e.target));
    const all = store.get('pol_bookings', []); all.push(d); store.set('pol_bookings', all);
    // Send `d` to your server or email service here.
    toast(`Booked: ${d.pet}, ${d.service} on ${d.date} at ${d.time}. We will confirm soon.`);
    e.target.reset(); time.innerHTML = '<option value="">Choose a date first</option>';
  });
  $('#contactForm').addEventListener('submit', e => {
    e.preventDefault();
    // Send Object.fromEntries(new FormData(e.target)) to your server here.
    toast('Message sent. We will reply within one working day.'); e.target.reset();
  });

  $('#year').textContent = new Date().getFullYear();
})();