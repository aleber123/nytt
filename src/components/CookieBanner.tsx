import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslation } from 'next-i18next';

const CookieBanner: React.FC = () => {
  const { t } = useTranslation('common');
  const [showBanner, setShowBanner] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    // Check if user has already made a choice
    const consent = localStorage.getItem('cookie-consent');
    if (!consent) {
      setShowBanner(true);
    }
  }, []);

  const acceptAllCookies = () => {
    localStorage.setItem('cookie-consent', 'accepted');
    localStorage.setItem('cookie-consent-date', new Date().toISOString());
    setShowBanner(false);
    // Here you can enable analytics, etc.
  };

  const declineCookies = () => {
    localStorage.setItem('cookie-consent', 'declined');
    localStorage.setItem('cookie-consent-date', new Date().toISOString());
    setShowBanner(false);
    // Here you can disable non-essential cookies
  };

  const acceptEssentialOnly = () => {
    localStorage.setItem('cookie-consent', 'essential-only');
    localStorage.setItem('cookie-consent-date', new Date().toISOString());
    setShowBanner(false);
    // Only essential cookies allowed
  };

  if (!showBanner) return null;

  return (
    <div 
      className="fixed bottom-4 left-4 z-50 rounded-lg border border-gray-200 shadow-xl max-w-sm"
      style={{ backgroundColor: 'rgba(255, 255, 255, 0.65)', backdropFilter: 'blur(8px)' }}
    >
      <div className="p-4">
          {!showDetails ? (
            <div className="space-y-3">
              <div>
                <p className="text-gray-700 text-sm">
                  <span className="font-semibold">{t('cookie.title') || 'Vi använder cookies'}</span>
                  {' – '}
                  {t('cookie.shortText1') || 'Vi använder cookies för att förbättra din upplevelse.'}
                  <button
                    onClick={() => setShowDetails(true)}
                    className="text-primary-700 hover:text-primary-900 underline ml-1"
                  >
                    {t('cookie.readMore') || 'Läs mer'}
                  </button>
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <button
                  onClick={acceptAllCookies}
                  className="w-full px-4 py-2 text-sm font-medium text-white bg-primary-700 hover:bg-primary-900 rounded-md transition-colors"
                >
                  {t('cookie.acceptAll') || 'Acceptera alla'}
                </button>
                <button
                  onClick={acceptEssentialOnly}
                  className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                >
                  {t('cookie.essentialOnly') || 'Endast nödvändiga'}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {t('cookie.settingsTitle') || 'Cookie-inställningar'}
                </h3>
                <p className="text-gray-600 text-sm mb-4">
                  {t('cookie.settingsIntro') || 'Vi använder olika typer av cookies för att förbättra din upplevelse:'}
                </p>

                <div className="space-y-3 mb-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                    <div>
                      <h4 className="font-medium text-gray-900">{t('cookie.necessaryTitle') || 'Nödvändiga cookies'}</h4>
                      <p className="text-sm text-gray-600">{t('cookie.necessaryDesc') || 'Dessa cookies är nödvändiga för att webbplatsen ska fungera och kan inte inaktiveras. De används för grundläggande funktioner som säkerhet och tillgänglighet.'}</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                    <div>
                      <h4 className="font-medium text-gray-900">{t('cookie.analyticsTitle') || 'Analyscookies'}</h4>
                      <p className="text-sm text-gray-600">{t('cookie.analyticsDesc') || 'Hjälper oss att förstå hur besökare använder vår webbplats så att vi kan förbättra den. Informationen används endast för statistiska ändamål.'}</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                    <div>
                      <h4 className="font-medium text-gray-900">{t('cookie.functionalTitle') || 'Funktionella cookies'}</h4>
                      <p className="text-sm text-gray-600">{t('cookie.functionalDesc') || 'Gör det möjligt att komma ihåg dina val och förbättra din upplevelse, till exempel genom att spara dina språkinställningar.'}</p>
                    </div>
                  </div>
                </div>

                <p className="text-sm text-gray-600 mb-4">
                  {t('cookie.privacyPrefix') || 'Läs mer om hur vi hanterar dina uppgifter i vår'}{' '}
                  <Link href="/integritetspolicy" className="text-primary-700 hover:text-primary-900 underline">
                    {t('cookie.privacyPolicy') || 'integritetspolicy'}
                  </Link>.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 justify-end">
                <button
                  onClick={declineCookies}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                >
                  {t('cookie.declineAll') || 'Avvisa alla'}
                </button>
                <button
                  onClick={acceptEssentialOnly}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                >
                  {t('cookie.essentialOnly') || 'Endast nödvändiga'}
                </button>
                <button
                  onClick={acceptAllCookies}
                  className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-md transition-colors"
                >
                  {t('cookie.acceptAll') || 'Acceptera alla'}
                </button>
              </div>

              <button
                onClick={() => setShowDetails(false)}
                className="text-sm text-gray-500 hover:text-gray-700 underline"
              >
                {t('cookie.backToShort') || '← Tillbaka till kort vy'}
              </button>
            </div>
          )}
      </div>
    </div>
  );
};

export default CookieBanner;