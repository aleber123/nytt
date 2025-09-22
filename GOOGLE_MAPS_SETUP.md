# Google Maps API Setup för Adressautofyllning

## Översikt
Denna applikation använder Google Maps Places API för att ge användarna adressförslag när de anger sin adress för dokumenthämtning.

## Steg för att konfigurera Google Maps API

### 1. Skapa ett Google Cloud Project
1. Gå till [Google Cloud Console](https://console.cloud.google.com/)
2. Skapa ett nytt projekt eller välj ett befintligt

### 2. Aktivera Google Maps Places API
1. I Google Cloud Console, gå till "APIs & Services" > "Library"
2. Sök efter "Places API" och aktivera det
3. Du kan också behöva aktivera "Maps JavaScript API"

### 3. Skapa API-nyckel
1. Gå till "APIs & Services" > "Credentials"
2. Klicka på "Create Credentials" > "API Key"
3. Kopiera den genererade API-nyckeln

### 4. Konfigurera restriktioner (Rekommenderas)
1. I Credentials-sidan, klicka på din API-nyckel
2. Under "Application restrictions", välj "HTTP referrers"
3. Lägg till följande referrer:
   - `localhost:3000/*` (för utveckling)
   - `yourdomain.com/*` (för produktion)
4. Under "API restrictions", välj "Restrict key"
5. Välj "Places API" och "Maps JavaScript API"

### 5. Uppdatera miljövariabel
1. Öppna `.env.local` filen i projektets rot
2. Ersätt `YOUR_GOOGLE_MAPS_API_KEY_HERE` med din riktiga API-nyckel:
   ```
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=din_riktiga_api_nyckel_här
   ```

### 6. Starta om applikationen
```bash
npm run dev
```

## Funktioner
- **Adressautofyllning**: Användare får adressförslag när de skriver i adressfältet
- **Sverige-begränsning**: Endast svenska adresser visas
- **Fallback**: Om API-nyckeln saknas fungerar fältet fortfarande som ett vanligt textfält

## Kostnadsinformation
Google Maps API har en gratis kvot:
- 28,500 förfrågningar per månad gratis
- Därefter $0.017 per förfrågan

## Felsökning
- Kontrollera att API-nyckeln är korrekt i `.env.local`
- Kontrollera att Places API är aktiverat i Google Cloud Console
- Kontrollera att HTTP referrer restrictions är korrekt konfigurerade
- Kontrollera webbläsarens konsol för felmeddelanden

## Säkerhet
- API-nyckeln är exponerad i klienten (NEXT_PUBLIC_ prefix)
- Använd alltid HTTP referrer restrictions för att begränsa användningen
- Övervaka användning i Google Cloud Console