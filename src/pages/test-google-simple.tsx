import { useEffect, useState } from 'react';
import { Loader } from '@googlemaps/js-api-loader';

declare global {
  interface Window {
    google: any;
  }
}

function TestGoogleSimplePage() {
  const [status, setStatus] = useState('Laddar...');
  const [apiKey, setApiKey] = useState('');

  useEffect(() => {
    const testApi = async () => {
      try {
        const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
        setApiKey(key || 'INGEN API-NYCKEL FUNNEN');

        if (!key) {
          setStatus('❌ Ingen API-nyckel hittades i miljövariablerna');
          return;
        }

        console.log('🔄 Testar Google Maps API med nyckel:', key.substring(0, 10) + '...');

        setStatus('🔄 Laddar Google Maps API...');

        const loader = new Loader({
          apiKey: key,
          version: 'weekly',
          libraries: ['places']
        });

        await loader.load();

        if (window.google && window.google.maps) {
          console.log('✅ Google Maps API laddad framgångsrikt');
          setStatus('✅ Google Maps API fungerar!');

          if (window.google.maps.places) {
            console.log('✅ Places API är tillgänglig');
            setStatus('✅ Både Maps och Places API fungerar!');
          } else {
            console.log('⚠️ Places API saknas');
            setStatus('⚠️ Maps API fungerar, men Places API saknas');
          }
        } else {
          console.log('❌ Google Maps objektet är inte tillgängligt');
          setStatus('❌ Google Maps kunde inte laddas');
        }

      } catch (error) {
        console.error('❌ Fel vid laddning av Google Maps:', error);
        setStatus(`❌ Fel: ${error instanceof Error ? error.message : String(error)}`);
      }
    };

    testApi();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          🔬 Enkel Google Maps Test
        </h1>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              API-Nyckel Status:
            </h2>
            <div className="bg-gray-50 rounded-lg p-3 font-mono text-sm">
              {apiKey}
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              Laddningsstatus:
            </h2>
            <div className="bg-gray-50 rounded-lg p-3 text-lg">
              {status}
            </div>
          </div>

          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-blue-900 mb-2">
              📋 Vad detta test gör:
            </h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Kontrollerar att API-nyckeln finns</li>
              <li>• Försöker ladda Google Maps JavaScript API</li>
              <li>• Kontrollerar att Places biblioteket är tillgängligt</li>
              <li>• Visar detaljerade felmeddelanden</li>
            </ul>
          </div>

          <div className="bg-yellow-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-yellow-900 mb-2">
              🔍 Nästa steg om detta misslyckas:
            </h3>
            <ul className="text-sm text-yellow-800 space-y-1">
              <li>• Kontrollera att Places API är aktiverat i Google Cloud Console</li>
              <li>• Kontrollera att API-nyckeln är korrekt kopierad</li>
              <li>• Kontrollera webbläsarens nätverksflik för blockerade förfrågningar</li>
              <li>• Försök med en ny API-nyckel</li>
            </ul>
          </div>
        </div>

        <div className="mt-8 text-center">
          <a
            href="/test-google-maps"
            className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 mr-4"
          >
            Tillbaka till adress-test →
          </a>
          <a
            href="/test-order"
            className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
          >
            Till beställningsflödet →
          </a>
        </div>
      </div>
    </div>
  );
}

export default TestGoogleSimplePage;