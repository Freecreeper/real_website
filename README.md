The Button — static single-page interactive site

What this contains
- `index.html` — single-page app
- `style.css` — styles (glassmorphism, neon)
- `script.js` — all logic: counter, localStorage, lore, achievements, secret events

Goals
- No external dependencies. Small footprint for serving from a tiny EC2 instance (t3.micro).

Run on an EC2 t3.micro
1. Upload the project folder to your EC2 instance (SCP, git clone, etc.).
2. Install a simple static server. Easiest: use Python 3 built-in HTTP server.

On Windows PowerShell or Linux shell on the instance (run in the folder containing `index.html`):

```powershell
# Python 3
python -m http.server 8080

# Then point your browser to http://<EC2_PUBLIC_IP>:8080
```

If you'd rather use nginx (recommended for production):
- Install nginx (sudo apt update; sudo apt install nginx)
- Copy site files to `/var/www/the-button` and configure a server block pointing to that folder.

Notes for running on t3.micro
- The site is entirely client-side; CPU and memory usage on the server are minimal.
- Use a small web server (Python, nginx, caddy). No Node.js necessary.
- Consider enabling HTTPS via Let's Encrypt if exposing publicly.

Files added
- `index.html` — main page
- `style.css` — styles
- `script.js` — interactivity
- `README.md` — this file

Next steps / suggestions
- Add audio effects (optional) — keep them small and opt-in.
- Add a simple express or nginx config if you want fancy headers, compression, or caching.

QA notes / is it shippable?

- Spam detection: The site detects 10 clicks within a 6-second window and triggers a secret reward. A short cooldown (8s) prevents back-to-back secret rewards. Click timestamp tracking is capped and pruned to avoid memory growth. This makes the spam events reliable but non-abusive.

- Accessibility: Basic keyboard support for the main button (Space/Enter) and `aria-live` for messages were added. More accessibility work is recommended before a company release (focus styles, screen-reader text for dynamic overlays, contrast auditing).

- Security & performance: The app is fully client-side with no external dependencies. Serve via nginx for production, enable gzip/Brotli, and add HTTPS with Let's Encrypt.

- Shipping checklist (minimal):
	1. Run automated smoke test: start a static server and verify the page loads and the counter increments.
	2. Accessibility audit (axe or manual) and keyboard testing.
	3. Add CSP and security headers via nginx.
	4. Optional: add small analytics and rate-limiting at the server edge if you expect lots of traffic.

If you want, I can add a simple smoke-test script that launches the Python server and uses a headless browser to press the button programmatically and assert the counter increments — tell me and I'll add it.
