import { useState } from 'react';
import type { User as FirebaseUser } from 'firebase/auth';
import { PortalCustomer, SavedAddress } from '@/firebase/portalCustomerService';
import { ALL_COUNTRIES } from '@/components/order/data/countries';
import { toast } from 'react-hot-toast';
import AddressAutocomplete from '@/components/ui/AddressAutocomplete';

interface Props {
  portalCustomer: PortalCustomer;
  firebaseUser: FirebaseUser;
  onClose: () => void;
  onOrderCreated: (orderId: string) => void;
}

type OrderType = 'legalization' | 'visa';

const LEGALIZATION_SERVICES = [
  { id: 'apostille', label: 'Apostille' },
  { id: 'ud', label: 'Ministry of Foreign Affairs' },
  { id: 'embassy', label: 'Embassy legalization' },
  { id: 'notarius', label: 'Notary public' },
  { id: 'handelskammaren', label: 'Chamber of Commerce' },
];

const DOCUMENT_TYPES = [
  'Power of Attorney',
  'Corporate document',
  'Diploma / Degree certificate',
  'Birth certificate',
  'Marriage certificate',
  'Certificate / Statement',
  'Agreement / Contract',
  'Commercial invoice',
  'Certificate of Origin',
  'Export certificate',
  'Other',
];

