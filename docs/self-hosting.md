# Self-hosting

The app is a static single-page application: HTML, JavaScript, CSS and a service worker. There is no
backend and no database, so hosting it means serving files. The official Docker image does exactly that
with nginx.

## Contents

- [Requirements](#requirements)
- [Docker](#docker)
- [Docker Compose](#docker-compose)
- [Podman Quadlet](#podman-quadlet)
- [HTTPS with a reverse proxy](#https-with-a-reverse-proxy)
- [Serving under a sub-path](#serving-under-a-sub-path)
- [Any static web server](#any-static-web-server)
- [Updates](#updates)
- [Image details](#image-details)

## Requirements

- **A secure origin.** Browsers enable Web Bluetooth only on `https://` pages or on
  `http://localhost`. Accessing the container as `http://192.168.1.10:8080` from your phone will load the
  page but the connect button will say Web Bluetooth is unavailable. Put it behind HTTPS (below).
- **The browser device needs Bluetooth**, not the server. The server never talks to the vaporizer; the
  browser does. The container can run anywhere, for example on a NAS or a Raspberry Pi.

## Docker

```bash
docker run -d \
  --name vaporizer-app \
  -p 8080:8080 \
  --restart unless-stopped \
  tristanteu/reactive-volcano-app:latest
```

Then open `http://localhost:8080` on the same machine, or set up HTTPS for other devices.

## Docker Compose

```yaml
services:
  vaporizer-app:
    image: tristanteu/reactive-volcano-app:latest
    container_name: vaporizer-app
    ports:
      - "8080:8080"
    restart: unless-stopped
```

```bash
docker compose up -d
```

The [`docker-compose.yml`](../docker-compose.yml) in the repository also has `build: .`, so
`docker compose up -d --build` builds the image from your checkout.

## Podman Quadlet

The repository contains a ready Quadlet unit, [`volcano-app.container`](../volcano-app.container), with
`AutoUpdate=registry`:

```bash
# rootless, for your user
mkdir -p ~/.config/containers/systemd
curl -o ~/.config/containers/systemd/volcano-app.container \
  https://raw.githubusercontent.com/firsttris/reactive-volcano-app/main/volcano-app.container
systemctl --user daemon-reload
systemctl --user start volcano-app
```

For a system-wide (rootful) container, put the file into `/etc/containers/systemd/` and drop `--user`.
Enable `podman-auto-update.timer` to get new images automatically.

## HTTPS with a reverse proxy

Any reverse proxy that terminates TLS works. Examples for the container listening on port 8080:

<details open>
<summary><b>Caddy</b></summary>

```caddyfile
vaporizer.example.com {
    reverse_proxy localhost:8080
}
```

Caddy fetches a certificate on its own. For a name that only exists in your LAN, use
`tls internal` and trust Caddy's root certificate on your devices.

</details>

<details>
<summary><b>nginx</b></summary>

```nginx
server {
    listen 443 ssl;
    http2 on;
    server_name vaporizer.example.com;

    ssl_certificate     /etc/letsencrypt/live/vaporizer.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/vaporizer.example.com/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

</details>

<details>
<summary><b>Traefik (labels)</b></summary>

```yaml
services:
  vaporizer-app:
    image: tristanteu/reactive-volcano-app:latest
    restart: unless-stopped
    labels:
      - traefik.enable=true
      - traefik.http.routers.vaporizer.rule=Host(`vaporizer.example.com`)
      - traefik.http.routers.vaporizer.entrypoints=websecure
      - traefik.http.routers.vaporizer.tls.certresolver=letsencrypt
      - traefik.http.services.vaporizer.loadbalancer.server.port=80
```

</details>

## Serving under a sub-path

The Docker image is built for the **domain root** (`/`). To serve the app under a path such as
`https://example.com/vaporizer/`, build it with a matching base:

```bash
npm ci
npx vite build --base=/vaporizer/   # → dist/
```

`npm run build` does the same for the GitHub Pages path `/reactive-volcano-app/`. The router and the
service worker pick the base up from the build, so deep links and offline start keep working.

## Any static web server

Build once and copy `dist/` anywhere:

```bash
npm ci && npm run build:root   # → dist/
```

Two things the server must do:

1. **SPA fallback**: answer unknown paths (`/device/volcano/settings`) with `index.html`, otherwise a
   reload on a deep link gives a 404. On GitHub Pages the build workflow copies `index.html` to
   `404.html` for this.
2. **Caching**: files under `/assets/` have content hashes and can be cached forever; `index.html`,
   `sw.js` and the manifest must not be cached, or updates arrive late. The bundled
   [`nginx.conf`](../nginx.conf) is a working reference.

## Updates

| Setup | How to update |
|---|---|
| Docker | `docker pull tristanteu/reactive-volcano-app:latest && docker rm -f vaporizer-app` and run again |
| Compose | `docker compose pull && docker compose up -d` |
| Podman Quadlet | automatic with `podman-auto-update.timer`, or `podman auto-update` |
| Static | rebuild and replace `dist/` |

The app looks for a new version when it is opened and every hour; it switches right away, or asks first
while a device is connected.

> **Upgrading from an image that listened on port 80:** the container no longer runs as root and
> therefore listens on **8080** instead of 80. Change the port mapping from `8080:80` to `8080:8080`
> (`-p`, `ports:` or `PublishPort=`). With Quadlet's automatic updates, update the unit before the new
> image arrives, otherwise the app stops answering until you do.

## Image details

| | |
|---|---|
| Image | [`tristanteu/reactive-volcano-app`](https://hub.docker.com/r/tristanteu/reactive-volcano-app) |
| Tags | `latest`, `x.y.z`, `x.y` for releases; `edge` for manual builds from `main` |
| Platforms | `linux/amd64`, `linux/arm64` |
| Base | `nginxinc/nginx-unprivileged:stable-alpine` (nginx without root), built in a `node:22-alpine` stage ([`Dockerfile`](../Dockerfile)) |
| Port | `8080` inside the container |
| User | `nginx` (uid 101), not root |
| Volumes, environment | none needed |
| Outbound traffic | none |

How images are built and published: [Releases & deployment](releases.md).

---

Next: [Troubleshooting](troubleshooting.md) · [Privacy & security](privacy-security.md) · [Documentation index](README.md)
