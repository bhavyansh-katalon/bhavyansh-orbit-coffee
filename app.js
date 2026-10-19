/* Orbit Coffee demo app: one HTML page, client-side routes. */
const COFFEES = [
  { slug: "classic-roast", name: "Classic roast", origin: "Brazil & Colombia", roast: "Medium", level: 3, price: 14, color: "#6B3E16", notes: ["Chocolate", "Toasted nuts", "Caramel"], about: "Our everyday blend. Smooth, round and happy with milk or without." },
  { slug: "bright-origin", name: "Bright origin", origin: "Ethiopia", roast: "Light", level: 1, price: 17, color: "#C8861A", notes: ["Lemon", "Blueberry", "Jasmine"], about: "A washed coffee from one farm in Yirgacheffe. Juicy and floral as a pour-over." },
  { slug: "easy-decaf", name: "Easy decaf", origin: "Colombia", roast: "Medium", level: 3, price: 15, color: "#5B52C9", notes: ["Caramel", "Red apple", "Cocoa"], about: "Decaffeinated with sugarcane, so it keeps its sweetness. Good for evenings." },
  { slug: "night-owl", name: "Night owl", origin: "Sumatra & Brazil", roast: "Dark", level: 5, price: 16, color: "#191632", notes: ["Dark chocolate", "Molasses", "Cedar"], about: "Bold and low in acidity. Built for espresso and stovetop moka pots." },
  { slug: "sunrise-blend", name: "Sunrise blend", origin: "Kenya & Guatemala", roast: "Light", level: 2, price: 16, color: "#E06D3B", notes: ["Grapefruit", "Honey", "Black tea"], about: "Bright and sweet. A wake-up cup for filter and cold brew." },
  { slug: "honey-process", name: "Honey process", origin: "Costa Rica", roast: "Medium", level: 3, price: 18, color: "#9C7A1E", notes: ["Honey", "Apricot", "Brown sugar"], about: "Dried with some fruit left on the bean, which gives it a syrupy body." }
];
const GUIDES = [
  { slug: "pour-over", name: "Pour-over", time: "4 min", ratio: "15 g : 250 g", grind: "Medium-fine", intro: "Clean and clear, and the best way to taste light roasts.", steps: ["Heat water to 94°C and rinse the paper filter.", "Add 15 g of coffee and level the bed.", "Pour 40 g of water and wait 30 seconds for the bloom.", "Pour slowly in circles up to 250 g.", "Let it drain. Total time is about 3 to 4 minutes."] },
  { slug: "french-press", name: "French press", time: "5 min", ratio: "30 g : 500 g", grind: "Coarse", intro: "Full-bodied and forgiving. No paper filter needed.", steps: ["Add 30 g of coarse coffee to the press.", "Pour 500 g of water just off the boil.", "Stir once and put the lid on.", "Wait 4 minutes.", "Press slowly and pour right away."] },
  { slug: "cold-brew", name: "Cold brew", time: "16 hours", ratio: "100 g : 1 litre", grind: "Coarse", intro: "Smooth, sweet and low in acidity. Make it the night before.", steps: ["Mix 100 g of coarse coffee with 1 litre of cold water.", "Cover and leave in the fridge for 14 to 18 hours.", "Strain through a paper filter.", "Serve over ice, diluted 1:1 with water or milk."] },
  { slug: "moka-pot", name: "Moka pot", time: "6 min", ratio: "17 g : 170 g", grind: "Fine", intro: "Strong and syrupy, close to espresso without a machine.", steps: ["Fill the base with hot water up to the valve.", "Fill the basket with fine coffee without pressing it down.", "Screw it together and put it on medium heat.", "Take it off the heat when it starts to sputter.", "Stir and serve."] }
];
const FAQ = [
  ["When does my coffee ship?", "Every bag is roasted the week it ships. One-time orders ship within 3 working days."],
  ["Can I pause or skip a delivery?", "Yes. Go to Account, find your subscription, and choose Skip next delivery or Pause."],
  ["Which grind should I choose?", "Choose whole bean if you have a grinder. Otherwise pick the grind that matches how you brew."],
  ["Do you have a promo code?", "Try ORBIT10 for 10% off this order."]
];
const GRINDS = { whole: "Whole bean", espresso: "Espresso", filter: "Filter", press: "French press" };
const SIZES = { small: { label: "250 g", factor: 1 }, large: { label: "1 kg", factor: 3.6 } };
const FREQ = { weekly: "Every week", fortnightly: "Every 2 weeks", monthly: "Every month" };
const DELIVERY = { standard: { label: "Standard, 3 to 5 days", price: 4 }, express: { label: "Express, next day", price: 9 } };
const PROMOS = { ORBIT10: 0.1 };

