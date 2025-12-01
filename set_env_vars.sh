#!/bin/bash
# Set Firebase environment variables for Vercel

# Firebase Config
vercel env add NEXT_PUBLIC_FIREBASE_API_KEY production << 'API_KEY_EOF'
YOUR_FIREBASE_API_KEY_HERE
API_KEY_EOF

vercel env add NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN production << 'AUTH_EOF'
your-firebase-auth-domain.firebaseapp.com
AUTH_EOF

vercel env add NEXT_PUBLIC_FIREBASE_PROJECT_ID production << 'PROJECT_EOF'
your-firebase-project-id
PROJECT_EOF

vercel env add NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET production << 'STORAGE_EOF'
your-firebase-storage-bucket.firebasestorage.app
STORAGE_EOF

vercel env add NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID production << 'MESSAGING_EOF'
000000000000
MESSAGING_EOF

vercel env add NEXT_PUBLIC_FIREBASE_APP_ID production << 'APP_ID_EOF'
your-firebase-app-id
APP_ID_EOF

vercel env add NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID production << 'MEASUREMENT_EOF'
YOUR_MEASUREMENT_ID_HERE
MEASUREMENT_EOF

# Google Maps API Key
vercel env add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY production << 'MAPS_EOF'
YOUR_GOOGLE_MAPS_API_KEY_HERE
MAPS_EOF

echo "Environment variables set successfully!"

