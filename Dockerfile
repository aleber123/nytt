FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set environment variables for build time
ARG NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyCQ8S9KK95AvodDYFAc_0VUxi0lN0o6MS0
ARG NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=legapp-2720a.firebaseapp.com
ARG NEXT_PUBLIC_FIREBASE_PROJECT_ID=legapp-2720a
ARG NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=legapp-2720a.firebasestorage.app
ARG NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=1003184294483
ARG NEXT_PUBLIC_FIREBASE_APP_ID=1:1003184294483:web:55e86d1f5833ee0cad14a6
ARG NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-V694ZBTV7F
ARG NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyA0uJLoyjTcAJGvuVvyiBP_u12RPQLv_aE

ENV NEXT_PUBLIC_FIREBASE_API_KEY=$NEXT_PUBLIC_FIREBASE_API_KEY
ENV NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=$NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
ENV NEXT_PUBLIC_FIREBASE_PROJECT_ID=$NEXT_PUBLIC_FIREBASE_PROJECT_ID
ENV NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=$NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
ENV NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=$NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
ENV NEXT_PUBLIC_FIREBASE_APP_ID=$NEXT_PUBLIC_FIREBASE_APP_ID
ENV NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=$NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
ENV NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=$NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyCQ8S9KK95AvodDYFAc_0VUxi0lN0o6MS0
ENV NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=legapp-2720a.firebaseapp.com
ENV NEXT_PUBLIC_FIREBASE_PROJECT_ID=legapp-2720a
ENV NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=legapp-2720a.firebasestorage.app
ENV NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=1003184294483
ENV NEXT_PUBLIC_FIREBASE_APP_ID=1:1003184294483:web:55e86d1f5833ee0cad14a6
ENV NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-V694ZBTV7F
ENV NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyA0uJLoyjTcAJGvuVvyiBP_u12RPQLv_aE

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000

# set hostname to localhost
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]