/* state */
const KEY = "orbit-coffee-state";
const fresh = () => ({ cart: [], user: null, orders: [], subscriptions: [], promo: null });
let S;
try { S = Object.assign(fresh(), JSON.parse(localStorage.getItem(KEY)) || {}); } catch { S = fresh(); }
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch {} updateCount(); };
let checkout = { step: 1, shipping: {}, delivery: "standard" };
let pick = {};

/* helpers */
const $ = id => document.getElementById(id);
const money = n => "$" + n.toFixed(2);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const coffee = slug => COFFEES.find(c => c.slug === slug);
const linePrice = l => coffee(l.slug).price * SIZES[l.size].factor * (l.plan === "subscribe" ? 0.9 : 1);
const subtotal = () => S.cart.reduce((s, l) => s + linePrice(l) * l.qty, 0);
const discount = () => S.promo ? subtotal() * PROMOS[S.promo] : 0;
const roastBars = n => `<span class="roast" aria-label="Roast level ${n} of 5">${[1,2,3,4,5].map(i => `<i class="${i <= n ? "on" : ""}"></i>`).join("")}</span>`;
const bag = c => `<div class="bag" style="background:${c.color}"><span>${c.name}</span></div>`;
function updateCount() { $("cart-count").textContent = S.cart.reduce((s, l) => s + l.qty, 0); }
function toast(msg) {
  document.querySelectorAll(".toast").forEach(x => x.remove());
  const t = document.createElement("div"); t.className = "toast"; t.setAttribute("role", "status"); t.dataset.testid = "toast"; t.textContent = msg;
  document.body.appendChild(t); setTimeout(() => t.remove(), 2600);
}
function modal({ title, body, confirm, confirmId, cancel = "Keep it", cancelId, danger, onConfirm }) {
  $("layer").innerHTML = `<div class="overlay" id="modal-overlay"><div class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
    <h2 id="modal-title">${title}</h2><p class="muted">${body}</p>
    <div class="actions"><button class="btn ghost" id="${cancelId}">${cancel}</button><button class="btn ${danger ? "danger" : ""}" id="${confirmId}">${confirm}</button></div></div></div>`;
  const close = () => { $("layer").innerHTML = ""; document.removeEventListener("keydown", esc_); };
  const esc_ = e => e.key === "Escape" && close();
  document.addEventListener("keydown", esc_);
  $(cancelId).onclick = close;
  $("modal-overlay").onclick = e => e.target.id === "modal-overlay" && close();
  $(confirmId).onclick = () => { close(); onConfirm(); };
  $(cancelId).focus();
}
function field(id, label, opts = {}) {
  const { type = "text", ac = "off", cls = "", value = "", hint = "" } = opts;
  return `<div class="field" id="${id}-field"><label class="lbl" for="${id}">${label}</label>
    <input class="txt ${cls}" id="${id}" type="${type}" autocomplete="${ac}" value="${esc(value)}" aria-describedby="${id}-error">
    ${hint ? `<div class="hint">${hint}</div>` : ""}<div class="err" id="${id}-error"></div></div>`;
}
function validate(rules) {
  let first = null;
  for (const [id, test, msg] of rules) {
    const bad = !test($(id).value.trim());
    $(id + "-error").textContent = bad ? msg : "";
    $(id + "-field").classList.toggle("invalid", bad);
    if (bad && !first) first = id;
  }
  if (first) $(first).focus();
  return !first;
}
const isEmail = v => /^\S+@\S+\.\S+$/.test(v);