export default function PortalNewOrderModal({ portalCustomer, firebaseUser, onClose, onOrderCreated }: Props) {
  const [step, setStep] = useState(1); // 1 = type, 2 = details, 3 = shipping
  const [submitting, setSubmitting] = useState(false);

  // Order type
  const [orderType, setOrderType] = useState<OrderType | null>(null);

  // Shared fields
  const [country, setCountry] = useState('');
  const [countrySearch, setCountrySearch] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');

  // Legalization-specific
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [documentType, setDocumentType] = useState('');

  // Visa-specific
  const [visaType, setVisaType] = useState('');
  const [travelerCount, setTravelerCount] = useState(1);
  const [travelers, setTravelers] = useState([{ firstName: '', lastName: '' }]);

  // Courier Pickup & Return
  const [needsPickup, setNeedsPickup] = useState<boolean | null>(null);
  const [needsReturn, setNeedsReturn] = useState<boolean | null>(null);
  const [pickupAddress, setPickupAddress] = useState({
    street: '',
    postalCode: '',
    city: '',
  });
  const [pickupContact, setPickupContact] = useState({
    name: portalCustomer.displayName || '',
    phone: portalCustomer.phone || '',
  });
  const [pickupDate, setPickupDate] = useState('');
  const [returnAddress, setReturnAddress] = useState({
    street: '',
    postalCode: '',
    city: '',
  });
  const [returnContact, setReturnContact] = useState({
    name: portalCustomer.displayName || '',
    phone: portalCustomer.phone || '',
  });

  // Saved addresses
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>(portalCustomer.savedAddresses || []);
  const [savePickupAddr, setSavePickupAddr] = useState(false);
  const [saveReturnAddr, setSaveReturnAddr] = useState(false);
  const [pickupAddrLabel, setPickupAddrLabel] = useState('');
  const [returnAddrLabel, setReturnAddrLabel] = useState('');

  // File upload
  const [files, setFiles] = useState<File[]>([]);

  const applySavedAddress = (addr: SavedAddress, target: 'pickup' | 'return') => {
    if (target === 'pickup') {
      setPickupAddress({ street: addr.street, postalCode: addr.postalCode, city: addr.city });
      setPickupContact({ name: addr.contactName, phone: addr.contactPhone });
    } else {
      setReturnAddress({ street: addr.street, postalCode: addr.postalCode, city: addr.city });
      setReturnContact({ name: addr.contactName, phone: addr.contactPhone });
    }
  };

  const saveNewAddress = async (label: string, street: string, postalCode: string, city: string, contactName: string, contactPhone: string) => {
    try {
      const token = await firebaseUser.getIdToken();
      const resp = await fetch('/api/portal/saved-addresses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ label, street, postalCode, city, contactName, contactPhone }),
      });
      const result = await resp.json();
      if (resp.ok) {
        setSavedAddresses(result.savedAddresses);
      }
    } catch { /* silent */ }
  };

  const deleteSavedAddress = async (addressId: string) => {
    try {
      const token = await firebaseUser.getIdToken();
      const resp = await fetch('/api/portal/saved-addresses', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ addressId }),
      });
      const result = await resp.json();
      if (resp.ok) {
        setSavedAddresses(result.savedAddresses);
      }
    } catch { /* silent */ }
  };

  // Country filtering
  const filteredCountries = ALL_COUNTRIES.filter((c) => {
    if (!countrySearch.trim()) return true;
    const q = countrySearch.toLowerCase();
    return c.name.toLowerCase().includes(q) || (c.nameEn || '').toLowerCase().includes(q);
  });

  const selectedCountry = ALL_COUNTRIES.find((c) => c.code === country);

  // Traveler count handler
  const handleTravelerCountChange = (count: number) => {
    setTravelerCount(count);
    const newTravelers = [...travelers];
    while (newTravelers.length < count) newTravelers.push({ firstName: '', lastName: '' });
    while (newTravelers.length > count) newTravelers.pop();
    setTravelers(newTravelers);
  };

  // Validation
  const canProceedStep2 = (): boolean => {
    if (!country) return false;
    if (orderType === 'legalization') {
      return selectedServices.length > 0 && !!documentType;
    }
    if (orderType === 'visa') {
      return travelers.every((t) => t.firstName.trim() && t.lastName.trim());
    }
    return false;
  };

  const canSubmit = (): boolean => {
    if (needsPickup === null || needsReturn === null) return false;
    if (needsPickup) {
      if (!(pickupAddress.street && pickupAddress.postalCode && pickupAddress.city && pickupContact.name && pickupContact.phone)) return false;
    }
    if (needsReturn) {
      if (!(returnAddress.street && returnAddress.postalCode && returnAddress.city && returnContact.name && returnContact.phone)) return false;
    }
    return true;
  };

  // Submit
  const handleSubmit = async () => {
    setSubmitting(true);

    try {
      const token = await firebaseUser.getIdToken();

      const orderData: Record<string, any> = {
        additionalNotes: notes || '',
        pickupService: needsPickup || false,
        returnService: needsReturn ? 'courier' : 'none',
        ...(needsPickup && {
          pickupAddress,
          pickupContactName: pickupContact.name,
          pickupContactPhone: pickupContact.phone,
          pickupDate: pickupDate || '',
        }),
        ...(needsReturn && {
          returnAddress,
          returnContactName: returnContact.name,
          returnContactPhone: returnContact.phone,
        }),
      };

      if (orderType === 'visa') {
        orderData.destinationCountry = selectedCountry?.nameEn || selectedCountry?.name || country;
        orderData.destinationCountryCode = country;
        orderData.visaProduct = {
          name: visaType || 'Visa (please specify)',
          category: 'business',
          visaType: 'sticker',
        };
        orderData.travelerCount = travelerCount;
        orderData.travelers = travelers;
        orderData.nationality = 'SE';
        orderData.nationalityCode = 'SE';
        orderData.totalPrice = 0;
      } else {
        orderData.services = selectedServices;
        orderData.documentType = documentType;
        orderData.country = selectedCountry?.nameEn || selectedCountry?.name || country;
        orderData.countryCode = country;
        orderData.quantity = quantity;
        orderData.expedited = false;
        orderData.documentSource = 'original';
        orderData.scannedCopies = false;
        orderData.returnService = needsReturn ? 'courier' : 'none';
        orderData.deliveryMethod = needsReturn ? 'courier' : 'pending';
        orderData.paymentMethod = 'invoice';
        orderData.totalPrice = 0;
      }

      const resp = await fetch('/api/portal/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ orderType, orderData }),
      });

      const result = await resp.json();
      if (!resp.ok) {
        toast.error(result.error || 'Could not create order');
        return;
      }

      // Save addresses if requested
      if (savePickupAddr && pickupAddrLabel.trim() && needsPickup) {
        await saveNewAddress(pickupAddrLabel.trim(), pickupAddress.street, pickupAddress.postalCode, pickupAddress.city, pickupContact.name, pickupContact.phone);
      }
      if (saveReturnAddr && returnAddrLabel.trim() && needsReturn) {
        await saveNewAddress(returnAddrLabel.trim(), returnAddress.street, returnAddress.postalCode, returnAddress.city, returnContact.name, returnContact.phone);
      }

      onOrderCreated(result.orderId);
    } catch (err: any) {
      toast.error(`Could not create order: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 rounded-t-2xl flex items-center justify-between z-10">
          <div>
            <h2 className="text-lg font-bold text-gray-900">New order</h2>
            <p className="text-xs text-gray-500">
              {step === 1 && 'Choose service type'}
              {step === 2 && (orderType === 'visa' ? 'Visa details' : 'Legalization details')}
              {step === 3 && 'Pickup & delivery'}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-5">
          {/* STEP 1: Choose type */}
          {step === 1 && (
            <div className="space-y-3">
              <button
                onClick={() => { setOrderType('legalization'); setStep(2); }}
                className="w-full flex items-center gap-4 p-5 border-2 border-gray-200 rounded-xl hover:border-custom-button hover:bg-custom-button/5 transition-all group"
              >
                <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center text-xl group-hover:bg-amber-200 transition-colors">
                  📄
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-gray-900">Legalization</h3>
                  <p className="text-sm text-gray-500">Apostille, MFA, embassy & notary</p>
                </div>
                <svg className="w-5 h-5 text-gray-300 ml-auto group-hover:text-custom-button transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>

              <button
                onClick={() => { setOrderType('visa'); setStep(2); }}
                className="w-full flex items-center gap-4 p-5 border-2 border-gray-200 rounded-xl hover:border-custom-button hover:bg-custom-button/5 transition-all group"
              >
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-xl group-hover:bg-blue-200 transition-colors">
                  🛂
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-gray-900">Visa</h3>
                  <p className="text-sm text-gray-500">Visa applications for all countries</p>
                </div>
                <svg className="w-5 h-5 text-gray-300 ml-auto group-hover:text-custom-button transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          )}

          {/* STEP 2: Details */}
          {step === 2 && (
            <div className="space-y-5">
              {/* Country */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {orderType === 'visa' ? 'Destination' : 'Destination country'}
                </label>
                <input
                  type="text"
                  placeholder="Search country..."
                  value={country ? (selectedCountry ? `${selectedCountry.flag} ${selectedCountry.nameEn || selectedCountry.name}` : country) : countrySearch}
                  onChange={(e) => {
                    setCountrySearch(e.target.value);
                    setCountry('');
                  }}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-custom-button/30 focus:border-custom-button"
                />
                {countrySearch && !country && (
                  <div className="mt-1 max-h-40 overflow-y-auto border border-gray-200 rounded-lg shadow-sm bg-white">
                    {filteredCountries.slice(0, 20).map((c) => (
                      <button
                        key={c.code}
                        onClick={() => { setCountry(c.code); setCountrySearch(''); }}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"
                      >
                        <span>{c.flag}</span>
                        <span>{c.nameEn || c.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Legalization-specific */}
              {orderType === 'legalization' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Services</label>
                    <div className="space-y-2">
                      {LEGALIZATION_SERVICES.map((s) => (
                        <label
                          key={s.id}
                          className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                            selectedServices.includes(s.id)
                              ? 'border-custom-button bg-custom-button/5'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={selectedServices.includes(s.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedServices([...selectedServices, s.id]);
                              } else {
                                setSelectedServices(selectedServices.filter((x) => x !== s.id));
                              }
                            }}
                            className="rounded border-gray-300 text-custom-button focus:ring-custom-button"
                          />
                          <span className="text-sm font-medium text-gray-700">{s.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Document type</label>
                    <select
                      value={documentType}
                      onChange={(e) => setDocumentType(e.target.value)}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-custom-button/30 focus:border-custom-button"
                    >
                      <option value="">Select document type...</option>
                      {DOCUMENT_TYPES.map((dt) => (
                        <option key={dt} value={dt}>{dt}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Number of documents</label>
                    <input
                      type="number"
                      min={1}
                      max={50}
                      value={quantity}
                      onChange={(e) => setQuantity(Number(e.target.value) || 1)}
                      className="w-24 px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-custom-button/30 focus:border-custom-button"
                    />
                  </div>
                </>
              )}

              {/* Visa-specific */}
              {orderType === 'visa' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Visa type (optional)</label>
                    <input
                      type="text"
                      placeholder="E.g. Business, Tourist, Work..."
                      value={visaType}
                      onChange={(e) => setVisaType(e.target.value)}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-custom-button/30 focus:border-custom-button"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Number of travelers</label>
                    <input
                      type="number"
                      min={1}
                      max={20}
                      value={travelerCount}
                      onChange={(e) => handleTravelerCountChange(Number(e.target.value) || 1)}
                      className="w-24 px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-custom-button/30 focus:border-custom-button"
                    />
                  </div>

                  <div className="space-y-3">
                    {travelers.map((t, i) => (
                      <div key={i} className="flex gap-2">
                        <div className="flex-1">
                          <label className="block text-xs text-gray-500 mb-0.5">First name</label>
                          <input
                            type="text"
                            value={t.firstName}
                            onChange={(e) => {
                              const updated = [...travelers];
                              updated[i] = { ...updated[i], firstName: e.target.value };
                              setTravelers(updated);
                            }}
                            placeholder="First name"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-custom-button/30 focus:border-custom-button"
                          />
                        </div>
                        <div className="flex-1">
                          <label className="block text-xs text-gray-500 mb-0.5">Last name</label>
                          <input
                            type="text"
                            value={t.lastName}
                            onChange={(e) => {
                              const updated = [...travelers];
                              updated[i] = { ...updated[i], lastName: e.target.value };
                              setTravelers(updated);
                            }}
                            placeholder="Last name"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-custom-button/30 focus:border-custom-button"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Message / Instructions (optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder="Special requests or instructions..."
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-custom-button/30 focus:border-custom-button resize-none"
                />
              </div>
            </div>
          )}

          {/* STEP 3: Courier Pickup & Return */}
          {step === 3 && (
            <div className="space-y-5">
              {/* Courier Pickup */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Do you need courier pickup of your documents?
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setNeedsPickup(true)}
                    className={`p-4 border-2 rounded-xl text-center transition-all ${
                      needsPickup === true
                        ? 'border-custom-button bg-custom-button/5'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-2xl mb-1">📦</div>
                    <p className="text-sm font-medium text-gray-900">Yes</p>
                    <p className="text-xs text-gray-500 mt-0.5">Pick up documents from us</p>
                  </button>
                  <button
                    onClick={() => setNeedsPickup(false)}
                    className={`p-4 border-2 rounded-xl text-center transition-all ${
                      needsPickup === false
                        ? 'border-custom-button bg-custom-button/5'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-2xl mb-1">✉️</div>
                    <p className="text-sm font-medium text-gray-900">No</p>
                    <p className="text-xs text-gray-500 mt-0.5">We send them ourselves</p>
                  </button>
                </div>
              </div>

              {needsPickup && (
                <div className="space-y-4 bg-gray-50 rounded-xl p-4">
                  <h4 className="text-sm font-semibold text-gray-800">Pickup address</h4>

                  {savedAddresses.length > 0 && (
                    <div>
                      <label className="block text-xs text-gray-500 mb-0.5">Use saved address</label>
                      <div className="flex flex-wrap gap-2">
                        {savedAddresses.map((addr) => (
                          <div key={addr.id} className="group flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => applySavedAddress(addr, 'pickup')}
                              className="px-3 py-1.5 text-xs bg-white border border-gray-200 rounded-lg hover:border-custom-button hover:bg-custom-button/5 transition-all"
                              title={`${addr.street}, ${addr.postalCode} ${addr.city}`}
                            >
                              📍 {addr.label}
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteSavedAddress(addr.id)}
                              className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all text-xs"
                              title="Delete saved address"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs text-gray-500 mb-0.5">Street address</label>
                    <AddressAutocomplete
                      value={pickupAddress.street}
                      onChange={(val) => setPickupAddress({ ...pickupAddress, street: val })}
                      onSelect={(data) => {
                        setPickupAddress({
                          street: data.street || '',
                          postalCode: data.postalCode || pickupAddress.postalCode,
                          city: data.city || pickupAddress.city,
                        });
                      }}
                      placeholder="Search address..."
                      className="!rounded-lg !text-sm !py-2 !border-gray-300 focus:!ring-custom-button/30 focus:!border-custom-button"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-0.5">Postal code</label>
                      <input
                        type="text"
                        value={pickupAddress.postalCode}
                        onChange={(e) => setPickupAddress({ ...pickupAddress, postalCode: e.target.value })}
                        placeholder="111 22"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-custom-button/30 focus:border-custom-button"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-0.5">City</label>
                      <input
                        type="text"
                        value={pickupAddress.city}
                        onChange={(e) => setPickupAddress({ ...pickupAddress, city: e.target.value })}
                        placeholder="Stockholm"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-custom-button/30 focus:border-custom-button"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-0.5">Contact person</label>
                      <input
                        type="text"
                        value={pickupContact.name}
                        onChange={(e) => setPickupContact({ ...pickupContact, name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-custom-button/30 focus:border-custom-button"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-0.5">Phone</label>
                      <input
                        type="text"
                        value={pickupContact.phone}
                        onChange={(e) => setPickupContact({ ...pickupContact, phone: e.target.value })}
                        placeholder="070-123 45 67"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-custom-button/30 focus:border-custom-button"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-gray-500 mb-0.5">Preferred pickup date (optional)</label>
                    <input
                      type="date"
                      value={pickupDate}
                      onChange={(e) => setPickupDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-custom-button/30 focus:border-custom-button"
                    />
                  </div>

                  <div className="flex items-start gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="savePickupAddr"
                      checked={savePickupAddr}
                      onChange={(e) => setSavePickupAddr(e.target.checked)}
                      className="mt-0.5 rounded border-gray-300 text-custom-button focus:ring-custom-button/30"
                    />
                    <label htmlFor="savePickupAddr" className="text-xs text-gray-600">
                      Save this address for future orders
                    </label>
                  </div>
                  {savePickupAddr && (
                    <input
                      type="text"
                      value={pickupAddrLabel}
                      onChange={(e) => setPickupAddrLabel(e.target.value)}
                      placeholder="Address label (e.g. Head Office, Warehouse)"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-custom-button/30 focus:border-custom-button"
                    />
                  )}
                </div>
              )}

              {/* Courier Return */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Do you need courier return of your documents?
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setNeedsReturn(true)}
                    className={`p-4 border-2 rounded-xl text-center transition-all ${
                      needsReturn === true
                        ? 'border-custom-button bg-custom-button/5'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-2xl mb-1">🔄</div>
                    <p className="text-sm font-medium text-gray-900">Yes</p>
                    <p className="text-xs text-gray-500 mt-0.5">Deliver documents back to us</p>
                  </button>
                  <button
                    onClick={() => setNeedsReturn(false)}
                    className={`p-4 border-2 rounded-xl text-center transition-all ${
                      needsReturn === false
                        ? 'border-custom-button bg-custom-button/5'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-2xl mb-1">🏢</div>
                    <p className="text-sm font-medium text-gray-900">No</p>
                    <p className="text-xs text-gray-500 mt-0.5">We collect them ourselves</p>
                  </button>
                </div>
              </div>

              {needsReturn && (
                <div className="space-y-4 bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-gray-800">Return address</h4>
                    {needsPickup && (
                      <button
                        type="button"
                        onClick={() => {
                          setReturnAddress({ ...pickupAddress });
                          setReturnContact({ ...pickupContact });
                        }}
                        className="text-xs text-custom-button hover:underline"
                      >
                        Same as pickup
                      </button>
                    )}
                  </div>

                  {savedAddresses.length > 0 && (
                    <div>
                      <label className="block text-xs text-gray-500 mb-0.5">Use saved address</label>
                      <div className="flex flex-wrap gap-2">
                        {savedAddresses.map((addr) => (
                          <div key={addr.id} className="group flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => applySavedAddress(addr, 'return')}
                              className="px-3 py-1.5 text-xs bg-white border border-gray-200 rounded-lg hover:border-custom-button hover:bg-custom-button/5 transition-all"
                              title={`${addr.street}, ${addr.postalCode} ${addr.city}`}
                            >
                              📍 {addr.label}
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteSavedAddress(addr.id)}
                              className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all text-xs"
                              title="Delete saved address"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs text-gray-500 mb-0.5">Street address</label>
                    <AddressAutocomplete
                      value={returnAddress.street}
                      onChange={(val) => setReturnAddress({ ...returnAddress, street: val })}
                      onSelect={(data) => {
                        setReturnAddress({
                          street: data.street || '',
                          postalCode: data.postalCode || returnAddress.postalCode,
                          city: data.city || returnAddress.city,
                        });
                      }}
                      placeholder="Search address..."
                      className="!rounded-lg !text-sm !py-2 !border-gray-300 focus:!ring-custom-button/30 focus:!border-custom-button"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-0.5">Postal code</label>
                      <input
                        type="text"
                        value={returnAddress.postalCode}
                        onChange={(e) => setReturnAddress({ ...returnAddress, postalCode: e.target.value })}
                        placeholder="111 22"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-custom-button/30 focus:border-custom-button"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-0.5">City</label>
                      <input
                        type="text"
                        value={returnAddress.city}
                        onChange={(e) => setReturnAddress({ ...returnAddress, city: e.target.value })}
                        placeholder="Stockholm"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-custom-button/30 focus:border-custom-button"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-0.5">Contact person</label>
                      <input
                        type="text"
                        value={returnContact.name}
                        onChange={(e) => setReturnContact({ ...returnContact, name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-custom-button/30 focus:border-custom-button"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-0.5">Phone</label>
                      <input
                        type="text"
                        value={returnContact.phone}
                        onChange={(e) => setReturnContact({ ...returnContact, phone: e.target.value })}
                        placeholder="070-123 45 67"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-custom-button/30 focus:border-custom-button"
                      />
                    </div>
                  </div>

                  <div className="flex items-start gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="saveReturnAddr"
                      checked={saveReturnAddr}
                      onChange={(e) => setSaveReturnAddr(e.target.checked)}
                      className="mt-0.5 rounded border-gray-300 text-custom-button focus:ring-custom-button/30"
                    />
                    <label htmlFor="saveReturnAddr" className="text-xs text-gray-600">
                      Save this address for future orders
                    </label>
                  </div>
                  {saveReturnAddr && (
                    <input
                      type="text"
                      value={returnAddrLabel}
                      onChange={(e) => setReturnAddrLabel(e.target.value)}
                      placeholder="Address label (e.g. Head Office, Warehouse)"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-custom-button/30 focus:border-custom-button"
                    />
                  )}
                </div>
              )}

              {/* Order summary */}
              <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                <h4 className="text-sm font-semibold text-blue-900 mb-2">Summary</h4>
                <dl className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <dt className="text-blue-700">Type</dt>
                    <dd className="text-blue-900 font-medium">{orderType === 'visa' ? 'Visa' : 'Legalization'}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-blue-700">Country</dt>
                    <dd className="text-blue-900 font-medium">{selectedCountry ? `${selectedCountry.flag} ${selectedCountry.nameEn || selectedCountry.name}` : '–'}</dd>
                  </div>
                  {orderType === 'legalization' && (
                    <>
                      <div className="flex justify-between">
                        <dt className="text-blue-700">Services</dt>
                        <dd className="text-blue-900 font-medium text-right">
                          {selectedServices.map(s => LEGALIZATION_SERVICES.find(ls => ls.id === s)?.label).join(', ') || '–'}
                        </dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-blue-700">Document</dt>
                        <dd className="text-blue-900 font-medium">{documentType || '–'} × {quantity}</dd>
                      </div>
                    </>
                  )}
                  {orderType === 'visa' && (
                    <div className="flex justify-between">
                      <dt className="text-blue-700">Travelers</dt>
                      <dd className="text-blue-900 font-medium">{travelerCount}</dd>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <dt className="text-blue-700">Courier pickup</dt>
                    <dd className="text-blue-900 font-medium">{needsPickup === true ? 'Yes' : needsPickup === false ? 'No' : '–'}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-blue-700">Courier return</dt>
                    <dd className="text-blue-900 font-medium">{needsReturn === true ? 'Yes' : needsReturn === false ? 'No' : '–'}</dd>
                  </div>
                </dl>
                <p className="text-xs text-blue-600 mt-3 pt-2 border-t border-blue-200">
                  Price will be confirmed after we review your order.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer / Navigation */}
        <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4 rounded-b-2xl flex items-center justify-between">
          <div>
            {step > 1 && (
              <button
                onClick={() => setStep(step === 3 ? 2 : 1)}
                className="text-sm text-gray-500 hover:text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                ← Back
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Step indicators */}
            <div className="flex gap-1.5 mr-3">
              {[1, 2, 3].map((s) => (
                <div
                  key={s}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    s === step ? 'bg-custom-button' : s < step ? 'bg-custom-button/40' : 'bg-gray-200'
                  }`}
                />
              ))}
            </div>

            {step === 2 && (
              <button
                onClick={() => setStep(3)}
                disabled={!canProceedStep2()}
                className="px-5 py-2.5 bg-custom-button text-white text-sm font-medium rounded-lg hover:bg-custom-button/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next →
              </button>
            )}

            {step === 3 && (
              <button
                onClick={handleSubmit}
                disabled={!canSubmit() || submitting}
                className="px-5 py-2.5 bg-custom-button text-white text-sm font-medium rounded-lg hover:bg-custom-button/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Submitting...
                  </span>
                ) : (
                  'Submit order'
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
