import React, { useState } from 'react';
import { GetStaticProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import Head from 'next/head';
import AddressAutocomplete from '@/components/ui/AddressAutocomplete';

interface TestAddressInputPageProps {}

export default function TestAddressInputPage({}: TestAddressInputPageProps) {
  const [address, setAddress] = useState('');
  const [submittedAddress, setSubmittedAddress] = useState('');
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const handleAddressChange = (value: string) => {
    addLog(`Address changed to: "${value}"`);
    setAddress(value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addLog(`Form submitted with address: "${address}"`);

    if (!address || address === 'undefined') {
      addLog('❌ ERROR: Address is undefined or empty!');
      alert('Address is undefined! This is the bug.');
      return;
    }

    setSubmittedAddress(address);
    addLog('✅ Address submitted successfully');
    alert(`Address submitted: ${address}`);
  };

  const fillTestAddress = () => {
    const testAddress = 'Sveavägen 159';
    addLog(`Filling test address: "${testAddress}"`);
    setAddress(testAddress);
  };

  return (
    <>
      <Head>
        <title>Test Address Input - Debug</title>
      </Head>

      <main className="bg-gray-50 py-10 min-h-screen">
        <div className="container mx-auto px-4 max-w-2xl">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">
              🐛 Address Input Debug Test
            </h1>

            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h2 className="text-lg font-semibold text-blue-900 mb-2">Test Instructions:</h2>
              <ol className="text-sm text-blue-800 space-y-1">
                <li>1. Type an address in the field below</li>
                <li>2. Press Enter or click Submit</li>
                <li>3. Check if the address is saved correctly (not "undefined")</li>
                <li>4. Use the "Fill Test Address" button to test with "Sveavägen 159"</li>
              </ol>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address *
                </label>
                <AddressAutocomplete
                  value={address}
                  onChange={handleAddressChange}
                  placeholder="Type an address and press Enter..."
                  required
                />
              </div>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={fillTestAddress}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Fill Test Address
                </button>

                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  Submit Address
                </button>
              </div>
            </form>

            {submittedAddress && (
              <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <h3 className="text-lg font-semibold text-green-900 mb-2">✅ Submitted Address:</h3>
                <p className="text-green-800 font-mono">"{submittedAddress}"</p>
              </div>
            )}

            <div className="mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">📋 Debug Logs:</h3>
              <div className="bg-gray-100 border rounded-lg p-4 max-h-60 overflow-y-auto">
                {logs.length === 0 ? (
                  <p className="text-gray-500 italic">No logs yet...</p>
                ) : (
                  <div className="space-y-1">
                    {logs.map((log, index) => (
                      <div key={index} className="text-sm font-mono text-gray-700">
                        {log}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button
                onClick={() => setLogs([])}
                className="mt-2 px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                Clear Logs
              </button>
            </div>

            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h3 className="text-lg font-semibold text-yellow-900 mb-2">🔍 Current State:</h3>
              <div className="text-sm text-yellow-800">
                <div>Address value: <code>"{address}"</code></div>
                <div>Address type: <code>{typeof address}</code></div>
                <div>Address length: <code>{address.length}</code></div>
                <div>Is undefined: <code>{address === undefined}</code></div>
                <div>Is empty: <code>{address === ''}</code></div>
              </div>
            </div>
          </div>
        </div>
      </main>
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