/* pages */
const pages = {
  home: () => `
    <section class="hero">
      <div>
        <h1>Fresh coffee, on your schedule.</h1>
        <p>Pick a roast, choose how often it arrives, and we roast it the week it ships. Skip or pause any time.</p>
        <div class="actions">
          <a href="/shop" class="btn" id="hero-shop" data-link>Shop coffee</a>
          <a href="/guides" class="btn ghost" id="hero-guides" data-link>Learn to brew</a>
        </div>
      </div>
      <div class="orbit" role="img" aria-label="A coffee cup with a bean circling it"><div class="ring"></div><div class="cup"></div><div class="bean"></div></div>
    </section>
    <h2 class="sr">How it works</h2>
    <ol class="steps">
      <li><h3>Choose a coffee</h3><p class="muted">Six roasts, from bright and fruity to dark and chocolatey.</p></li>
      <li><h3>Set your rhythm</h3><p class="muted">Buy once, or subscribe weekly, every 2 weeks or monthly and save 10%.</p></li>
      <li><h3>Brew it well</h3><p class="muted">Every bag comes with a recipe. Our brew guides cover the rest.</p></li>
    </ol>
    <div class="section-head"><h2>Popular right now</h2><a href="/shop" id="home-view-all" data-link>View all coffee</a></div>
    <div class="grid">${COFFEES.slice(0, 4).map(card).join("")}</div>`,

  shop: () => {
    const q = new URLSearchParams(location.search);
    const roast = q.get("roast") || "All", term = q.get("q") || "", sort = q.get("sort") || "popular";
    let list = COFFEES.filter(c => (roast === "All" || c.roast === roast) && (c.name + " " + c.origin + " " + c.notes.join(" ")).toLowerCase().includes(term.toLowerCase()));
    if (sort === "price-low") list = [...list].sort((a, b) => a.price - b.price);
    if (sort === "price-high") list = [...list].sort((a, b) => b.price - a.price);
    return `
      <h1 class="page-title">All coffee</h1>
      <p class="lead">Roasted in small batches every week. Subscribe to any coffee to save 10%.</p>
      <div class="toolbar">
        <label class="sr" for="search-coffee">Search coffee</label>
        <input class="txt" id="search-coffee" placeholder="Search by name, origin or flavour" value="${esc(term)}">
        <div class="pills" role="group" aria-label="Roast">
          ${["All", "Light", "Medium", "Dark"].map(r => `<button class="pill" id="roast-${r.toLowerCase()}" data-roast="${r}" aria-pressed="${roast === r}">${r}</button>`).join("")}
        </div>
        <label class="sr" for="sort-coffee">Sort</label>
        <select class="txt" id="sort-coffee">
          <option value="popular" ${sort === "popular" ? "selected" : ""}>Most popular</option>
          <option value="price-low" ${sort === "price-low" ? "selected" : ""}>Price, low to high</option>
          <option value="price-high" ${sort === "price-high" ? "selected" : ""}>Price, high to low</option>
        </select>
      </div>
      <p class="muted" id="result-count" aria-live="polite">${list.length} ${list.length === 1 ? "coffee" : "coffees"}</p><br>
      ${list.length ? `<div class="grid">${list.map(card).join("")}</div>` : `<div class="empty"><h2>No coffee matches that</h2><p>Try another flavour or <button class="link" id="clear-filters">clear the filters</button>.</p></div>`}`;
  },

  coffee: slug => {
    const c = coffee(slug);
    if (!c) return notFound();
    pick = { slug, grind: "whole", size: "small", plan: "once", freq: "monthly", qty: 1 };
    return `<p class="crumbs"><a href="/shop" id="back-shop" data-link>All coffee</a> / ${c.name}</p><div class="detail" id="coffee-detail"></div>`;
  },

  cart: () => {
    if (!S.cart.length) return `<h1 class="page-title">Your cart</h1><div class="empty"><h2>Your cart is empty</h2><p>Find a coffee you like and it will show up here.</p><br><a href="/shop" class="btn" id="cart-shop" data-link>Shop coffee</a></div>`;
    return `<h1 class="page-title">Your cart</h1>
      <div class="cart">
        <section aria-label="Items">${S.cart.map((l, i) => {
          const c = coffee(l.slug);
          return `<div class="line" data-testid="cart-line-${l.slug}">
            ${bag(c)}
            <div><h3>${c.name}</h3><p class="muted">${SIZES[l.size].label} · ${GRINDS[l.grind]} · ${l.plan === "subscribe" ? FREQ[l.freq] + ", 10% off" : "One-time"}</p>
              <div class="qty" style="margin-top:8px"><button aria-label="Fewer ${c.name}" id="minus-${l.slug}" data-minus="${i}">−</button><input aria-label="Quantity of ${c.name}" id="quantity-${l.slug}" value="${l.qty}" readonly><button aria-label="More ${c.name}" id="plus-${l.slug}" data-plus="${i}">+</button></div></div>
            <div style="text-align:right"><b>${money(linePrice(l) * l.qty)}</b><br><button class="link" id="remove-${l.slug}" data-remove="${i}">Remove</button></div>
          </div>`;}).join("")}</section>
        <aside class="panel sum">
          <h2 style="font-size:1.3rem;margin-bottom:14px">Summary</h2>
          <dl><dt>Subtotal</dt><dd>${money(subtotal())}</dd>
            ${S.promo ? `<dt>Promo ${S.promo}</dt><dd>−${money(discount())}</dd>` : ""}
            <dt>Delivery</dt><dd>At checkout</dd>
            <dt class="grand">Total</dt><dd class="grand" id="cart-total">${money(subtotal() - discount())}</dd></dl>
          <div class="field" id="promo-code-field"><label class="lbl" for="promo-code">Promo code</label>
            <div class="promo"><input class="txt" id="promo-code" placeholder="ORBIT10" value="${S.promo || ""}"><button class="btn ghost sm" id="apply-promo">Apply</button></div>
            <div class="err" id="promo-code-error"></div></div>
          <a href="/checkout" class="btn full" id="go-checkout" data-link>Go to checkout</a>
        </aside>
      </div>`;
  },

  checkout: () => {
    if (!S.cart.length) return `<h1 class="page-title">Checkout</h1><div class="empty"><h2>Nothing to check out yet</h2><p>Add a coffee to your cart first.</p><br><a href="/shop" class="btn" data-link>Shop coffee</a></div>`;
    const st = checkout.step, sh = checkout.shipping;
    if (!sh.email && S.user) sh.email = S.user.email;
    const ship = DELIVERY[checkout.delivery].price;
    const total = subtotal() - discount() + ship;
    const step1 = `<form id="shipping-form" novalidate>
        <h2 style="font-size:1.4rem;margin-bottom:16px">Where should we send it?</h2>
        ${field("shipping-name", "Full name", { ac: "name", value: sh.name || "" })}
        ${field("shipping-email", "Email", { type: "email", ac: "email", value: sh.email || "", hint: S.user ? "" : "Use the same email as your account to see this order there." })}
        ${field("shipping-address", "Street address", { ac: "street-address", value: sh.address || "" })}
        <div class="row2">${field("shipping-city", "City", { ac: "address-level2", value: sh.city || "" })}${field("shipping-postcode", "Postcode", { ac: "postal-code", value: sh.postcode || "" })}</div>
        <button class="btn" id="continue-delivery">Continue to delivery</button></form>`;
    const step2 = `<h2 style="font-size:1.4rem;margin-bottom:16px">How fast?</h2>
        ${Object.entries(DELIVERY).map(([k, d]) => `<button class="choice" id="delivery-${k}" aria-pressed="${checkout.delivery === k}" data-delivery="${k}"><span>${d.label}</span><b>${money(d.price)}</b></button>`).join("")}
        <div style="display:flex;gap:10px;margin-top:16px"><button class="btn ghost" id="back-shipping">Back</button><button class="btn" id="continue-payment">Continue to payment</button></div>`;
    const step3 = `<form id="payment-form" novalidate>
        <h2 style="font-size:1.4rem;margin-bottom:16px">Payment</h2>
        ${field("payment-card", "Card number", { cls: "katalon-excluded", hint: "Demo: any 16 digits" })}
        <div class="row2">${field("payment-expiry", "Expiry (MM/YY)", { cls: "katalon-excluded" })}${field("payment-security", "Security code", { cls: "katalon-excluded" })}</div>
        <div style="display:flex;gap:10px"><button type="button" class="btn ghost" id="back-delivery">Back</button><button class="btn" id="place-order">Place order · ${money(total)}</button></div></form>`;
    return `<h1 class="page-title">Checkout</h1>
      <ol class="stepper" aria-label="Checkout progress">${["Shipping", "Delivery", "Payment"].map((n, i) => `<li class="${i + 1 === st ? "now" : i + 1 < st ? "done" : ""}" ${i + 1 === st ? 'aria-current="step"' : ""}>${i + 1}. ${n}</li>`).join("")}</ol>
      <div class="cart"><section class="panel">${[step1, step2, step3][st - 1]}</section>
      <aside class="panel sum"><h2 style="font-size:1.3rem;margin-bottom:14px">Your order</h2>
        <ul class="list">${S.cart.map(l => `<li><span>${l.qty} × ${coffee(l.slug).name}<br><small class="muted">${SIZES[l.size].label}, ${l.plan === "subscribe" ? FREQ[l.freq].toLowerCase() : "one-time"}</small></span><span>${money(linePrice(l) * l.qty)}</span></li>`).join("")}</ul>
        <dl style="margin-top:14px"><dt>Subtotal</dt><dd>${money(subtotal())}</dd>${S.promo ? `<dt>Promo</dt><dd>−${money(discount())}</dd>` : ""}<dt>Delivery</dt><dd>${money(ship)}</dd><dt class="grand">Total</dt><dd class="grand">${money(total)}</dd></dl>
        <a href="/cart" id="edit-cart" data-link>Edit cart</a></aside></div>`;
  },

  confirmed: () => {
    const o = S.orders[0];
    if (!o) return `<div class="empty"><h2>No order yet</h2><p>Place an order and your confirmation shows here.</p></div>`;
    return `<section class="done"><h1>Your coffee is on its way.</h1>
      <p>Thanks, ${esc(o.name)}. Order <strong id="order-number">${o.id}</strong> for ${money(o.total)} is confirmed, and we sent the details to ${esc(o.email)}.
      ${o.subs ? ` You also started ${o.subs} ${o.subs === 1 ? "subscription" : "subscriptions"}, which you can manage in your account.` : ""}</p>
      <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap"><a href="/account" class="btn" id="view-account" data-link>View my account</a><a href="/shop" class="btn ghost" id="keep-shopping" data-link>Keep shopping</a></div></section>`;
  },

  login: () => `<div class="auth"><h1 class="page-title">Sign in</h1><p class="lead">Demo account: any email and a password of 6 or more characters.</p>
    <form class="panel" id="login-form" novalidate>
      ${field("login-email", "Email", { type: "email", ac: "email" })}
      ${field("login-password", "Password", { type: "password", ac: "current-password", cls: "katalon-excluded" })}
      <button class="btn full" id="login-submit">Sign in</button></form></div>`,

  account: () => {
    const mine = S.orders.filter(o => o.email.toLowerCase() === S.user.email.toLowerCase());
    const subs = S.subscriptions.filter(s => s.email.toLowerCase() === S.user.email.toLowerCase());
    return `<div class="section-head"><div><h1 class="page-title">Your account</h1><p class="muted">Signed in as ${esc(S.user.email)}</p></div><button class="btn ghost sm" id="logout-button">Sign out</button></div>
      <div class="account">
        <section class="panel"><h2 style="font-size:1.35rem;margin-bottom:12px">Subscriptions</h2>
          ${subs.length ? subs.map(s => `<div class="sub" data-testid="subscription-${s.id}" style="padding:14px 0;border-bottom:2px solid var(--line)">
              <div class="meta"><b>${coffee(s.slug).name}</b><span class="badge ${s.status.toLowerCase()}">${s.status}</span></div>
              <span class="muted">${SIZES[s.size].label}, ${FREQ[s.freq].toLowerCase()}. ${s.status === "Active" ? `Next delivery ${s.next}.` : ""}</span>
              ${s.status === "Cancelled" ? "" : `<div style="display:flex;gap:8px;flex-wrap:wrap">
                ${s.status === "Active" ? `<button class="btn ghost sm" id="skip-${s.slug}" data-skip="${s.id}">Skip next delivery</button><button class="btn ghost sm" id="pause-${s.slug}" data-pause="${s.id}">Pause</button>` : `<button class="btn sm" id="resume-${s.slug}" data-resume="${s.id}">Resume</button>`}
                <button class="link" id="cancel-${s.slug}" data-cancel="${s.id}">Cancel subscription</button></div>`}
            </div>`).join("") : `<p class="muted">No subscriptions yet. Choose "Subscribe and save" on any coffee.</p>`}
        </section>
        <section class="panel"><h2 style="font-size:1.35rem;margin-bottom:12px">Orders</h2>
          ${mine.length ? `<ul class="list">${mine.map(o => `<li data-testid="order-${o.id}"><span><b>${o.id}</b><br><small class="muted">${o.date} · ${o.items} ${o.items === 1 ? "item" : "items"}</small></span><span>${money(o.total)}</span></li>`).join("")}</ul>` : `<p class="muted">No orders with this email yet.</p>`}
        </section>
      </div>`;
  },

  guides: () => `<h1 class="page-title">Brew guides</h1><p class="lead">Four ways to make a great cup at home, with exact recipes.</p>
    <div class="guides">${GUIDES.map(g => `<a class="guide-card" href="/guides/${g.slug}" id="guide-${g.slug}" data-link><div class="panel"><span class="badge">${g.time}</span><h3>${g.name}</h3><p class="muted">${g.intro}</p></div></a>`).join("")}</div>`,

  guide: slug => {
    const g = GUIDES.find(x => x.slug === slug);
    if (!g) return notFound();
    const match = { "pour-over": "bright-origin", "french-press": "classic-roast", "cold-brew": "sunrise-blend", "moka-pot": "night-owl" }[slug];
    return `<p class="crumbs"><a href="/guides" id="back-guides" data-link>Brew guides</a> / ${g.name}</p>
      <h1 class="page-title">${g.name}</h1><p class="lead">${g.intro}</p>
      <div class="recipe"><div><small class="muted">Time</small><b>${g.time}</b></div><div><small class="muted">Ratio</small><b>${g.ratio}</b></div><div><small class="muted">Grind</small><b>${g.grind}</b></div></div>
      <ol class="method">${g.steps.map(s => `<li>${s}</li>`).join("")}</ol>
      <div class="notice" style="max-width:62ch">Best with <a href="/coffees/${match}" id="guide-coffee" data-link>${coffee(match).name}</a>.</div>`;
  },

  contact: () => `<div class="auth" style="max-width:620px"><h1 class="page-title">Contact us</h1><p class="lead">Questions about an order or a subscription? We reply within one working day.</p>
    <form class="panel" id="contact-form" novalidate>
      <div class="row2">${field("contact-name", "Your name", { ac: "name" })}${field("contact-email", "Email", { type: "email", ac: "email" })}</div>
      <div class="field" id="contact-topic-field"><label class="lbl" for="contact-topic">Topic</label>
        <select class="txt" id="contact-topic" aria-describedby="contact-topic-error"><option value="">Choose a topic</option><option>An order</option><option>My subscription</option><option>Wholesale</option><option>Something else</option></select>
        <div class="err" id="contact-topic-error"></div></div>
      <div class="field" id="contact-message-field"><label class="lbl" for="contact-message">Message</label>
        <textarea class="txt" id="contact-message" rows="5" aria-describedby="contact-message-error"></textarea><div class="err" id="contact-message-error"></div></div>
      <button class="btn" id="send-message">Send message</button></form></div>`,

  faq: () => `<div style="max-width:720px"><h1 class="page-title">Questions</h1><p class="lead">Quick answers about orders, deliveries and subscriptions.</p>
    ${FAQ.map(([q, a], i) => `<details id="faq-${["shipping", "pausing", "grinding", "promos"][i]}"><summary>${q}</summary><p>${a}</p></details>`).join("")}
    <p style="margin-top:22px">Still stuck? <a href="/contact" id="faq-contact" data-link>Contact us</a>.</p></div>`
};

