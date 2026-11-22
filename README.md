# 私立中山紀念堂 — Frontend

The static frontend application for **私立中山紀念堂 (Private Sun Yat-sen Memorial Hall)**, built with Vanilla HTML5, CSS3, and ES Modules with zero frontend framework dependencies. It works standalone as a static memorial site and connects to [Sun-Yatsen-memorial-backend](https://github.com/Aquarius-Situla/Sun-Yatsen-memorial-backend) for live danmaku, attendance counting, and administrative moderation.

---

## Key Features

- **Ritual & Contextual Audio** — Interactive three-bow ceremony before the presidential portrait, with automatic date- and event-aware background music playback ([js/modules/audio-player.js](js/modules/audio-player.js)).
- **Republican Calendar & Dual-Script i18n** — Displays the Minguo (Republic of China) calendar date and festival banners ([js/modules/calendar.js](js/modules/calendar.js)), with Traditional/Simplified Chinese localization ([js/modules/i18n.js](js/modules/i18n.js)).
- **Responsive Shell & PWA** — Device-aware mobile/desktop layout switching ([js/modules/device-detect.js](js/modules/device-detect.js)), Apple-style bottom tab bar ([js/modules/tab-bar.js](js/modules/tab-bar.js)), desktop parallax & gyroscope lighting ([js/modules/motion.js](js/modules/motion.js)), and full PWA manifest + iOS splash screens (`webapp/`).
- **Danmaku & Daily Attendance** — Real-time bullet commentary with client-side soft filtering ([js/modules/danmaku.js](js/modules/danmaku.js), [js/modules/message-sheet.js](js/modules/message-sheet.js)) and daily fingerprint-based attendance registration ([js/modules/attendance.js](js/modules/attendance.js)).
- **Isolated PlayCaptcha** — Interactive claw-machine human verification loaded inside an isolated `iframe` ([captcha/](captcha/), [js/modules/captcha.js](js/modules/captcha.js)).
- **Admin Dashboard** — Frosted-glass management console at `/#admin` or `/pages/admin/index.html` for danmaku moderation, prohibited word synchronization, whitelist scheduling, and AI moderation matrix configuration.

---

## Directory Structure

```text
frontend/
├── .github/workflows/
│   ├── deploy-pages.yml            # Optional Cloudflare Pages CI deployment
│   └── docker-image.yml            # Multi-arch GHCR Docker build & push workflow
├── index.html                      # Main application entry point (supports #admin and #captcha hashes)
├── _headers                        # Cloudflare Pages security & cache headers
├── _redirects                      # Cloudflare Pages URL redirects (/admin, /captcha)
├── Dockerfile                      # Nginx Alpine static container image
├── .dockerignore
├── docker/
│   ├── nginx.conf                  # Nginx static serving, gzip & /admin redirect config
│   └── 40-env-config.sh            # Startup script injecting WORKER_API into api/env.js
├── scripts/
│   └── build-pages.sh              # Assembles clean ./dist bundle & injects WORKER_API for CF Pages
├── api/
│   ├── env.example.js              # Runtime configuration template (window.ENV.WORKER_API)
│   └── prohibited_words/
│       └── public.json             # Public prohibited words archive/template (private.json is gitignored)
├── captcha/                        # Pre-built isolated PlayCaptcha iframe bundle
│   ├── index.html
│   ├── bundled.js
│   ├── clawcaptcha.css
│   └── react*.production.min.js
├── css/                            # Global variables, base styles, Markdown themes, and UI components
├── events/                         # Commemorative event pages & festival celebration scripts
│   ├── celebration/                # Lunar festival check & fireworks effects
│   ├── mayfourth/                  # May Fourth Movement memorial
│   ├── militaries/                 # Victory over Japan / Armed Forces memorial
│   ├── whampoa/                    # Whampoa Military Academy anniversary
│   ├── xinhai/                     # Xinhai Revolution memorial
│   └── yatsen/                     # Dr. Sun Yat-sen birth & passing memorials
├── js/
│   ├── app.js                      # Main hall entry orchestrator
│   ├── subpage.js                  # Shared subpage controller
│   └── modules/                    # Modular ES scripts (audio, calendar, captcha, danmaku, i18n, UI, etc.)
├── main/                           # Core stylesheets, portrait media, memorial music, and favicons
├── pages/
│   ├── about/                      # About, disclaimers, and changelogs (TC / SC Markdown)
│   ├── admin/                      # Admin Dashboard (index.html, admin.js)
│   ├── announcement/               # Site announcements and detail view
│   ├── biography/                  # Chronological biography of Dr. Sun Yat-sen
│   ├── library/                    # Historical library hub and language preference page
│   ├── settings/                   # User preferences page
│   └── thanks/                     # Acknowledgements page
├── tools/
│   └── captcha_builder/            # TypeScript/tsup source for building captcha/bundled.js
├── webapp/
│   ├── manifest.json               # Web App Manifest
│   ├── icon/                       # App icons (desktop/mobile/Apple)
│   └── splash/                     # iOS launch splash screens
└── LICENSE                         # GNU AGPL-3.0 License
```

---

## Configuration & Local Development

### 1. Configure Backend API Endpoint

Copy [api/env.example.js](api/env.example.js) to `api/env.js` (which is gitignored to avoid committing environment-specific URLs):

```bash
cp api/env.example.js api/env.js
```

Edit `api/env.js` and set `WORKER_API` to your deployed Cloudflare Worker URL (using Base64 `atob(...)` obfuscation as shown in the template, or a plain URL string):

```javascript
window.ENV = {
    WORKER_API: atob("aHR0cHM6Ly95b3VyLXdvcmtlci1hcGkud29ya2Vycy5kZXY=")
};
```

> [!NOTE]
> Without `api/env.js` (or with an empty `WORKER_API`), static memorial pages, audio playback, and historical archives still function normally, while dynamic backend features (danmaku, attendance counter, Admin Dashboard) remain disabled.

### 2. Run a Local Static Server

Because the frontend uses ES Modules (`<script type="module">`) and `fetch()`, opening `index.html` directly via `file://` will be blocked by browser CORS policies. Serve `frontend/` over HTTP instead:

```bash
# Using Python
python -m http.server 8080

# Or using Node.js
npx serve .
```

Then visit `http://localhost:8080`.

---

## Deployment

### Cloudflare Pages (Recommended)

#### Option 1: Cloudflare Pages Git Integration
1. Log in to the [Cloudflare Dashboard](https://dash.cloudflare.com/) and navigate to **Compute (Workers) > Workers & Pages**.
2. Click **Create application > Pages > Connect to Git** and select `Sun-Yatsen-memorial-frontend`.
3. Configure the build settings:
   - **Framework preset**: `None`
   - **Build command**: `sh scripts/build-pages.sh`
   - **Build output directory**: `dist`
4. Add an environment variable `WORKER_API` (e.g., `https://your-worker-api.workers.dev`) under **Settings > Environment variables**.

[scripts/build-pages.sh](scripts/build-pages.sh) outputs a clean static bundle to `dist/` (excluding `Dockerfile`, `docker/`, `tools/`, and `README.md`), injects `dist/api/env.js` from `WORKER_API`, and includes [_redirects](_redirects) (`/admin -> /pages/admin/`) and [_headers](_headers) (`no-store` on `/api/env.js`, security headers).

#### Option 2: GitHub Actions Deploy
[.github/workflows/deploy-pages.yml](.github/workflows/deploy-pages.yml) can also deploy `dist/` automatically when `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, `CF_PAGES_PROJECT`, and `WORKER_API` are configured in GitHub Secrets/Variables (if unset, the deploy step skips cleanly).

### Docker & GitHub Container Registry (`ghcr.io`)

A multi-architecture (`linux/amd64`, `linux/arm64`) image is automatically built and pushed by [.github/workflows/docker-image.yml](.github/workflows/docker-image.yml) on pushes to `main` and `v*` tags:

```bash
docker run -d \
  --name sys-memorial-frontend \
  -p 8085:80 \
  -e WORKER_API="https://your-worker-api.workers.dev" \
  ghcr.io/aquarius-situla/sun-yatsen-memorial-frontend:latest
```

At container startup, [docker/40-env-config.sh](docker/40-env-config.sh) writes `WORKER_API` into `/usr/share/nginx/html/api/env.js` automatically (or creates an empty fallback `env.js` if omitted and unmounted).

### Vercel / GitHub Pages / Nginx

- **Static hosts (Vercel / GitHub Pages)**: Deploy the repository root directly with no build step.
- **Local Nginx mount**: Mount this directory to `/usr/share/nginx/html:ro` (see `docker-compose.yml` in the [parent repository](https://github.com/Aquarius-Situla/Sun-Yatsen-memorial)).

---

## Admin Dashboard

Access the Admin Dashboard via `/#admin` or `/pages/admin/index.html`.

- **Authentication**: Uses a client-side SHA-256 hash of `ADMIN_SECRET` verified against the backend, guarded by PlayCaptcha.
- **Capabilities**:
  - View and delete live danmaku messages, and trigger AI supervised learning on missed violations.
  - Upload and synchronize `public.json` and `private.json` prohibited word lists to Cloudflare KV.
  - Toggle manual Whitelist Mode or schedule GMT+8 Auto-Whitelist dates (`MM-DD`).
  - Configure and inspect the multi-model AI moderation matrix and recent AI logs.

---

## PlayCaptcha Integration & Rebuilding

### Isolated `iframe` Integration

To avoid React UMD conflicts and styling leaks, **never** inject React/ReactDOM scripts directly into host pages. Always embed the pre-built [captcha/index.html](captcha/index.html) inside an `iframe`:

1. Place the modal markup in your HTML page (adjust `src` depth relative to the page, e.g., `captcha/index.html` on root or `../../captcha/index.html` inside `pages/*/`):

```html
<div id="captcha-modal-overlay" class="modal-overlay">
    <div class="captcha-modal-content" style="background: transparent; width: 440px; height: 620px; display: flex; justify-content: center; align-items: center;">
        <iframe id="captcha-iframe" src="captcha/index.html" style="border: none; width: 100%; height: 100%; border-radius: 14px; background: transparent;" allowtransparency="true"></iframe>
    </div>
</div>
```

2. Trigger verification using `showCaptchaModal(onVerified)` from [js/modules/captcha.js](js/modules/captcha.js), which resets the iframe challenge and executes your callback upon receiving `{ type: 'CAPTCHA_SUCCESS' }` via `window.postMessage`.

### Rebuilding the Captcha Bundle

Source code for the claw-machine captcha lives in [tools/captcha_builder/](tools/captcha_builder/) (built with `tsup` and TypeScript):

```bash
cd tools/captcha_builder
npm install
npm run build
```

---

## Prohibited Words Archive Notice

> [!WARNING]
> Editing `api/prohibited_words/public.json` or creating `api/prohibited_words/private.json` in this repository **does not** update the live filter automatically. Upload your updated JSON files through the **Admin Dashboard** to write them into the backend KV namespace.

---

## Open Source Acknowledgements

- **zero-md** — Subpage Markdown rendering engine. Copyright (c) 2018 Jason Lee (MIT).
- **github-markdown-css** — Markdown stylesheet. Copyright (c) Sindre Sorhus (MIT).
- **playcaptcha** — Interactive claw-machine captcha component. Copyright (c) 2026 iisac (MIT).

---

## Licensing

- **Source code**: Released under the [GNU Affero General Public License v3.0 (AGPL-3.0)](LICENSE).
- **Audiovisual assets**: Portraits, music recordings, and historical media remain the property of their respective rights holders and are excluded from AGPL-3.0. See [pages/about/about_tc.md](pages/about/about_tc.md) (Traditional Chinese) or [pages/about/about_sc.md](pages/about/about_sc.md) (Simplified Chinese).

Copyright (C) 2026 Situla.
