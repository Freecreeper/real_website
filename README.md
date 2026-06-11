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
