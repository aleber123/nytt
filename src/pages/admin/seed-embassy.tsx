import React, { useState } from 'react';
import { GetStaticProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import Head from 'next/head';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { adminFetch } from '@/lib/adminFetch';

export default function SeedEmbassyPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSeed = async () => {
    if (!confirm('This will add all missing countries to embassy pricing. Continue?')) {
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await adminFetch('/api/admin/seed-embassy-prices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to seed');
      }

      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCheck = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await adminFetch('/api/admin/check-embassy-countries');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to check');
      }

      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <Head>
        <title>Seed Embassy Prices | Admin</title>
      </Head>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Seed Embassy Prices</h1>
        <p className="text-gray-600 mb-6">
          Add all missing countries to embassy pricing rules. Countries will be added with:
        </p>
        <ul className="list-disc list-inside text-gray-600 mb-6 space-y-1">
          <li>Official fee: <strong>0 kr</strong> (you need to update this)</li>
          <li>Service fee: <strong>1200 kr</strong> (standard)</li>
          <li>Price marked as <strong>unconfirmed</strong></li>
        </ul>

        <div className="flex gap-4 mb-8">
          <button
            onClick={handleCheck}
            disabled={loading}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50"
          >
            {loading ? 'Checking...' : 'Check Missing Countries'}
          </button>
          <button
            onClick={handleSeed}
            disabled={loading}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
          >
            {loading ? 'Adding...' : 'Add All Missing Countries'}
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {result && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Result</h2>
            
            {result.message && (
              <p className="text-green-600 font-medium mb-4">{result.message}</p>
            )}

            <div className="grid grid-cols-3 gap-4 mb-6">
              {result.totalInSystem !== undefined && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">{result.totalInSystem}</div>
                  <div className="text-sm text-gray-600">Total in system</div>
                </div>
              )}
              {result.totalInFirebase !== undefined && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">{result.totalInFirebase}</div>
                  <div className="text-sm text-gray-600">In Firebase</div>
                </div>
              )}
              {result.missingCount !== undefined && (
                <div className="bg-orange-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">{result.missingCount}</div>
                  <div className="text-sm text-gray-600">Missing</div>
                </div>
              )}
              {result.added !== undefined && (
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{result.added}</div>
                  <div className="text-sm text-gray-600">Added</div>
                </div>
              )}
              {result.existing !== undefined && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">{result.existing}</div>
                  <div className="text-sm text-gray-600">Already existed</div>
                </div>
              )}
              {result.total !== undefined && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{result.total}</div>
                  <div className="text-sm text-gray-600">Total now</div>
                </div>
              )}
            </div>

            {result.missingCountries && result.missingCountries.length > 0 && (
              <div>
                <h3 className="font-medium mb-2">Missing countries ({result.missingCountries.length}):</h3>
                <div className="max-h-60 overflow-y-auto bg-gray-50 p-3 rounded text-sm">
                  {result.missingCountries.map((c: any) => (
                    <span key={c.code} className="inline-block bg-white px-2 py-1 rounded mr-2 mb-2 border">
                      {c.name} ({c.code})
                    </span>
                  ))}
                </div>
              </div>
            )}

            {result.addedCountries && result.addedCountries.length > 0 && (
              <div>
                <h3 className="font-medium mb-2">Added countries ({result.addedCountries.length}):</h3>
                <div className="max-h-60 overflow-y-auto bg-green-50 p-3 rounded text-sm">
                  {result.addedCountries.map((name: string) => (
                    <span key={name} className="inline-block bg-white px-2 py-1 rounded mr-2 mb-2 border border-green-200">
                      {name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="mt-8">
          <a href="/admin/embassy-prices" className="text-primary-600 hover:underline">
            ← Back to Embassy Prices
          </a>
        </div>
      </div>
    </ProtectedRoute>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const i18nConfig = {
    i18n: { defaultLocale: 'sv', locales: ['sv', 'en'], localeDetection: false as const },
  };
  return {
    props: {
      ...(await serverSideTranslations('en', ['common'], i18nConfig)),
    },
  };
};
