FROM node:22-alpine

WORKDIR /app

RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

COPY tsconfig.json ./
COPY src ./src
COPY canon ./canon

# Deliberation artifacts land here; mount a volume to keep them.
RUN mkdir -p /app/data
VOLUME /app/data

EXPOSE 4173

# Default: serve the council chamber UI.
# Other entrypoints: ask "...", eval, run, serve
CMD ["pnpm", "ui"]
