#!/bin/bash

# Deploy to Google Cloud Run with Firebase environment variables

gcloud run deploy legaliseringstjanst \
  --source . \
  --platform managed \
  --region europe-north1 \
  --allow-unauthenticated