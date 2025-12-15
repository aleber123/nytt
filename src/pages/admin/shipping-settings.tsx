/**
 * Admin Shipping Settings Page
 * 
 * Allows admins to configure shipping-related settings like
 * max DHL price limits.
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'react-hot-toast';
import Link from 'next/link';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

interface ShippingSettings {
  dhlMaxPrice: number;
  dhlMaxPriceEnabled: boolean;
  dhlPickupMaxPrice: number;
  dhlPickupMaxPriceEnabled: boolean;
  updatedAt?: string;
  updatedBy?: string;
}

const DEFAULT_SETTINGS: ShippingSettings = {
  dhlMaxPrice: 300,
  dhlMaxPriceEnabled: true,
  dhlPickupMaxPrice: 300,
  dhlPickupMaxPriceEnabled: true,
};

function ShippingSettingsContent() {
  const { currentUser } = useAuth();
  
  const [settings, setSettings] = useState<ShippingSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Fetch settings via API (uses Admin SDK to bypass Firestore rules)
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/admin/shipping-settings');
        const data = await response.json();
        
        if (data.success && data.settings) {
          setSettings({ ...DEFAULT_SETTINGS, ...data.settings as ShippingSettings });
        }
      } catch (error) {
        console.error('Error fetching shipping settings:', error);
        toast.error('Kunde inte hämta inställningar');
      } finally {
        setLoading(false);
      }
    };

    if (currentUser) {
      fetchSettings();
    }
  }, [currentUser]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/admin/shipping-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...settings,
          updatedBy: currentUser?.email || currentUser?.uid || 'unknown',
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to save');
      }
      
      toast.success('Inställningar sparade!');
    } catch (error) {
      console.error('Error saving shipping settings:', error);
      toast.error('Kunde inte spara inställningar');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-gray-600">Laddar...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/admin" className="text-gray-500 hover:text-gray-700">
                ← Tillbaka
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">Fraktinställningar</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-6 space-y-8">
          
          {/* DHL Return Shipment Settings */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              📦 DHL Returfrakt (DOX → Kund)
            </h2>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.dhlMaxPriceEnabled}
                    onChange={(e) => setSettings({ ...settings, dhlMaxPriceEnabled: e.target.checked })}
                    className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-gray-700">Aktivera maxprisgräns</span>
                </label>
              </div>
              
              <div className={`flex items-center gap-4 ${!settings.dhlMaxPriceEnabled ? 'opacity-50' : ''}`}>
                <label className="text-gray-700 w-48">Maxpris för DHL-bokning:</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={settings.dhlMaxPrice}
                    onChange={(e) => setSettings({ ...settings, dhlMaxPrice: Number(e.target.value) })}
                    disabled={!settings.dhlMaxPriceEnabled}
                    min={0}
                    step={10}
                    className="w-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  />
                  <span className="text-gray-600">kr</span>
                </div>
              </div>
              
              <p className="text-sm text-gray-500">
                Om DHL-priset överstiger detta belopp blockeras automatisk bokning och personalen får ett meddelande om att göra en manuell bokning.
              </p>
            </div>
          </section>

          <hr className="border-gray-200" />

          {/* DHL Pickup Shipment Settings */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              🚚 DHL Upphämtning (Kund → DOX)
            </h2>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.dhlPickupMaxPriceEnabled}
                    onChange={(e) => setSettings({ ...settings, dhlPickupMaxPriceEnabled: e.target.checked })}
                    className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-gray-700">Aktivera maxprisgräns</span>
                </label>
              </div>
              
              <div className={`flex items-center gap-4 ${!settings.dhlPickupMaxPriceEnabled ? 'opacity-50' : ''}`}>
                <label className="text-gray-700 w-48">Maxpris för DHL-upphämtning:</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={settings.dhlPickupMaxPrice}
                    onChange={(e) => setSettings({ ...settings, dhlPickupMaxPrice: Number(e.target.value) })}
                    disabled={!settings.dhlPickupMaxPriceEnabled}
                    min={0}
                    step={10}
                    className="w-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  />
                  <span className="text-gray-600">kr</span>
                </div>
              </div>
              
              <p className="text-sm text-gray-500">
                Om DHL-priset för upphämtning överstiger detta belopp blockeras automatisk bokning.
              </p>
            </div>
          </section>

          <hr className="border-gray-200" />

          {/* Info Section */}
          <section className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-medium text-blue-800 mb-2">ℹ️ Hur det fungerar</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• När personal trycker på "Boka DHL" hämtas först priset från DHL API</li>
              <li>• Om priset överstiger maxgränsen visas en varning och bokningen blockeras</li>
              <li>• Personal kan då göra en manuell bokning via DHL:s webbplats</li>
              <li>• Sandbox-läge: Priser i testmiljön kan skilja sig från produktion</li>
            </ul>
          </section>

          {/* Save Button */}
          <div className="flex justify-end pt-4">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Sparar...' : 'Spara inställningar'}
            </button>
          </div>

          {/* Last Updated */}
          {settings.updatedAt && (
            <p className="text-xs text-gray-400 text-right">
              Senast uppdaterad: {new Date(settings.updatedAt).toLocaleString('sv-SE')} av {settings.updatedBy}
            </p>
          )}
        </div>
      </main>
    </div>
  );
}

// Wrap with ProtectedRoute for admin authentication
export default function ShippingSettingsPage() {
  return (
    <ProtectedRoute>
      <ShippingSettingsContent />
    </ProtectedRoute>
  );
}
