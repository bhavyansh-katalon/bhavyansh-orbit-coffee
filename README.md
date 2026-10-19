# Orbit Coffee

Demo coffee shop for TrueTest training. One HTML page with client-side routes.

- `index.html`: page shell and styles. The TrueTest snippet goes here, once.
- `app.js`: all pages and logic (shop, coffee pages, cart, 3-step checkout, sign in, account with subscriptions, brew guides, contact, FAQ).
- `vercel.json`: sends every URL to index.html so deep links like /coffees/night-owl work.

Data (cart, orders, subscriptions) is stored in the browser, so each visitor starts fresh.
Demo login: any email and a password of 6+ characters. Promo code: ORBIT10.