function notFound() {
  return `<div class="empty"><h2>Page not found</h2><p>That page doesn't exist. Head back to the shop to keep browsing.</p><br><a href="/shop" class="btn" data-link>Shop coffee</a></div>`;
}
function card(c) {
  return `<article class="product" data-testid="coffee-${c.slug}">
    <a class="cover" href="/coffees/${c.slug}" tabindex="-1" aria-hidden="true" data-link>${bag(c)}</a>
    <h3><a href="/coffees/${c.slug}" id="coffee-${c.slug}" data-link>${c.name}</a></h3>
    <p class="muted">${c.notes.join(", ")}</p>
    <div class="meta"><b>${money(c.price)}</b>${roastBars(c.level)}</div></article>`;
}

/* coffee detail (re-renders itself when options change) */
function renderDetail() {
  const c = coffee(pick.slug), p = pick;
  const price = c.price * SIZES[p.size].factor * (p.plan === "subscribe" ? 0.9 : 1);
  $("coffee-detail").innerHTML = `${bag(c)}
    <div><h1>${c.name}</h1>
      <p class="muted" style="margin-top:8px">${c.origin} · ${c.roast} roast</p>
      <div class="notes">${c.notes.map(n => `<span>${n}</span>`).join("")}</div>
      <p>${c.about}</p>
      <div class="opt"><div class="legend" id="grind-label">Grind</div><div class="pills" role="group" aria-labelledby="grind-label">
        ${Object.entries(GRINDS).map(([k, v]) => `<button class="pill" id="grind-${k}" data-grind="${k}" aria-pressed="${p.grind === k}">${v}</button>`).join("")}</div></div>
      <div class="opt"><div class="legend" id="size-label">Bag size</div><div class="pills" role="group" aria-labelledby="size-label">
        ${Object.entries(SIZES).map(([k, v]) => `<button class="pill" id="size-${k}" data-size="${k}" aria-pressed="${p.size === k}">${v.label}</button>`).join("")}</div></div>
      <div class="opt"><div class="legend" id="plan-label">How often</div><div class="pills" role="group" aria-labelledby="plan-label">
        <button class="pill" id="plan-once" data-plan="once" aria-pressed="${p.plan === "once"}">One-time</button>
        <button class="pill" id="plan-subscribe" data-plan="subscribe" aria-pressed="${p.plan === "subscribe"}">Subscribe and save 10%</button></div>
        ${p.plan === "subscribe" ? `<label class="lbl" for="subscription-frequency" style="margin-top:14px">Deliver</label>
          <select class="txt" id="subscription-frequency" style="max-width:260px">${Object.entries(FREQ).map(([k, v]) => `<option value="${k}" ${p.freq === k ? "selected" : ""}>${v}</option>`).join("")}</select>` : ""}</div>
      <div class="qty" aria-label="Quantity"><button id="quantity-minus" aria-label="One fewer">−</button><input id="quantity-input" aria-label="Quantity" value="${p.qty}" readonly><button id="quantity-plus" aria-label="One more">+</button></div>
      <p class="price-line" id="detail-price" aria-live="polite">${money(price * p.qty)}${p.plan === "subscribe" ? ` <small class="muted">per delivery</small>` : ""}</p>
      <button class="btn" id="add-cart">Add to cart</button>
      <div id="added-notice"></div></div>`;
}

