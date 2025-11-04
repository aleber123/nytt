#!/bin/bash

# Deploy to Google Cloud Run with Firebase environment variables

gcloud run deploy legaliseringstjanst \
  --source . \
  --platform managed \
  --region europe-north1 \
  --allow-unauthenticated \
  --project doxvl-prod \
  --set-env-vars NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyBaXYbWRbryxW-YL4aWIFDzb5Po-r1sj3g,NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=doxvl-51a30.firebaseapp.com,NEXT_PUBLIC_FIREBASE_PROJECT_ID=doxvl-51a30,NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=doxvl-51a30.firebasestorage.app,NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=195927020517,NEXT_PUBLIC_FIREBASE_APP_ID=1:195927020517:web:5374b3346dbaec293ed50c,NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-3DBGQCJPTF,NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyA0uJLoyjTcAJGvuVvyiBP_u12RPQLv_aE