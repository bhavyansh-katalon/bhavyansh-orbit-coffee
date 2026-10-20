# Orbit Coffee v2: DOM changes for the regeneration experiment

Only `app.js` changes. Keep your existing `index.html` (it holds your TrueTest snippet).

| # | Element (v1) | Change in v2 | What it tests |
|---|---|---|---|
| 1 | `#hero-shop`, `#coffee-classic-roast`, shipping fields, `#continue-payment` | None | Control: should be reused unchanged |
| 2 | `#continue-delivery` | Extra class: `btn` becomes `btn btn-primary` | Class-only change, same id |
| 3 | `#view-cart` | Wrapped in a new `<span class="notice-actions">` | Structure change, same id and text |
| 4 | `#place-order` | Text "Place order" becomes "Confirm and pay" | Text-only change, same id |
| 5 | `#add-cart` "Add to cart" | Now `#add-bag` "Add to bag" | id and text both changed |
| 6 | `#go-checkout` | id removed, class `checkout-link` added | id removed |

Version check: the footer says "Orbit Coffee v2", and `document.body.dataset.version` is "2".
