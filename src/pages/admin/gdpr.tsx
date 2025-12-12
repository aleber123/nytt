/**
 * GDPR Admin Page
 * Manage data retention, anonymization, and customer data requests
 */

import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';

interface GdprStats {
  ordersToAnonymize: number;
  ordersWithFilesToDelete: number;
  totalOrders: number;
  oldestOrderDate: string | null;
}

interface OrderPreview {
  id: string;
  orderNumber: string;
  createdAt: string;
  customerName: string;
}

interface GdprPreview {
  toAnonymize: OrderPreview[];
  toDeleteFiles: OrderPreview[];
}

export default function GdprAdminPage() {
  const [stats, setStats] = useState<GdprStats | null>(null);
  const [preview, setPreview] = useState<GdprPreview | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Customer data request
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerData, setCustomerData] = useState<any>(null);
  const [customerLoading, setCustomerLoading] = useState(false);
  
  // Settings
  const [anonymizeYears, setAnonymizeYears] = useState(7);
  const [deleteFilesDays, setDeleteFilesDays] = useState(90);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsRes, previewRes] = await Promise.all([
        fetch('/api/admin/gdpr?action=stats'),
        fetch('/api/admin/gdpr?action=preview')
      ]);
      
      if (!statsRes.ok || !previewRes.ok) {
        throw new Error('Failed to load GDPR data');
      }
      
      setStats(await statsRes.json());
      setPreview(await previewRes.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const runCleanup = async (dryRun: boolean = false) => {
    if (!dryRun && !confirm('Är du säker på att du vill köra GDPR-rensning? Detta kan inte ångras.')) {
      return;
    }
    
    setProcessing(true);
    setResult(null);
    setError(null);
    
    try {
      const res = await fetch('/api/admin/gdpr?action=cleanup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          dryRun, 
          anonymizeYears, 
          deleteFilesDays 
        })
      });
      
      if (!res.ok) {
        throw new Error('Failed to run cleanup');
      }
      
      const data = await res.json();
      setResult(data);
      
      if (!dryRun) {
        // Reload stats after cleanup
        await loadStats();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setProcessing(false);
    }
  };

  const exportCustomerData = async () => {
    if (!customerEmail) {
      alert('Ange en e-postadress');
      return;
    }
    
    setCustomerLoading(true);
    setCustomerData(null);
    
    try {
      const res = await fetch(`/api/admin/gdpr?action=export-customer&email=${encodeURIComponent(customerEmail)}`);
      const data = await res.json();
      setCustomerData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setCustomerLoading(false);
    }
  };

  const deleteCustomerDataHandler = async () => {
    if (!customerEmail) {
      alert('Ange en e-postadress');
      return;
    }
    
    if (!confirm(`Är du säker på att du vill radera all data för ${customerEmail}? Detta kan inte ångras.`)) {
      return;
    }
    
    setCustomerLoading(true);
    
    try {
      const res = await fetch('/api/admin/gdpr?action=delete-customer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: customerEmail })
      });
      
      const data = await res.json();
      alert(`Raderade data för ${data.deletedOrders} ordrar`);
      setCustomerData(null);
      await loadStats();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setCustomerLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('sv-SE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <>
      <Head>
        <title>GDPR-hantering | Admin</title>
      </Head>
      
      <div className="min-h-screen bg-gray-100">
        {/* Header */}
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Link href="/admin" className="text-gray-500 hover:text-gray-700 mr-4">
                  ← Tillbaka
                </Link>
                <h1 className="text-2xl font-bold text-gray-900">
                  🔒 GDPR-hantering
                </h1>
              </div>
              <button
                onClick={loadStats}
                disabled={loading}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50"
              >
                🔄 Uppdatera
              </button>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              ❌ {error}
            </div>
          )}

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-3xl font-bold text-gray-900">
                {loading ? '...' : stats?.totalOrders || 0}
              </div>
              <div className="text-sm text-gray-500">Totalt antal ordrar</div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-3xl font-bold text-amber-600">
                {loading ? '...' : stats?.ordersToAnonymize || 0}
              </div>
              <div className="text-sm text-gray-500">Ordrar att anonymisera</div>
              <div className="text-xs text-gray-400 mt-1">Äldre än {anonymizeYears} år</div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-3xl font-bold text-blue-600">
                {loading ? '...' : stats?.ordersWithFilesToDelete || 0}
              </div>
              <div className="text-sm text-gray-500">Filer att radera</div>
              <div className="text-xs text-gray-400 mt-1">Äldre än {deleteFilesDays} dagar</div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-sm font-medium text-gray-900">
                {loading ? '...' : stats?.oldestOrderDate ? formatDate(stats.oldestOrderDate) : 'N/A'}
              </div>
              <div className="text-sm text-gray-500">Äldsta ordern</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Cleanup Section */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">
                  🧹 Automatisk rensning
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Anonymisera gamla ordrar och radera uppladdade filer
                </p>
              </div>
              
              <div className="p-6 space-y-4">
                {/* Settings */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Anonymisera efter (år)
                    </label>
                    <input
                      type="number"
                      value={anonymizeYears}
                      onChange={(e) => setAnonymizeYears(parseInt(e.target.value) || 7)}
                      min={1}
                      max={10}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Radera filer efter (dagar)
                    </label>
                    <input
                      type="number"
                      value={deleteFilesDays}
                      onChange={(e) => setDeleteFilesDays(parseInt(e.target.value) || 90)}
                      min={30}
                      max={365}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                </div>

                {/* Result */}
                {result && (
                  <div className={`p-4 rounded-lg ${result.errors?.includes('DRY RUN') ? 'bg-blue-50 border border-blue-200' : 'bg-green-50 border border-green-200'}`}>
                    <div className="font-medium">
                      {result.errors?.includes('DRY RUN') ? '🔍 Förhandsvisning (inga ändringar gjorda)' : '✅ Rensning slutförd'}
                    </div>
                    <div className="text-sm mt-2">
                      <div>Anonymiserade ordrar: {result.anonymizedOrders}</div>
                      <div>Raderade filer: {result.deletedFiles}</div>
                    </div>
                    {result.errors?.length > 0 && !result.errors.includes('DRY RUN') && (
                      <div className="text-sm text-red-600 mt-2">
                        Fel: {result.errors.join(', ')}
                      </div>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    onClick={() => runCleanup(true)}
                    disabled={processing}
                    className="flex-1 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 disabled:opacity-50"
                  >
                    {processing ? '⏳ Bearbetar...' : '🔍 Förhandsgranska'}
                  </button>
                  <button
                    onClick={() => runCleanup(false)}
                    disabled={processing}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                  >
                    {processing ? '⏳ Bearbetar...' : '🧹 Kör rensning'}
                  </button>
                </div>
              </div>
            </div>

            {/* Customer Data Request */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">
                  👤 Kunddataförfrågan
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Exportera eller radera kunddata (GDPR artikel 15 & 17)
                </p>
              </div>
              
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Kundens e-postadress
                  </label>
                  <input
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="kund@example.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={exportCustomerData}
                    disabled={customerLoading || !customerEmail}
                    className="flex-1 px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 disabled:opacity-50"
                  >
                    {customerLoading ? '⏳ Laddar...' : '📤 Exportera data'}
                  </button>
                  <button
                    onClick={deleteCustomerDataHandler}
                    disabled={customerLoading || !customerEmail}
                    className="flex-1 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 disabled:opacity-50"
                  >
                    {customerLoading ? '⏳ Laddar...' : '🗑️ Radera data'}
                  </button>
                </div>

                {customerData && (
                  <div className="mt-4">
                    {customerData.success ? (
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <div className="font-medium mb-2">
                          Hittade {customerData.data?.length || 0} ordrar
                        </div>
                        {customerData.data?.length > 0 && (
                          <>
                            <div className="text-sm text-gray-600 mb-2">
                              Ordernummer: {customerData.data.map((o: any) => o.orderNumber).join(', ')}
                            </div>
                            <button
                              onClick={() => {
                                const blob = new Blob([JSON.stringify(customerData.data, null, 2)], { type: 'application/json' });
                                const url = URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = `gdpr-export-${customerEmail}-${new Date().toISOString().split('T')[0]}.json`;
                                a.click();
                              }}
                              className="text-sm text-blue-600 hover:underline"
                            >
                              📥 Ladda ner som JSON
                            </button>
                          </>
                        )}
                      </div>
                    ) : (
                      <div className="p-4 bg-red-50 text-red-700 rounded-lg">
                        ❌ {customerData.error}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Preview Tables */}
          {preview && (preview.toAnonymize.length > 0 || preview.toDeleteFiles.length > 0) && (
            <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Orders to Anonymize */}
              {preview.toAnonymize.length > 0 && (
                <div className="bg-white rounded-lg shadow">
                  <div className="p-4 border-b border-gray-200">
                    <h3 className="font-semibold text-gray-900">
                      📋 Ordrar att anonymisera ({preview.toAnonymize.length})
                    </h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Order</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Kund</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Datum</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {preview.toAnonymize.slice(0, 10).map((order) => (
                          <tr key={order.id}>
                            <td className="px-4 py-2 text-sm">{order.orderNumber}</td>
                            <td className="px-4 py-2 text-sm">{order.customerName}</td>
                            <td className="px-4 py-2 text-sm text-gray-500">{formatDate(order.createdAt)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {preview.toAnonymize.length > 10 && (
                      <div className="p-4 text-center text-sm text-gray-500">
                        ... och {preview.toAnonymize.length - 10} till
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Files to Delete */}
              {preview.toDeleteFiles.length > 0 && (
                <div className="bg-white rounded-lg shadow">
                  <div className="p-4 border-b border-gray-200">
                    <h3 className="font-semibold text-gray-900">
                      🗑️ Filer att radera ({preview.toDeleteFiles.length})
                    </h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Order</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Kund</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Datum</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {preview.toDeleteFiles.slice(0, 10).map((order) => (
                          <tr key={order.id}>
                            <td className="px-4 py-2 text-sm">{order.orderNumber}</td>
                            <td className="px-4 py-2 text-sm">{order.customerName}</td>
                            <td className="px-4 py-2 text-sm text-gray-500">{formatDate(order.createdAt)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {preview.toDeleteFiles.length > 10 && (
                      <div className="p-4 text-center text-sm text-gray-500">
                        ... och {preview.toDeleteFiles.length - 10} till
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Info Section */}
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="font-semibold text-blue-900 mb-3">ℹ️ Om GDPR-rensning</h3>
            <div className="text-sm text-blue-800 space-y-2">
              <p>
                <strong>Anonymisering (efter {anonymizeYears} år):</strong> Personuppgifter ersätts med [RADERAT]. 
                Orderdata (belopp, dokumenttyper, datum) behålls för bokföring enligt Bokföringslagen.
              </p>
              <p>
                <strong>Filradering (efter {deleteFilesDays} dagar):</strong> Uppladdade dokument (ID-kopior, certifikat) 
                raderas permanent. Orderinformation behålls.
              </p>
              <p>
                <strong>Kunddataförfrågan:</strong> Exportera all data för en kund (GDPR artikel 15) eller 
                radera all data (GDPR artikel 17 - rätten att bli glömd).
              </p>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