/* router */
const routes = [
  [/^\/$/, "home"], [/^\/shop$/, "shop"], [/^\/coffees\/([\w-]+)$/, "coffee"], [/^\/cart$/, "cart"], [/^\/checkout$/, "checkout"],
  [/^\/confirmed$/, "confirmed"], [/^\/login$/, "login"], [/^\/account$/, "account", true], [/^\/guides$/, "guides"],
  [/^\/guides\/([\w-]+)$/, "guide"], [/^\/contact$/, "contact"], [/^\/faq$/, "faq"]
];
const TITLES = { home: "Fresh coffee, on your schedule", shop: "Shop", coffee: "Coffee", cart: "Cart", checkout: "Checkout", confirmed: "Order confirmed", login: "Sign in", account: "Your account", guides: "Brew guides", guide: "Brew guide", contact: "Contact", faq: "FAQ" };

function render() {
  const path = location.pathname;
  let name = null, arg = null, auth = false;
  for (const [re, n, a] of routes) { const m = path.match(re); if (m) { name = n; arg = m[1]; auth = a; break; } }
  if (auth && !S.user) { history.replaceState(null, "", "/login?next=" + encodeURIComponent(path)); return render(); }
  $("app").innerHTML = name ? pages[name](arg) : notFound();
  const c = name === "coffee" && coffee(arg), g = name === "guide" && GUIDES.find(x => x.slug === arg);
  document.title = (c ? c.name : g ? g.name : TITLES[name] || "Page not found") + " | Orbit Coffee";
  document.querySelectorAll(".nav a").forEach(a => {
    const href = a.getAttribute("href");
    href !== "/" && (path === href || path.startsWith(href + "/") || (href === "/shop" && path.startsWith("/coffees"))) ? a.setAttribute("aria-current", "page") : a.removeAttribute("aria-current");
  });
  $("main-nav").classList.remove("open"); $("menu-toggle").setAttribute("aria-expanded", "false");
  if (name === "coffee" && c) renderDetail();
  updateCount();
}
function go(path) { history.pushState(null, "", path); render(); window.scrollTo(0, 0); $("app").focus({ preventScroll: true }); }
function setQuery(k, v) {
  const q = new URLSearchParams(location.search);
  v && v !== "All" && v !== "popular" ? q.set(k, v) : q.delete(k);
  history.replaceState(null, "", "/shop" + (q.toString() ? "?" + q : "")); render();
}

