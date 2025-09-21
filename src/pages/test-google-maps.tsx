import { GetStaticProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import Head from 'next/head';
import AddressAutocomplete from '@/components/ui/AddressAutocomplete';
import { useState } from 'react';

function TestGoogleMapsPage() {
  const [address, setAddress] = useState('');
  const [testAddress, setTestAddress] = useState('Sveavägen 159');

  const fillTestAddress = () => {
    setAddress('Sveavägen 159');
  };

  const clearAddress = () => {
    setAddress('');
  };

  return (
    <>
      <Head>
        <title>Test Google Maps - LegaliseringsTjänst</title>
      </Head>

      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto px-4">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            🗺️ Test Google Maps Adressautofyllning
          </h1>

          {/* Test Controls */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              🎯 Snabba tester
            </h2>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={fillTestAddress}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
              >
                Fyll i "Sveavägen 159"
              </button>
              <button
                onClick={clearAddress}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 text-sm"
              >
                Rensa fältet
              </button>
              <button
                onClick={() => setAddress('Sturegatan')}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
              >
                Fyll i "Sturegatan"
              </button>
              <button
                onClick={() => setAddress('Vasagatan 1')}
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 text-sm"
              >
                Fyll i "Vasagatan 1"
              </button>
            </div>
          </div>

          {/* Main Test */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Adressfält med Google Maps
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Skriv eller välj en adress i Sverige:
                </label>
                <AddressAutocomplete
                  value={address}
                  onChange={setAddress}
                  placeholder="Sök efter en adress..."
                />
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-900 mb-2">
                  📍 Vald adress:
                </h3>
                <p className="text-gray-700 font-medium">
                  {address || 'Ingen adress vald ännu'}
                </p>
                {address && (
                  <p className="text-xs text-gray-500 mt-1">
                    ✅ Adressen har sparats och kan användas i beställningen
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 rounded-lg p-4 mb-6">
            <h3 className="text-sm font-medium text-blue-900 mb-2">
              📋 Så här testar du:
            </h3>
            <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
              <li>Klicka på "Fyll i 'Sveavägen 159'" för att testa autocomplete</li>
              <li>Skriv manuellt för att se om förslag dyker upp</li>
              <li>Kolla statusindikatorn bredvid fältet</li>
              <li>Öppna webbläsarkonsolen (F12) för detaljerade meddelanden</li>
            </ol>
          </div>

          {/* Expected Results */}
          <div className="bg-green-50 rounded-lg p-4 mb-6">
            <h3 className="text-sm font-medium text-green-900 mb-2">
              ✅ Vad som bör hända:
            </h3>
            <ul className="text-sm text-green-800 space-y-1">
              <li>• Status visar <strong>"✅ Active"</strong> (autocomplete fungerar)</li>
              <li>• Adressförslag dyker upp när du skriver</li>
              <li>• Du kan välja ett förslag från listan</li>
              <li>• Den valda adressen fylls i automatiskt</li>
              <li>• Konsolen visar framgångsrika meddelanden</li>
            </ul>
          </div>

          {/* Troubleshooting */}
          <div className="bg-yellow-50 rounded-lg p-4 mb-6">
            <h3 className="text-sm font-medium text-yellow-900 mb-2">
              🔧 Om det inte fungerar:
            </h3>
            <ul className="text-sm text-yellow-800 space-y-1">
              <li>• Status visar <strong>"📝 Manual"</strong> = Google Maps laddades inte, men fältet fungerar</li>
              <li>• Status visar <strong>"❌ Failed"</strong> = Tekniskt fel, kontrollera konsolen</li>
              <li>• Inga förslag visas = API-nyckel eller nätverksproblem</li>
              <li>• Kontrollera att Places API är aktiverat i Google Cloud Console</li>
            </ul>
          </div>

          {/* Navigation */}
          <div className="text-center">
            <a
              href="/test-order"
              className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 mr-4"
            >
              Till beställningsflödet →
            </a>
            <a
              href="/test-google-simple"
              className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
            >
              Till enkla testet →
            </a>
          </div>
        </div>
      </div>
    </>
  );
}

export const getStaticProps: GetStaticProps = async ({ locale }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale || 'sv', ['common'])),
    },
  };
};

export default TestGoogleMapsPage;