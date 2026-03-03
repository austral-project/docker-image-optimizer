# Dockerfile.nginx
FROM australproject/alpine:3.23
LABEL maintainer="Matthieu Beurel <matthieu@austral.dev>"

RUN apk add --no-cache \
    nodejs=20.15.1-r0 --repository=https://dl-cdn.alpinelinux.org/alpine/v3.20/main \
    npm=10.9.1-r0 --repository=https://dl-cdn.alpinelinux.org/alpine/v3.21/community

RUN export NODE_OPTIONS=--openssl-legacy-provider
WORKDIR /home/www-data

COPY package.json package-lock.json* ./
RUN npm install --production

COPY server.js ./

USER www-data

EXPOSE 3000
CMD ["node", "server.js"]