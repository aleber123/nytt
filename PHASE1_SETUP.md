# 📊 Fas 1: Analytics & SEO - Setup Guide

## ✅ Vad Som Implementerats

### 1. Google Analytics 4 (GA4)
- ✅ Analytics utilities (`lib/analytics.ts`)
- ✅ GA4 script i `_document.tsx`
- ✅ Page view tracking i `_app.tsx`
- ✅ Checkout step tracking (redo att använda)

### 2. Microsoft Clarity
- ✅ Clarity script i `_document.tsx`
- ✅ Heatmaps & session recordings (aktiveras automatiskt)

### 3. SEO Metadata
- ✅ OrderSEO component (`src/components/SEO/OrderSEO.tsx`)
- ✅ Open Graph tags
- ✅ Twitter Card tags
- ✅ Structured Data (Schema.org)

### 4. Progress Indicator
- ✅ ProgressIndicator component (`src/components/order/ProgressIndicator.tsx`)
- ✅ Visual progress bar med dots

---

## 🔧 Setup Instructions

### Steg 1: Skapa Google Analytics 4 Account

1. Gå till [Google Analytics](https://analytics.google.com/)
2. Klicka "Admin" → "Create Property"
3. Välj "GA4" (inte Universal Analytics)
4. Kopiera ditt **Measurement ID** (format: G-XXXXXXXXXX)

### Steg 2: Skapa Microsoft Clarity Account

1. Gå till [Microsoft Clarity](https://clarity.microsoft.com/)
2. Klicka "Add new project"
3. Ange din webbplats URL
4. Kopiera ditt **Project ID**

### Steg 3: Konfigurera Environment Variables

Skapa eller uppdatera `.env.local`:

```bash
# Google Analytics 4
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX

# Microsoft Clarity
NEXT_PUBLIC_CLARITY_ID=your-clarity-id

# Existing variables...
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=...
```

### Steg 4: Använd i bestall.tsx

```typescript
import { OrderSEO } from '@/components/SEO/OrderSEO';
import { ProgressIndicator } from '@/components/order/ProgressIndicator';
import * as gtag from '../../lib/analytics';

export default function TestOrderPage() {
  const [currentQuestion, setCurrentQuestion] = useState(1);

  // Track när användare går till nästa steg
  const navigateToStep = (step: number) => {
    gtag.trackCheckoutStep(step, answers);
    setCurrentQuestion(step);
  };

  return (
    <>
      {/* SEO Metadata */}
      <OrderSEO step={currentQuestion} totalSteps={10} />
      
      <main>
        {/* Progress Indicator */}
        <ProgressIndicator 
          currentStep={currentQuestion} 
          totalSteps={10} 
        />
        
        {/* Rest of your checkout flow */}
      </main>
    </>
  );
}
```

---

## 📊 Vad Du Kan Tracka

### Automatisk Tracking (Redan Implementerat)
- ✅ Page views
- ✅ Session recordings (Clarity)
- ✅ Heatmaps (Clarity)

### Manual Tracking (Använd dessa funktioner)

```typescript
// Track checkout progress
gtag.trackCheckoutStep(currentQuestion, answers);

// Track when checkout begins
gtag.trackBeginCheckout(answers);

// Track successful purchase
gtag.trackPurchase(orderId, answers);

// Track abandoned checkout
gtag.trackAbandonCheckout(currentQuestion, answers);

// Track form errors
gtag.trackFormError(currentQuestion, 'email', 'Invalid email');

// Track time on step
gtag.trackTimeOnStep(currentQuestion, 45); // 45 seconds
```

---

## 🎯 Nästa Steg

### Efter Setup:

1. **Testa att det fungerar:**
   ```bash
   npm run dev
   ```
   - Öppna http://localhost:3000/bestall
   - Öppna Chrome DevTools → Network
   - Leta efter requests till `google-analytics.com` och `clarity.ms`

2. **Verifiera i GA4:**
   - Gå till GA4 → Reports → Realtime
   - Du ska se din egen session live!

3. **Verifiera i Clarity:**
   - Gå till Clarity Dashboard
   - Vänta 2-3 minuter
   - Du ska se session recordings dyka upp

---

## 📈 Vad Du Får

### Google Analytics 4:
- 📊 Antal besökare per steg
- 📉 Conversion funnel (se var användare hoppar av)
- ⏱️ Tid per steg
- 🌍 Geografisk data
- 📱 Desktop vs Mobile
- 💰 Genomsnittligt ordervärde

### Microsoft Clarity:
- 📹 Session recordings - se exakt vad användare gör
- 🔥 Heatmaps - se var användare klickar
- 📊 Scroll maps - se hur långt användare scrollar
- 🐛 Rage clicks - hitta frustrerade användare
- 💯 100% GRATIS!

---

## 💰 Kostnad

- **Google Analytics 4:** GRATIS
- **Microsoft Clarity:** GRATIS
- **Total:** 0 SEK/månad

---

## 🎉 Klart!

Fas 1 är nu implementerad! När du har lagt till dina API-nycklar i `.env.local` kommer allt att fungera automatiskt.

**Nästa fas:** Performance & Trust Signals (Vecka 3-4)
