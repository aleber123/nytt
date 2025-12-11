/**
 * Address Confirmation Page
 * 
 * Allows customers to confirm or update their pickup/return address.
 * Design matches the main DOX website styling.
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Image from 'next/image';

// Icon components matching site design
const CheckCircle = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const AlertCircle = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const MapPin = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const Edit2 = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);

const Loader2 = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

interface AddressData {
  street: string;
  postalCode: string;
  city: string;
  country: string;
  companyName?: string;
  contactName?: string;
  phone?: string;
}

interface ConfirmationData {
  type: 'pickup' | 'return';
  address: AddressData;
  confirmed: boolean;
  confirmedAt?: string;
}

interface OrderData {
  orderNumber: string;
  customerName: string;
}

export default function ConfirmAddressPage() {
  const router = useRouter();
  const { token, edit } = router.query;
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [confirmation, setConfirmation] = useState<ConfirmationData | null>(null);
  const [order, setOrder] = useState<OrderData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedAddress, setEditedAddress] = useState<AddressData | null>(null);

  useEffect(() => {
    if (token) {
      fetchConfirmation();
    }
  }, [token]);

  useEffect(() => {
    if (edit === 'true' && confirmation) {
      setIsEditing(true);
      setEditedAddress({ ...confirmation.address });
    }
  }, [edit, confirmation]);

  const fetchConfirmation = async () => {
    try {
      const response = await fetch(`/api/address-confirmation/${token}`);
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Ett fel uppstod');
        return;
      }

      setConfirmation(data.confirmation);
      setOrder(data.order);
      setEditedAddress(data.confirmation.address);
    } catch (err) {
      setError('Kunde inte hämta bekräftelseinformation');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    setSubmitting(true);
    try {
      const response = await fetch(`/api/address-confirmation/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'confirm' })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Kunde inte bekräfta adressen');
        return;
      }

      setSuccess(true);
    } catch (err) {
      setError('Ett fel uppstod vid bekräftelse');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async () => {
    if (!editedAddress) return;

    setSubmitting(true);
    try {
      const response = await fetch(`/api/address-confirmation/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'update',
          updatedAddress: editedAddress
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Kunde inte uppdatera adressen');
        return;
      }

      setSuccess(true);
    } catch (err) {
      setError('Ett fel uppstod vid uppdatering');
    } finally {
      setSubmitting(false);
    }
  };

  const addressTypeText = confirmation?.type === 'pickup' ? 'Upphämtningsadress' : 'Returadress';

  // Common page wrapper with header
  const PageWrapper = ({ children, title }: { children: React.ReactNode; title: string }) => (
    <div className="min-h-screen bg-gray-50 font-sans">
      <Head>
        <title>{title}</title>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </Head>
      
      {/* Header matching main site */}
      <header className="bg-custom-page-header">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-center">
            <Image 
              src="/images/DOX_Visumpartner_logo_vit.png" 
              alt="DOX Visumpartner" 
              width={180} 
              height={50}
              className="h-10 w-auto"
              priority
            />
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="py-12 px-4">
        <div className="max-w-lg mx-auto">
          {children}
        </div>
      </main>

      {/* Footer matching main site */}
      <footer className="bg-custom-page-header text-white py-8 mt-auto">
        <div className="container mx-auto px-4 text-center">
          <p className="font-heading font-semibold mb-2">DOX Visumpartner AB</p>
          <p className="text-gray-400 text-sm mb-2">Livdjursgatan 4, våning 6 • 121 62 Johanneshov</p>
          <p className="text-sm">
            <a href="mailto:info@doxvl.se" className="text-custom-button hover:underline">info@doxvl.se</a>
            <span className="text-gray-500 mx-2">•</span>
            <a href="tel:+46840941900" className="text-custom-button hover:underline">08-409 419 00</a>
          </p>
        </div>
      </footer>
    </div>
  );

  if (loading) {
    return (
      <PageWrapper title="Laddar... - DOX Visumpartner">
        <div className="text-center py-16">
          <Loader2 className="w-12 h-12 text-custom-button animate-spin mx-auto" />
          <p className="mt-4 text-gray-600">Laddar...</p>
        </div>
      </PageWrapper>
    );
  }

  if (error && !confirmation) {
    return (
      <PageWrapper title="Fel - DOX Visumpartner">
        <div className="bg-white rounded-xl shadow-card p-8 text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-heading font-bold text-gray-900 mb-2">Något gick fel</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <a 
            href="mailto:info@doxvl.se"
            className="inline-block bg-custom-button text-white px-6 py-3 rounded-md font-medium hover:bg-custom-button/90 transition"
          >
            Kontakta oss
          </a>
        </div>
      </PageWrapper>
    );
  }

  if (success) {
    return (
      <PageWrapper title="Adress bekräftad - DOX Visumpartner">
        <div className="bg-white rounded-xl shadow-card p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-2xl font-heading font-bold text-gray-900 mb-2">Tack!</h1>
          <p className="text-gray-600 mb-2">
            {isEditing ? 'Din adress har uppdaterats och bekräftats.' : 'Din adress har bekräftats.'}
          </p>
          {order && (
            <p className="text-sm text-gray-500 mb-4">
              Order: <span className="font-semibold">{order.orderNumber}</span>
            </p>
          )}
          <div className="mt-6 p-4 bg-custom-button/10 rounded-lg border border-custom-button/20">
            <p className="text-sm text-gray-700">
              Vi kommer att använda denna adress för {confirmation?.type === 'pickup' ? 'upphämtning av dina dokument' : 'retur av dina legaliserade dokument'}.
            </p>
          </div>
        </div>
      </PageWrapper>
    );
  }

  if (confirmation?.confirmed) {
    return (
      <PageWrapper title="Redan bekräftad - DOX Visumpartner">
        <div className="bg-white rounded-xl shadow-card p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-2xl font-heading font-bold text-gray-900 mb-2">Redan bekräftad</h1>
          <p className="text-gray-600 mb-4">
            Denna adress har redan bekräftats.
          </p>
          {confirmation.confirmedAt && (
            <p className="text-sm text-gray-500">
              Bekräftad: {new Date(confirmation.confirmedAt).toLocaleString('sv-SE')}
            </p>
          )}
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper title={`Bekräfta ${addressTypeText.toLowerCase()} - DOX Visumpartner`}>
      {/* Order number badge */}
      {order && (
        <div className="text-center mb-6">
          <span className="inline-block bg-custom-button text-white px-4 py-2 rounded-md font-semibold text-sm">
            Order: {order.orderNumber}
          </span>
        </div>
      )}

      {/* Main Card */}
      <div className="bg-white rounded-xl shadow-card overflow-hidden">
        <div className="bg-custom-page-header px-6 py-4">
          <h2 className="text-lg font-heading font-semibold text-white flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            {isEditing ? `Ändra ${addressTypeText.toLowerCase()}` : `Bekräfta ${addressTypeText.toLowerCase()}`}
          </h2>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {!isEditing ? (
            /* View Mode */
            <>
              <div className="bg-gray-50 rounded-lg p-5 mb-6 border border-gray-200">
                <h3 className="font-heading font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-custom-button" />
                  {addressTypeText}
                </h3>
                <div className="space-y-1 text-gray-700">
                  {confirmation?.address.companyName && (
                    <p className="font-semibold">{confirmation.address.companyName}</p>
                  )}
                  {confirmation?.address.contactName && (
                    <p>{confirmation.address.contactName}</p>
                  )}
                  <p>{confirmation?.address.street}</p>
                  <p>{confirmation?.address.postalCode} {confirmation?.address.city}</p>
                  <p>{confirmation?.address.country}</p>
                  {confirmation?.address.phone && (
                    <p className="text-gray-500 mt-2">📞 {confirmation.address.phone}</p>
                  )}
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-amber-800">
                  <strong>⚠️ Viktigt:</strong> Kontrollera att adressen är korrekt. 
                  Felaktig adress kan leda till förseningar eller missade leveranser.
                </p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={handleConfirm}
                  disabled={submitting}
                  className="w-full bg-custom-button text-white py-3 px-4 rounded-md font-medium hover:bg-custom-button/90 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <CheckCircle className="w-5 h-5" />
                  )}
                  Bekräfta adress
                </button>

                <button
                  onClick={() => {
                    setIsEditing(true);
                    setEditedAddress({ ...confirmation!.address });
                  }}
                  disabled={submitting}
                  className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-md font-medium hover:bg-gray-200 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 border border-gray-300"
                >
                  <Edit2 className="w-5 h-5" />
                  Ändra adress
                </button>
              </div>
            </>
          ) : (
            /* Edit Mode */
            <>
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Företagsnamn (valfritt)
                  </label>
                  <input
                    type="text"
                    value={editedAddress?.companyName || ''}
                    onChange={(e) => setEditedAddress(prev => ({ ...prev!, companyName: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-custom-button focus:border-custom-button"
                    placeholder="Företagsnamn"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Kontaktperson
                  </label>
                  <input
                    type="text"
                    value={editedAddress?.contactName || ''}
                    onChange={(e) => setEditedAddress(prev => ({ ...prev!, contactName: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-custom-button focus:border-custom-button"
                    placeholder="Namn"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Gatuadress *
                  </label>
                  <input
                    type="text"
                    value={editedAddress?.street || ''}
                    onChange={(e) => setEditedAddress(prev => ({ ...prev!, street: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-custom-button focus:border-custom-button"
                    placeholder="Gatuadress"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Postnummer *
                    </label>
                    <input
                      type="text"
                      value={editedAddress?.postalCode || ''}
                      onChange={(e) => setEditedAddress(prev => ({ ...prev!, postalCode: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-custom-button focus:border-custom-button"
                      placeholder="12345"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Stad *
                    </label>
                    <input
                      type="text"
                      value={editedAddress?.city || ''}
                      onChange={(e) => setEditedAddress(prev => ({ ...prev!, city: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-custom-button focus:border-custom-button"
                      placeholder="Stockholm"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Telefon
                  </label>
                  <input
                    type="tel"
                    value={editedAddress?.phone || ''}
                    onChange={(e) => setEditedAddress(prev => ({ ...prev!, phone: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-custom-button focus:border-custom-button"
                    placeholder="070-123 45 67"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={handleUpdate}
                  disabled={submitting || !editedAddress?.street || !editedAddress?.postalCode || !editedAddress?.city}
                  className="w-full bg-custom-button text-white py-3 px-4 rounded-md font-medium hover:bg-custom-button/90 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <CheckCircle className="w-5 h-5" />
                  )}
                  Spara och bekräfta
                </button>

                <button
                  onClick={() => {
                    setIsEditing(false);
                    setEditedAddress(confirmation!.address);
                  }}
                  disabled={submitting}
                  className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-md font-medium hover:bg-gray-200 transition border border-gray-300"
                >
                  Avbryt
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </PageWrapper>
  );
}