/* events */
document.addEventListener("click", e => {
  const a = e.target.closest("a[data-link]");
  if (a && !e.metaKey && !e.ctrlKey && !e.shiftKey && e.button === 0) { e.preventDefault(); return go(a.getAttribute("href")); }
  const t = e.target.closest("button"); if (!t) return;
  const d = t.dataset;
  if (t.id === "menu-toggle") { const open = $("main-nav").classList.toggle("open"); t.setAttribute("aria-expanded", open); }
  // shop
  if (d.roast) setQuery("roast", d.roast);
  if (t.id === "clear-filters") { history.replaceState(null, "", "/shop"); render(); }
  // detail
  if (d.grind) { pick.grind = d.grind; renderDetail(); }
  if (d.size) { pick.size = d.size; renderDetail(); }
  if (d.plan) { pick.plan = d.plan; renderDetail(); }
  if (t.id === "quantity-minus") { pick.qty = Math.max(1, pick.qty - 1); renderDetail(); }
  if (t.id === "quantity-plus") { pick.qty = Math.min(10, pick.qty + 1); renderDetail(); }
  if (t.id === "add-cart") {
    const same = S.cart.find(l => l.slug === pick.slug && l.grind === pick.grind && l.size === pick.size && l.plan === pick.plan && (l.plan === "once" || l.freq === pick.freq));
    same ? same.qty = Math.min(10, same.qty + pick.qty) : S.cart.push({ slug: pick.slug, grind: pick.grind, size: pick.size, plan: pick.plan, freq: pick.freq, qty: pick.qty });
    save();
    $("added-notice").innerHTML = `<div class="notice" role="status">Added to your cart. <a href="/cart" id="view-cart" data-link>View cart</a> or <a href="/shop" id="continue-shopping" data-link>keep shopping</a>.</div>`;
  }
  // cart
  if (d.minus) { const l = S.cart[+d.minus]; l.qty > 1 ? l.qty-- : S.cart.splice(+d.minus, 1); save(); render(); }
  if (d.plus) { const l = S.cart[+d.plus]; l.qty = Math.min(10, l.qty + 1); save(); render(); }
  if (d.remove) { const name = coffee(S.cart[+d.remove].slug).name; S.cart.splice(+d.remove, 1); if (!S.cart.length) S.promo = null; save(); render(); toast(name + " removed from your cart"); }
  if (t.id === "apply-promo") {
    const code = $("promo-code").value.trim().toUpperCase();
    if (PROMOS[code]) { S.promo = code; save(); render(); toast("Promo " + code + " applied"); }
    else { $("promo-code-error").textContent = code ? `${code} isn't a valid code. Try ORBIT10.` : "Enter a promo code."; $("promo-code-field").classList.add("invalid"); }
  }
  // checkout
  if (d.delivery) { checkout.delivery = d.delivery; render(); }
  if (t.id === "back-shipping") { checkout.step = 1; render(); }
  if (t.id === "continue-payment") { checkout.step = 3; render(); }
  if (t.id === "back-delivery") { checkout.step = 2; render(); }
  // account
  const sub = id => S.subscriptions.find(s => s.id === id);
  if (t.id === "logout-button") { S.user = null; save(); go("/"); toast("Signed out"); }
  if (d.skip) { const s = sub(d.skip); s.next = nextDate(s.freq, s.next); save(); render(); toast("Next delivery skipped"); }
  if (d.pause) { sub(d.pause).status = "Paused"; save(); render(); toast("Subscription paused"); }
  if (d.resume) { sub(d.resume).status = "Active"; save(); render(); toast("Subscription resumed"); }
  if (d.cancel) modal({ title: "Cancel this subscription?", body: "You won't get any more deliveries. You can start a new subscription any time.", confirm: "Cancel subscription", confirmId: "confirm-cancel", cancel: "Keep subscription", cancelId: "keep-subscription", danger: true, onConfirm: () => { sub(d.cancel).status = "Cancelled"; save(); render(); toast("Subscription cancelled"); } });
});
document.addEventListener("input", e => {
  if (e.target.id === "search-coffee") { clearTimeout(window._q); window._q = setTimeout(() => { setQuery("q", e.target.value.trim()); const i = $("search-coffee"); i.focus(); i.setSelectionRange(i.value.length, i.value.length); }, 300); }
});
document.addEventListener("change", e => {
  if (e.target.id === "sort-coffee") setQuery("sort", e.target.value);
  if (e.target.id === "subscription-frequency") { pick.freq = e.target.value; renderDetail(); }
});
document.addEventListener("submit", e => {
  e.preventDefault();
  const v = id => $(id).value.trim();
  if (e.target.id === "shipping-form" && validate([
    ["shipping-name", x => x.length >= 2, "Enter your full name."],
    ["shipping-email", isEmail, "Enter an email like name@example.com."],
    ["shipping-address", x => x.length >= 5, "Enter a street address."],
    ["shipping-city", x => x.length >= 2, "Enter your city."],
    ["shipping-postcode", x => /^[A-Za-z0-9 ]{4,8}$/.test(x), "Enter a postcode of 4 to 8 letters or numbers."]
  ])) { checkout.shipping = { name: v("shipping-name"), email: v("shipping-email"), address: v("shipping-address"), city: v("shipping-city"), postcode: v("shipping-postcode") }; checkout.step = 2; render(); }
  if (e.target.id === "payment-form" && validate([
    ["payment-card", x => /^\d{16}$/.test(x.replace(/\s/g, "")), "Card number must be 16 digits."],
    ["payment-expiry", x => /^(0[1-9]|1[0-2])\/\d{2}$/.test(x), "Use the format MM/YY, for example 08/28."],
    ["payment-security", x => /^\d{3,4}$/.test(x), "Security code is 3 or 4 digits."]
  ])) placeOrder();
  if (e.target.id === "login-form" && validate([
    ["login-email", isEmail, "Enter an email like name@example.com."],
    ["login-password", x => x.length >= 6, "Password must be at least 6 characters."]
  ])) { S.user = { email: v("login-email") }; save(); go(new URLSearchParams(location.search).get("next") || "/account"); toast("Signed in"); }
  if (e.target.id === "contact-form" && validate([
    ["contact-name", x => x.length >= 2, "Enter your name."],
    ["contact-email", isEmail, "Enter an email like name@example.com."],
    ["contact-topic", x => !!x, "Choose a topic."],
    ["contact-message", x => x.length >= 10, "Write at least 10 characters so we can help."]
  ])) { $("app").innerHTML = `<section class="done"><h1>Message sent.</h1><p>Thanks, ${esc(v("contact-name"))}. We'll reply to ${esc(v("contact-email"))} within one working day.</p><a href="/shop" class="btn" id="contact-done" data-link>Back to the shop</a></section>`; }
});
function nextDate(freq, from) {
  const d = from ? new Date(from) : new Date(); d.setDate(d.getDate() + { weekly: 7, fortnightly: 14, monthly: 30 }[freq]);
  return d.toISOString().slice(0, 10);
}
function placeOrder() {
  const sh = checkout.shipping, total = subtotal() - discount() + DELIVERY[checkout.delivery].price;
  const id = "ORB-" + Math.floor(100000 + Math.random() * 900000);
  const subs = S.cart.filter(l => l.plan === "subscribe");
  subs.forEach(l => S.subscriptions.unshift({ id: "SUB-" + Math.floor(1000 + Math.random() * 9000), email: sh.email, slug: l.slug, size: l.size, freq: l.freq, status: "Active", next: nextDate(l.freq) }));
  S.orders.unshift({ id, email: sh.email, name: sh.name, total, items: S.cart.reduce((s, l) => s + l.qty, 0), subs: subs.length, date: new Date().toISOString().slice(0, 10) });
  S.cart = []; S.promo = null; checkout = { step: 1, shipping: {}, delivery: "standard" };
  save(); go("/confirmed");
}
window.addEventListener("popstate", render);
render();
