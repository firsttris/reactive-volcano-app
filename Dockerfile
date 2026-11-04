# The Bun of packageManager in package.json (Renovate's "Bun" group moves both)
FROM oven/bun:1.4.4-alpine AS build

WORKDIR /app

COPY package.json bun.lock ./

RUN bun install --frozen-lockfile

COPY . .

# .gz copies next to the files for gzip_static in nginx.conf
RUN bun run build:root && bun scripts/precompress.mjs dist

# Runs nginx as an unprivileged user instead of root; the stable branch (even
# minor), not mainline, since the users' containers update themselves
# (AutoUpdate). Pinned, so Renovate opens a pull request for each new release.
FROM nginxinc/nginx-unprivileged:1.30.6-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY nginx-security-headers.inc /etc/nginx/conf.d/security-headers.inc
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
