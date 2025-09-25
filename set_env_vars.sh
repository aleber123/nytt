#!/bin/bash
# Set Firebase environment variables for Vercel

# Firebase Config
vercel env add NEXT_PUBLIC_FIREBASE_API_KEY production << 'API_KEY_EOF'
AIzaSyAaQfVaMxCMjDbDa4l-S6IjSy4uTcQbHyo
API_KEY_EOF

vercel env add NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN production << 'AUTH_EOF'
legapp-2720a.firebaseapp.com
AUTH_EOF

vercel env add NEXT_PUBLIC_FIREBASE_PROJECT_ID production << 'PROJECT_EOF'
legapp-2720a
PROJECT_EOF

vercel env add NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET production << 'STORAGE_EOF'
legapp-2720a.firebasestorage.app
STORAGE_EOF

vercel env add NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID production << 'MESSAGING_EOF'
1003184294483
MESSAGING_EOF

vercel env add NEXT_PUBLIC_FIREBASE_APP_ID production << 'APP_ID_EOF'
1:1003184294483:web:55e86d1f5833ee0cad14a6
APP_ID_EOF

vercel env add NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID production << 'MEASUREMENT_EOF'
G-V694ZBTV7F
MEASUREMENT_EOF

# Google Maps API Key
vercel env add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY production << 'MAPS_EOF'
AIzaSyA0uJLoyjTcAJGvuVvyiBP_u12RPQLv_aE
MAPS_EOF

echo "Environment variables set successfully!"
