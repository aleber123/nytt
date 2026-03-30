/**
 * Customer-facing visa data collection form
 * 
 * Token-based access — customer receives link via email.
 * Dynamic fields based on visa type/country template.
 * Data saved to Firestore and linked to order.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { GetServerSideProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import Head from 'next/head';
import {
  getFormSubmissionByToken,
  getFormTemplate,
  updateFormSubmission,
  VisaFormSubmission,
  VisaFormTemplate,
  FormField,
} from '@/firebase/visaFormService';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/firebase/config';
import AddressAutocomplete from '@/components/ui/AddressAutocomplete';
import type { PassportData } from '@/services/passportService';
import { ALL_COUNTRIES } from '@/components/order/data/countries';


/** Searchable single-country dropdown */
function CountryDropdown({ value, onChange, isEn }: { value: string; onChange: (v: string) => void; isEn: boolean }) {
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = ALL_COUNTRIES.find(c => c.nameEn === value || c.name === value || c.code === value);

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = search.trim()
    ? ALL_COUNTRIES.filter(c => {
        const t = search.toLowerCase();
        return c.name.toLowerCase().includes(t) || (c.nameEn || '').toLowerCase().includes(t) || c.code.toLowerCase().includes(t);
      }).slice(0, 20)
    : ALL_COUNTRIES.slice(0, 20);

  return (
    <div className="relative" ref={ref}>
      <div onClick={() => setOpen(true)} className="w-full px-3 py-2 border border-gray-300 rounded-lg cursor-pointer flex items-center justify-between focus-within:ring-2 focus-within:ring-[#0EB0A6]">
        {selected ? (
          <span className="flex items-center gap-2"><span className="text-xs text-gray-400">({selected.code})</span><span>{isEn ? selected.nameEn : selected.name}</span></span>
        ) : (
          <span className="text-gray-400">{isEn ? 'Select country...' : 'Välj land...'}</span>
        )}
        <span className="text-gray-400">▼</span>
      </div>
      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
          <div className="sticky top-0 bg-white p-2 border-b">
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={isEn ? 'Search country...' : 'Sök land...'} className="w-full px-3 py-2 border border-gray-200 rounded text-sm focus:ring-2 focus:ring-[#0EB0A6]" autoFocus />
          </div>
          {filtered.map(c => (
            <button key={c.code} type="button" onClick={() => { onChange(c.nameEn || c.name); setOpen(false); setSearch(''); }} className={`w-full text-left px-3 py-2 hover:bg-teal-50 flex items-center gap-2 text-sm ${value === c.nameEn || value === c.name ? 'bg-teal-50 font-medium' : ''}`}>
              <span className="text-xs text-gray-400 w-8">({c.code})</span><span>{isEn ? c.nameEn : c.name}</span>
            </button>
          ))}
          {filtered.length === 0 && <p className="px-3 py-2 text-sm text-gray-400">{isEn ? 'No results' : 'Inga resultat'}</p>}
        </div>
      )}
    </div>
  );
}

/** Multi-select country picker with chips */
function CountryMultiSelect({ value, onChange, isEn }: { value: string; onChange: (v: string) => void; isEn: boolean }) {
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selectedNames = (value || '').split(',').map(s => s.trim()).filter(Boolean);

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const toggle = (nameEn: string) => {
    const newList = selectedNames.includes(nameEn) ? selectedNames.filter(c => c !== nameEn) : [...selectedNames, nameEn];
    onChange(newList.join(', '));
  };

  const filtered = search.trim()
    ? ALL_COUNTRIES.filter(c => { const t = search.toLowerCase(); return c.name.toLowerCase().includes(t) || (c.nameEn || '').toLowerCase().includes(t); }).slice(0, 30)
    : ALL_COUNTRIES.slice(0, 30);

  return (
    <div ref={ref}>
      {selectedNames.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {selectedNames.map(name => {
            const country = ALL_COUNTRIES.find(c => c.nameEn === name || c.name === name);
            return (
              <span key={name} className="inline-flex items-center gap-1 px-2 py-1 bg-teal-100 text-teal-800 rounded-full text-xs font-medium cursor-pointer hover:bg-red-100 hover:text-red-700" onClick={() => toggle(name)} title={isEn ? 'Click to remove' : 'Klicka för att ta bort'}>
                ({country?.code}) {name} ×
              </span>
            );
          })}
        </div>
      )}
      <div className="relative">
        <input type="text" value={search} onChange={(e) => { setSearch(e.target.value); setOpen(true); }} onFocus={() => setOpen(true)} placeholder={isEn ? 'Search and click to add countries...' : 'Sök och klicka för att lägga till länder...'} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0EB0A6] focus:border-[#0EB0A6]" />
        {open && (
          <div className="absolute z-50 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-auto">
            {filtered.map(c => {
              const isSel = selectedNames.includes(c.nameEn || c.name);
              return (
                <button key={c.code} type="button" onClick={() => { toggle(c.nameEn || c.name); setSearch(''); }} className={`w-full text-left px-3 py-2 hover:bg-teal-50 flex items-center gap-2 text-sm ${isSel ? 'bg-teal-50 font-medium' : ''}`}>
                  <span className="text-xs text-gray-400 w-8">({c.code})</span><span>{isEn ? c.nameEn : c.name}</span>{isSel && <span className="ml-auto text-teal-600">✓</span>}
                </button>
              );
            })}
            {filtered.length === 0 && <p className="px-3 py-2 text-sm text-gray-400">{isEn ? 'No results' : 'Inga resultat'}</p>}
          </div>
        )}
      </div>
    </div>
  );
}

interface VisaFormPageProps {
  token: string;
}

// Map icon names to emojis
const ICON_MAP: Record<string, string> = {
  'user': '👤',
  'id-card': '📘',
  'plane': '✈️',
  'phone': '📞',
  'map-pin': '📍',
  'users': '👨‍👩‍👧',
  'briefcase': '💼',
  'history': '🕐',
  'shield': '🛡️',
  'home': '🏠',
  'globe': '🌍',
  'calendar': '📅',
  'mail': '📧',
  'flag': '🏳️',
};
const getIcon = (iconName: string) => ICON_MAP[iconName] || iconName;

export default function VisaFormPage({ token }: VisaFormPageProps) {
  const [loading, setLoading] = useState(true);
  const [submission, setSubmission] = useState<VisaFormSubmission | null>(null);
  const [template, setTemplate] = useState<VisaFormTemplate | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [locale, setLocale] = useState<'sv' | 'en'>('sv');
  const [showValidation, setShowValidation] = useState(false);

  // Passport scanner state
  const [passportScanning, setPassportScanning] = useState(false);
  const [passportPreview, setPassportPreview] = useState<string>('');
  const [passportError, setPassportError] = useState<string>('');
  const [passportData, setPassportData] = useState<PassportData | null>(null);
  const [passportAutoFilled, setPassportAutoFilled] = useState(false);
  const passportFileRef = useRef<HTMLInputElement>(null);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const formDataRef = useRef<Record<string, string>>({});

  // Keep formDataRef in sync for auto-save
  useEffect(() => {
    formDataRef.current = formData;
  }, [formData]);

  // Auto-save: debounced 3 seconds after last change
  const triggerAutoSave = useCallback(() => {
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setTimeout(async () => {
      if (!submission || submission.status === 'completed') return;
      try {
        await updateFormSubmission(submission.id, {
          formData: formDataRef.current,
          status: 'partial',
        });
        setSaved(true);
      } catch {
        // Silent fail for auto-save — user can still manually save
      }
    }, 3000);
  }, [submission]);

  // Cleanup auto-save timer on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    };
  }, []);

  useEffect(() => {
    loadForm();
  }, [token]);

  const loadForm = async () => {
    try {
      const sub = await getFormSubmissionByToken(token);
      if (!sub) {
        setError('invalid');
        setLoading(false);
        return;
      }

      if (new Date(sub.expiresAt) < new Date()) {
        setError('expired');
        setLoading(false);
        return;
      }

      setSubmission(sub);

      if (sub.templateId) {
        const tmpl = await getFormTemplate(sub.templateId);
        setTemplate(tmpl);
      }

      // Pre-fill with any existing data
      setFormData(sub.formData || {});
      setLoading(false);
    } catch (err) {
      setError('error');
      setLoading(false);
    }
  };

  const handleFieldChange = (fieldId: string, value: string) => {
    setFormData(prev => ({ ...prev, [fieldId]: value }));
    setSaved(false);
    triggerAutoSave();
  };

  // Passport scan handler
  const handlePassportScan = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setPassportError(locale === 'sv' ? 'Vänligen ladda upp en bildfil (JPG, PNG)' : 'Please upload an image file (JPG, PNG)');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setPassportError(locale === 'sv' ? 'Bilden är för stor. Max 10MB.' : 'Image too large. Maximum 10MB.');
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => setPassportPreview(e.target?.result as string);
    reader.readAsDataURL(file);

    setPassportScanning(true);
    setPassportError('');
    setPassportData(null);
    setPassportAutoFilled(false);

    try {
      // Convert to base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => {
          const result = r.result as string;
          resolve(result.split(',')[1] || result);
        };
        r.onerror = reject;
        r.readAsDataURL(file);
      });

      const response = await fetch('/api/public/passport-scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64, token }),
      });

      const result = await response.json();

      if (result.success && result.data) {
        setPassportData(result.data);
        // Auto-fill form fields from passport data
        const data = result.data as PassportData;
        const autoFill: Record<string, string> = {};

        // Map passport data to form field IDs
        // Supports: common fields, India e-Visa, Angola visa, and other templates
        if (data.surname) {
          autoFill['surname'] = data.surname;
          autoFill['lastName'] = data.surname;
        }
        if (data.givenNames) {
          autoFill['givenName'] = data.givenNames;
          autoFill['firstName'] = data.givenNames.split(' ')[0];
        }
        // Angola: full name field
        if (data.givenNames && data.surname) {
          autoFill['name'] = `${data.givenNames} ${data.surname}`.toUpperCase();
        }
        if (data.dateOfBirth) autoFill['dateOfBirth'] = data.dateOfBirth;
        if (data.gender) {
          autoFill['gender'] = data.gender; // MALE/FEMALE matches India template options
          // Angola: sex field uses M/F
          autoFill['sex'] = data.gender === 'MALE' ? 'M' : data.gender === 'FEMALE' ? 'F' : data.gender;
        }
        if (data.passportNumber) autoFill['passportNumber'] = data.passportNumber;
        if (data.expiryDate) {
          autoFill['dateOfExpiry'] = data.expiryDate;
          autoFill['passportExpiryDate'] = data.expiryDate;
          autoFill['passportValidUntil'] = data.expiryDate; // Angola
        }
        if (data.issuingCountry) {
          autoFill['passportIssuingCountry'] = data.issuingCountry;
          autoFill['countryOfBirth'] = data.issuingCountry;
          autoFill['nationality'] = data.issuingCountry;
          autoFill['presentNationality'] = data.issuingCountry; // Angola
          autoFill['nationalityAtBirth'] = data.issuingCountry; // Angola
          autoFill['issuedIn'] = data.issuingCountry; // Angola: passport issued in
        }
        if (data.personalNumber) {
          autoFill['citizenshipNationalId'] = data.personalNumber;
        }
        if (data.nationality) {
          autoFill['nationality'] = data.nationality;
          autoFill['presentNationality'] = data.nationality; // Angola
          autoFill['nationalityAtBirth'] = data.nationality; // Angola
        }
        if ((data as any).placeOfBirth) {
          autoFill['placeOfBirth'] = (data as any).placeOfBirth; // Angola
          autoFill['townCityOfBirth'] = (data as any).placeOfBirth; // India
        }

        // Fill fields that exist in the template (overwrite existing values with passport data)
        const templateFieldIds = new Set(template?.fields?.map(f => f.id) || []);
        const newFormData = { ...formData };
        let filledCount = 0;
        for (const [fieldId, value] of Object.entries(autoFill)) {
          if (templateFieldIds.has(fieldId) && value) {
            newFormData[fieldId] = value;
            filledCount++;
          }
        }

        if (filledCount > 0) {
          setFormData(newFormData);
          setPassportAutoFilled(true);
          setSaved(false);
        }
      } else {
        setPassportError(result.error || (locale === 'sv' ? 'Kunde inte läsa passdata från bilden.' : 'Could not read passport data from the image.'));
      }
    } catch (err: any) {
      setPassportError(locale === 'sv' ? 'Passskanning misslyckades. Försök igen.' : 'Passport scan failed. Please try again.');
    } finally {
      setPassportScanning(false);
    }
  }, [token, locale, formData, template]);

  const handlePassportDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handlePassportScan(file);
  }, [handlePassportScan]);

  const handleSave = async (isComplete: boolean) => {
    if (!submission) return;
    setSaving(true);
    try {
      await updateFormSubmission(submission.id, {
        formData,
        status: isComplete ? 'completed' : 'partial',
        ...(isComplete ? { completedAt: new Date().toISOString() } : {}),
      });
      setSaved(true);
      if (isComplete) {
        setSubmission(prev => prev ? { ...prev, status: 'completed', completedAt: new Date().toISOString() } : prev);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        // Auto-update processing step to completed (via Admin SDK endpoint)
        try {
          await fetch('/api/public/form-complete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token }),
          });
        } catch {
          // Non-critical — admin can update manually
        }
        
        // Send notification email to admin
        try {
          const customerName = submission.customerName || 'Kund';
          const orderId = submission.orderNumber || submission.orderId || '';
          const fieldSummary = Object.entries(formData)
            .filter(([, v]) => v)
            .map(([k, v]) => {
              const field = template?.fields?.find(f => f.id === k);
              const label = field?.label || k;
              return `<tr><td style="padding:6px 12px;color:#6b7280;font-size:13px;">${label}</td><td style="padding:6px 12px;font-weight:500;color:#1f2937;font-size:13px;">${v}</td></tr>`;
            }).join('');
          
          const adminEmailHtml = `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
  <div style="background:#0EB0A6;padding:16px 20px;text-align:center;">
    <h1 style="color:white;margin:0;font-size:18px;">DOX Visumpartner</h1>
  </div>
  <div style="padding:24px;background:#fff;">
    <h2 style="color:#1f2937;font-size:16px;margin:0 0 12px;">📩 Kunddata mottagen – ${orderId}</h2>
    <p style="color:#4b5563;font-size:14px;">Kunden <strong>${customerName}</strong> har fyllt i formuläret för order <strong>${orderId}</strong>.</p>
    <table style="width:100%;border-collapse:collapse;margin:16px 0;background:#f9fafb;border-radius:6px;overflow:hidden;">
      <thead><tr><th style="padding:8px 12px;text-align:left;background:#e5e7eb;font-size:12px;color:#374151;">Fält</th><th style="padding:8px 12px;text-align:left;background:#e5e7eb;font-size:12px;color:#374151;">Värde</th></tr></thead>
      <tbody>${fieldSummary}</tbody>
    </table>
    <div style="text-align:center;margin:20px 0;">
      <a href="https://doxvl.se/admin/orders/${submission.orderId}" style="display:inline-block;background:#0EB0A6;color:white;padding:10px 24px;border-radius:6px;text-decoration:none;font-weight:600;font-size:14px;">Öppna order</a>
    </div>
  </div>
  <div style="background:#f5f5f5;padding:12px;text-align:center;font-size:11px;color:#999;">DOX Visumpartner AB</div>
</div>`;
          
          const emailsRef = collection(db, 'customerEmails');
          await addDoc(emailsRef, {
            name: 'System',
            email: 'info@doxvl.se,info@visumpartner.se',
            subject: `📩 Kunddata mottagen – ${orderId} (${customerName})`,
            message: adminEmailHtml,
            orderId: submission.orderId,
            createdAt: Timestamp.now(),
            status: 'pending',
          });
        } catch {
          // Non-critical
        }
      }
    } catch {
      alert(locale === 'sv' ? 'Kunde inte spara. Försök igen.' : 'Could not save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const isEn = locale === 'en';

  // Error states
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#0EB0A6] mx-auto mb-4"></div>
          <p className="text-gray-500">Loading form...</p>
        </div>
      </div>
    );
  }

  if (error === 'invalid') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md text-center">
          <p className="text-4xl mb-4">❌</p>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Invalid Link</h1>
          <p className="text-gray-600">This form link is invalid or has already been used. Please contact us if you need a new link.</p>
          <a href="mailto:info@doxvl.se" className="inline-block mt-4 text-[#0EB0A6] hover:underline">info@doxvl.se</a>
        </div>
      </div>
    );
  }

  if (error === 'expired') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md text-center">
          <p className="text-4xl mb-4">⏰</p>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Link Expired</h1>
          <p className="text-gray-600">This form link has expired. Please contact us for a new link.</p>
          <a href="mailto:info@doxvl.se" className="inline-block mt-4 text-[#0EB0A6] hover:underline">info@doxvl.se</a>
        </div>
      </div>
    );
  }

  if (submission?.status === 'completed') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Head>
          <title>Form Submitted - DOX Visumpartner</title>
        </Head>
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md text-center">
          <p className="text-4xl mb-4">✅</p>
          <h1 className="text-xl font-bold text-gray-900 mb-2">
            {isEn ? 'Thank you!' : 'Tack!'}
          </h1>
          <p className="text-gray-600">
            {isEn
              ? 'Your information has been submitted. We will process your visa application shortly.'
              : 'Din information har skickats in. Vi behandlar din visumansökan inom kort.'}
          </p>
          <p className="text-sm text-gray-500 mt-4">
            {isEn ? 'Order' : 'Order'}: #{submission.orderNumber}
          </p>
          <a
            href={`https://doxvl.se/orderstatus?order=${submission.orderNumber}`}
            className="inline-block mt-4 px-6 py-2 bg-[#0EB0A6] text-white rounded-lg hover:bg-[#0c9e95] font-medium"
          >
            {isEn ? 'Track Order' : 'Följ din order'}
          </a>
        </div>
      </div>
    );
  }

  // Build fields from template
  const fields: FormField[] = template?.fields || [];
  const groups = template?.groups || [];

  // Group fields
  const groupedFields: Record<string, FormField[]> = {};
  for (const field of fields) {
    if (!groupedFields[field.group]) groupedFields[field.group] = [];
    groupedFields[field.group].push(field);
  }

  // Sort groups
  const sortedGroups = groups.sort((a, b) => a.sortOrder - b.sortOrder);

  // Validate personnummer format: ÅÅÅÅMMDD-NNNN (12+ chars)
  const isValidPersonnummer = (val: string) => {
    if (!val) return false;
    const cleaned = val.replace(/\s/g, '');
    return /^\d{8}-?\d{4}$/.test(cleaned);
  };

  const personnummerFields = fields.filter(f => f.type === 'personnummer');
  const personnummerErrors = personnummerFields
    .filter(f => f.required && formData[f.id] && !isValidPersonnummer(formData[f.id]))
    .map(f => f.id);

  // Validate phone fields: must contain only digits, +, spaces, dashes
  const isValidPhone = (val: string) => {
    if (!val) return false;
    return /^[\d\s\+\-()]+$/.test(val.trim()) && val.replace(/[^\d]/g, '').length >= 6;
  };
  const phoneFields = fields.filter(f => f.type === 'phone');
  const phoneErrors = phoneFields
    .filter(f => formData[f.id] && !isValidPhone(formData[f.id]))
    .map(f => f.id);

  // Conditional visibility rules (same as in render)
  const conditionRules: Record<string, { parent: string; showWhen: string | string[] }> = {
    previousName: { parent: 'haveYouChangedName', showWhen: 'Yes' },
    otherPassportCountry: { parent: 'anyOtherPassport', showWhen: 'Yes' },
    otherPassportNumber: { parent: 'anyOtherPassport', showWhen: 'Yes' },
    spouseName: { parent: 'maritalStatus', showWhen: 'MARRIED' },
    spouseNationality: { parent: 'maritalStatus', showWhen: 'MARRIED' },
    spousePlaceOfBirth: { parent: 'maritalStatus', showWhen: 'MARRIED' },
    spouseCountryOfBirth: { parent: 'maritalStatus', showWhen: 'MARRIED' },
    previousVisaNo: { parent: 'haveYouVisitedIndiaBefore', showWhen: 'Yes' },
    previousVisaType: { parent: 'haveYouVisitedIndiaBefore', showWhen: 'Yes' },
    previousVisaPlaceOfIssue: { parent: 'haveYouVisitedIndiaBefore', showWhen: 'Yes' },
    previousVisaDateOfIssue: { parent: 'haveYouVisitedIndiaBefore', showWhen: 'Yes' },
    refusedVisaDetails: { parent: 'haveYouBeenRefusedVisa', showWhen: 'Yes' },
    // Angola-specific conditional rules
    dateOfLastEntryInAngola: { parent: 'everTravelledToAngola', showWhen: 'Yes' },
    borderUsed: { parent: 'everTravelledToAngola', showWhen: 'Yes' },
    // DS-160 (USA) conditional rules - Personal
    otherSurname: { parent: 'hasOtherNames', showWhen: 'yes' },
    otherGivenName: { parent: 'hasOtherNames', showWhen: 'yes' },
    otherNationality: { parent: 'hasOtherNationality', showWhen: 'yes' },
    lostPassportExplanation: { parent: 'hasLostPassport', showWhen: 'yes' },
    // DS-160 - Travel (payer details only conditional, travel plan fields always visible)
    payerName: { parent: 'whoPaysTripCost', showWhen: ['OTHER_PERSON', 'COMPANY'] },
    payerRelationship: { parent: 'whoPaysTripCost', showWhen: ['OTHER_PERSON', 'COMPANY'] },
    // DS-160 - Previous US Travel
    lastUSVisitDate: { parent: 'hasBeenToUS', showWhen: 'yes' },
    lastUSVisitLength: { parent: 'hasBeenToUS', showWhen: 'yes' },
    allPreviousUSTrips: { parent: 'hasBeenToUS', showWhen: 'yes' },
    usDriversLicenseState: { parent: 'hasUSDriversLicense', showWhen: 'yes' },
    previousVisaIssueDate: { parent: 'hasHadUSVisa', showWhen: 'yes' },
    previousVisaNumber: { parent: 'hasHadUSVisa', showWhen: 'yes' },
    isSameVisaType: { parent: 'hasHadUSVisa', showWhen: 'yes' },
    hasVisaBeenLostStolen: { parent: 'hasHadUSVisa', showWhen: 'yes' },
    visaRefusalExplanation: { parent: 'hasBeenRefusedVisa', showWhen: 'yes' },
    // DS-160 - Contact (previous email/phone)
    previousEmail: { parent: 'hasPreviousEmail', showWhen: 'yes' },
    previousPhone: { parent: 'hasPreviousPhone', showWhen: 'yes' },
    // DS-160 - Family
    immediateRelativeDetails: { parent: 'hasImmediateRelativesInUS', showWhen: 'yes' },
    spouseSurname: { parent: 'maritalStatus', showWhen: 'MARRIED' },
    spouseGivenName: { parent: 'maritalStatus', showWhen: 'MARRIED' },
    spouseDateOfBirth: { parent: 'maritalStatus', showWhen: 'MARRIED' },
    // spouseNationality already defined above for India form (also used by DS-160)
    // DS-160 - Former spouse (show if divorced, widowed, or separated)
    formerSpouseSurname: { parent: 'hasFormerSpouse', showWhen: 'yes' },
    formerSpouseGivenName: { parent: 'hasFormerSpouse', showWhen: 'yes' },
    formerSpouseDateOfBirth: { parent: 'hasFormerSpouse', showWhen: 'yes' },
    formerSpouseMarriageDate: { parent: 'hasFormerSpouse', showWhen: 'yes' },
    formerSpouseDivorceDate: { parent: 'hasFormerSpouse', showWhen: 'yes' },
    formerSpouseHowMarriageEnded: { parent: 'hasFormerSpouse', showWhen: 'yes' },
    formerSpouseCountryOfBirth: { parent: 'hasFormerSpouse', showWhen: 'yes' },
    formerSpouseNationality: { parent: 'hasFormerSpouse', showWhen: 'yes' },
    // DS-160 - Work (previous employer)
    prevEmployerName: { parent: 'hasPreviousEmployer', showWhen: 'yes' },
    prevEmployerAddress: { parent: 'hasPreviousEmployer', showWhen: 'yes' },
    prevEmployerCity: { parent: 'hasPreviousEmployer', showWhen: 'yes' },
    prevEmployerCountry: { parent: 'hasPreviousEmployer', showWhen: 'yes' },
    prevEmployerPhone: { parent: 'hasPreviousEmployer', showWhen: 'yes' },
    prevEmployerJobTitle: { parent: 'hasPreviousEmployer', showWhen: 'yes' },
    prevEmployerSupervisor: { parent: 'hasPreviousEmployer', showWhen: 'yes' },
    prevEmployerStartDate: { parent: 'hasPreviousEmployer', showWhen: 'yes' },
    prevEmployerEndDate: { parent: 'hasPreviousEmployer', showWhen: 'yes' },
    prevEmployerDuties: { parent: 'hasPreviousEmployer', showWhen: 'yes' },
    // DS-160 - Additional Information
    educationInstitutionName: { parent: 'hasAttendedEducation', showWhen: 'yes' },
    educationAddress: { parent: 'hasAttendedEducation', showWhen: 'yes' },
    educationCity: { parent: 'hasAttendedEducation', showWhen: 'yes' },
    educationCountry: { parent: 'hasAttendedEducation', showWhen: 'yes' },
    educationCourseOfStudy: { parent: 'hasAttendedEducation', showWhen: 'yes' },
    educationDateFrom: { parent: 'hasAttendedEducation', showWhen: 'yes' },
    educationDateTo: { parent: 'hasAttendedEducation', showWhen: 'yes' },
    countriesVisitedLast5Years: { parent: 'hasTraveledLast5Years', showWhen: 'yes' },
    organizationNames: { parent: 'belongsToOrganizations', showWhen: 'yes' },
    militaryDetails: { parent: 'hasServedInMilitary', showWhen: 'yes' },
    // DS-160 - Security
    securityExplanation: { parent: 'securityDisease', showWhen: 'yes' },
  };

  const isFieldVisible = (fieldId: string) => {
    const cond = conditionRules[fieldId];
    if (!cond) return true;
    const parentValue = formData[cond.parent] || '';
    if (Array.isArray(cond.showWhen)) {
      return cond.showWhen.includes(parentValue);
    }
    return parentValue === cond.showWhen;
  };

  const missingRequiredFields = fields
    .filter(f => f.required && isFieldVisible(f.id) && !formData[f.id]?.trim())
    .map(f => f.id);

  const requiredFieldsMissing = missingRequiredFields.length > 0;
  const hasValidationErrors = requiredFieldsMissing || personnummerErrors.length > 0 || phoneErrors.length > 0;

  return (
    <>
      <Head>
        <title>{isEn ? 'Visa Application Form' : 'Visumansökan'} - DOX Visumpartner</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto px-4">
          {/* Header */}
          <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {isEn ? 'Visa Application Form' : 'Visumansökan'}
                </h1>
                <p className="text-gray-600 mt-1">
                  {isEn ? 'Order' : 'Order'}: #{submission?.orderNumber}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setLocale('sv')}
                  className={`px-3 py-1 rounded text-sm ${locale === 'sv' ? 'bg-blue-100 text-blue-800 font-medium' : 'text-gray-500 hover:bg-gray-100'}`}
                >
                  🇸🇪 SV
                </button>
                <button
                  onClick={() => setLocale('en')}
                  className={`px-3 py-1 rounded text-sm ${locale === 'en' ? 'bg-blue-100 text-blue-800 font-medium' : 'text-gray-500 hover:bg-gray-100'}`}
                >
                  🇬🇧 EN
                </button>
              </div>
            </div>
            <p className="text-sm text-gray-500">
              {isEn
                ? 'Please fill in the information below. Fields marked with * are required. You can save your progress and return later.'
                : 'Vänligen fyll i informationen nedan. Fält markerade med * är obligatoriska. Du kan spara och återkomma senare.'}
            </p>

            {/* Progress bar */}
            {template && (() => {
              const visibleRequired = fields.filter(f => f.required && isFieldVisible(f.id));
              const filledRequired = visibleRequired.filter(f => formData[f.id]?.trim());
              const pct = visibleRequired.length > 0 ? Math.round((filledRequired.length / visibleRequired.length) * 100) : 0;
              return (
                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                    <span>{isEn ? 'Progress' : 'Framsteg'}</span>
                    <span className="font-medium">{filledRequired.length}/{visibleRequired.length} {isEn ? 'required fields' : 'obligatoriska fält'} ({pct}%)</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ${pct === 100 ? 'bg-green-500' : 'bg-[#0EB0A6]'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })()}
          </div>

          {/* No template */}
          {!template && (
            <div className="bg-white rounded-xl shadow-sm border p-8 text-center">
              <p className="text-4xl mb-4">📋</p>
              <p className="text-gray-600">
                {isEn
                  ? 'No form template configured for this visa type yet. Please contact us.'
                  : 'Inget formulär konfigurerat för denna visumtyp ännu. Kontakta oss.'}
              </p>
            </div>
          )}

          {/* Passport Scanner Section */}
          {template && (
            <div className="bg-white rounded-xl shadow-sm border p-6 mb-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <span>📷</span>
                {isEn ? 'Scan Your Passport' : 'Skanna ditt pass'}
              </h2>
              <p className="text-sm text-gray-500 mb-4">
                {isEn
                  ? 'Upload a photo of your passport to automatically fill in your personal details. Make sure the photo page with the MRZ (machine readable zone) at the bottom is clearly visible.'
                  : 'Ladda upp ett foto av ditt pass för att automatiskt fylla i dina personuppgifter. Se till att fotosidan med MRZ-zonen (maskinläsbar zon) längst ner syns tydligt.'}
              </p>

              <div
                onDrop={handlePassportDrop}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => passportFileRef.current?.click()}
                className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                  passportScanning ? 'border-[#0EB0A6] bg-teal-50' : 'border-gray-300 hover:border-[#0EB0A6] hover:bg-teal-50'
                }`}
              >
                <input
                  ref={passportFileRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handlePassportScan(file);
                  }}
                />
                {passportScanning ? (
                  <div className="py-2">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#0EB0A6] mx-auto mb-3"></div>
                    <p className="text-sm text-[#0EB0A6] font-medium">
                      {isEn ? 'Scanning passport...' : 'Skannar pass...'}
                    </p>
                  </div>
                ) : passportPreview ? (
                  <div>
                    <img src={passportPreview} alt="Passport" className="max-h-40 mx-auto rounded-lg mb-3 shadow-sm" />
                    <p className="text-xs text-gray-500">
                      {isEn ? 'Click to upload a different image' : 'Klicka för att ladda upp en annan bild'}
                    </p>
                  </div>
                ) : (
                  <div className="py-4">
                    <p className="text-3xl mb-2">📷</p>
                    <p className="text-sm font-medium text-gray-700">
                      {isEn ? 'Drop passport photo here or click to upload' : 'Dra och släpp passfoto här eller klicka för att ladda upp'}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {isEn ? 'JPG/PNG, max 10MB — photo page with MRZ visible' : 'JPG/PNG, max 10MB — fotosida med MRZ synlig'}
                    </p>
                  </div>
                )}
              </div>

              {/* Passport scan error */}
              {passportError && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-700">{passportError}</p>
                </div>
              )}

              {/* Passport scan success */}
              {passportAutoFilled && passportData && (
                <div className="mt-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">✅</span>
                    <p className="text-sm font-medium text-green-800">
                      {isEn ? 'Passport data extracted and fields auto-filled!' : 'Passdata extraherad och fält automatiskt ifyllda!'}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-green-700">
                    {passportData.surname && <p><span className="font-medium">{isEn ? 'Surname' : 'Efternamn'}:</span> {passportData.surname}</p>}
                    {passportData.givenNames && <p><span className="font-medium">{isEn ? 'Given names' : 'Förnamn'}:</span> {passportData.givenNames}</p>}
                    {passportData.passportNumber && <p><span className="font-medium">{isEn ? 'Passport no.' : 'Passnr'}:</span> {passportData.passportNumber}</p>}
                    {passportData.dateOfBirth && <p><span className="font-medium">{isEn ? 'Date of birth' : 'Födelsedatum'}:</span> {passportData.dateOfBirth}</p>}
                    {passportData.gender && <p><span className="font-medium">{isEn ? 'Gender' : 'Kön'}:</span> {passportData.gender}</p>}
                    {passportData.expiryDate && <p><span className="font-medium">{isEn ? 'Expiry' : 'Giltig t.o.m.'}:</span> {passportData.expiryDate}</p>}
                    {passportData.nationality && <p><span className="font-medium">{isEn ? 'Nationality' : 'Nationalitet'}:</span> {passportData.nationality}</p>}
                  </div>
                  <p className="text-xs text-green-600 mt-2">
                    {isEn
                      ? 'Please review the auto-filled fields below and correct any errors.'
                      : 'Vänligen granska de automatiskt ifyllda fälten nedan och korrigera eventuella fel.'}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Form fields grouped */}
          {template && sortedGroups.map(group => {
            const groupFields = groupedFields[group.id];
            if (!groupFields || groupFields.length === 0) return null;

            return (
              <div key={group.id} className="bg-white rounded-xl shadow-sm border p-4 sm:p-6 mb-4">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <span>{getIcon(group.icon)}</span>
                  {isEn ? group.labelEn : group.label}
                  {(() => {
                    const gRequired = groupFields.filter(f => f.required && isFieldVisible(f.id));
                    const gFilled = gRequired.filter(f => formData[f.id]?.trim());
                    if (gRequired.length === 0) return null;
                    if (gFilled.length === gRequired.length) return <span className="ml-auto text-green-500 text-sm">✓</span>;
                    return <span className="ml-auto text-xs text-gray-400 font-normal">{gFilled.length}/{gRequired.length}</span>;
                  })()}
                </h2>
                <div className="space-y-4">
                  {groupFields
                    .sort((a, b) => a.sortOrder - b.sortOrder)
                    .filter(field => isFieldVisible(field.id))
                    .map(field => {
                      const isMissing = showValidation && field.required && !formData[field.id]?.trim();
                      return (
                      <div key={field.id} data-field-id={field.id} className={isMissing ? 'ring-1 ring-red-300 rounded-lg p-3 -m-1 bg-red-50/30' : ''}>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {isEn ? field.labelEn : field.label}
                          {field.required && <span className="text-red-500 ml-1">*</span>}
                        </label>
                        {isMissing && (
                          <p className="text-xs text-red-500 mb-1">{isEn ? 'This field is required' : 'Detta fält är obligatoriskt'}</p>
                        )}
                        {(field.helpText || field.helpTextEn) && (
                          <p className="text-xs text-gray-500 mb-1">
                            {isEn ? field.helpTextEn : field.helpText}
                          </p>
                        )}
                        {field.type === 'select' ? (
                          <select
                            value={formData[field.id] || ''}
                            onChange={(e) => handleFieldChange(field.id, e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0EB0A6] focus:border-[#0EB0A6]"
                          >
                            <option value="">{isEn ? 'Select...' : 'Välj...'}</option>
                            {field.options?.map(opt => (
                              <option key={opt.value} value={opt.value}>
                                {isEn ? opt.labelEn : opt.label}
                              </option>
                            ))}
                          </select>
                        ) : field.type === 'textarea' ? (
                          <textarea
                            value={formData[field.id] || ''}
                            onChange={(e) => handleFieldChange(field.id, e.target.value)}
                            rows={3}
                            placeholder={isEn ? field.placeholderEn : field.placeholder}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0EB0A6] focus:border-[#0EB0A6]"
                          />
                        ) : field.type === 'checkbox' ? (
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={formData[field.id] === 'true'}
                              onChange={(e) => handleFieldChange(field.id, e.target.checked ? 'true' : 'false')}
                              className="rounded border-gray-300 text-[#0EB0A6] focus:ring-[#0EB0A6]"
                            />
                            <span className="text-sm text-gray-700">
                              {isEn ? field.placeholderEn || field.labelEn : field.placeholder || field.label}
                            </span>
                          </label>
                        ) : ['countryOfBirth', 'nationality', 'passportIssuingCountry', 'fatherNationality', 'motherNationality', 'spouseNationality', 'fatherCountryOfBirth', 'motherCountryOfBirth', 'spouseCountryOfBirth', 'otherPassportCountry', 'presentNationality', 'nationalityAtBirth', 'fathersNationality', 'mothersNationality'].includes(field.id) ? (
                          <CountryDropdown
                            value={formData[field.id] || ''}
                            onChange={(v) => handleFieldChange(field.id, v)}
                            isEn={isEn}
                          />
                        ) : field.id === 'countriesVisited' || field.id === 'countriesVisitedInLast10Years' ? (
                          <CountryMultiSelect
                            value={formData[field.id] || ''}
                            onChange={(v) => handleFieldChange(field.id, v)}
                            isEn={isEn}
                          />
                        ) : field.type === 'text' && ['streetAddress', 'address', 'houseNoStreet', 'employerAddress', 'referenceAddressInHomeCountry', 'road', 'lodgingRoad', 'responsibleRoad'].includes(field.id) ? (
                          <AddressAutocomplete
                            value={formData[field.id] || ''}
                            onChange={(val) => handleFieldChange(field.id, val)}
                            onSelect={(data) => {
                              if (data.street) handleFieldChange(field.id, data.street);
                              // Auto-fill postal code, city, state — try multiple possible field IDs
                              const templateFieldIds = new Set(template?.fields?.map(f => f.id) || []);
                              if (data.postalCode) {
                                const pcField = ['postalCode', 'postalcode', 'zipCode'].find(id => templateFieldIds.has(id));
                                if (pcField) handleFieldChange(pcField, data.postalCode);
                              }
                              if (data.city) {
                                const cityField = ['city', 'village'].find(id => templateFieldIds.has(id));
                                if (cityField) handleFieldChange(cityField, data.city);
                                // Angola: auto-fill lodging city when lodging address is selected
                                if (field.id === 'lodgingRoad' && templateFieldIds.has('lodgingCity')) {
                                  handleFieldChange('lodgingCity', data.city);
                                }
                              }
                              // Also try to fill state/region from formatted address
                              if ((data as any).state) {
                                const stateField = ['placeOfResidenceState', 'state'].find(id => templateFieldIds.has(id));
                                if (stateField) handleFieldChange(stateField, (data as any).state);
                              }
                            }}
                            placeholder={isEn ? (field.placeholderEn || 'Search address...') : (field.placeholder || 'Sök adress...')}
                            className="rounded-lg focus:ring-2 focus:ring-[#0EB0A6] focus:border-[#0EB0A6]"
                            required={field.required}
                            countryRestriction={['lodgingRoad', 'responsibleRoad'].includes(field.id) ? ['ao'] : ['se', 'dk', 'no', 'fi', 'de', 'gb', 'us']}
                          />
                        ) : (
                          <>
                            <input
                              type={field.type === 'personnummer' ? 'text' : field.type === 'phone' ? 'tel' : field.type}
                              inputMode={field.type === 'phone' ? 'tel' : undefined}
                              value={formData[field.id] || ''}
                              onChange={(e) => handleFieldChange(field.id, e.target.value)}
                              placeholder={isEn ? field.placeholderEn || (field.type === 'phone' ? 'e.g. +46701234567' : undefined) : field.placeholder || (field.type === 'phone' ? 't.ex. +46701234567' : undefined)}
                              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#0EB0A6] focus:border-[#0EB0A6] ${
                                personnummerErrors.includes(field.id) || phoneErrors.includes(field.id) ? 'border-red-400 bg-red-50' : 'border-gray-300'
                              }`}
                            />
                            {personnummerErrors.includes(field.id) && (
                              <p className="text-xs text-red-600 mt-1">
                                {isEn ? 'Must be in format YYYYMMDD-NNNN (e.g. 19900101-1234)' : 'Måste vara i formatet ÅÅÅÅMMDD-NNNN (t.ex. 19900101-1234)'}
                              </p>
                            )}
                            {phoneErrors.includes(field.id) && (
                              <p className="text-xs text-red-600 mt-1">
                                {isEn ? 'Please enter a valid phone number (digits only, e.g. +46701234567)' : 'Ange ett giltigt telefonnummer (endast siffror, t.ex. +46701234567)'}
                              </p>
                            )}
                          </>
                        )}
                      </div>
                    );
                    })}
                </div>
              </div>
            );
          })}

          {/* Actions */}
          {template && (
            <div className="bg-white rounded-xl shadow-sm border p-6 mb-8">
              <div className="flex items-center justify-between">
                <div>
                  {saved && (
                    <p className="text-sm text-green-600 flex items-center gap-1">
                      <span>✓</span> {isEn ? 'Saved' : 'Sparat'}
                    </p>
                  )}
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => handleSave(false)}
                    disabled={saving}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium text-sm disabled:opacity-50"
                  >
                    {saving ? '...' : isEn ? 'Save Draft' : 'Spara utkast'}
                  </button>
                  <button
                    onClick={() => {
                      if (hasValidationErrors) {
                        setShowValidation(true);
                        // Scroll to first missing field
                        const firstMissing = missingRequiredFields[0] || personnummerErrors[0] || phoneErrors[0];
                        if (firstMissing) {
                          const el = document.querySelector(`[data-field-id="${firstMissing}"]`);
                          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }
                        return;
                      }
                      handleSave(true);
                    }}
                    disabled={saving}
                    className="px-6 py-2 bg-[#0EB0A6] text-white rounded-lg hover:bg-[#0c9e95] font-medium text-sm disabled:opacity-50"
                  >
                    {saving ? '...' : isEn ? 'Submit' : 'Skicka in'}
                  </button>
                  {showValidation && requiredFieldsMissing && (
                    <p className="text-sm text-red-500 mt-2">
                      {isEn
                        ? `${missingRequiredFields.length} required field(s) missing. Please scroll up and fill in the highlighted fields.`
                        : `${missingRequiredFields.length} obligatoriska fält saknas. Vänligen scrolla upp och fyll i de markerade fälten.`}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="text-center text-sm text-gray-500 pb-8">
            <p>DOX Visumpartner AB</p>
            <p>
              {isEn ? 'Questions?' : 'Frågor?'}{' '}
              <a href="mailto:info@doxvl.se" className="text-[#0EB0A6] hover:underline">info@doxvl.se</a>
              {' | '}
              <a href="tel:+4684094190" className="text-[#0EB0A6] hover:underline">08-409 419 00</a>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ params, locale }) => {
  const i18nConfig = {
    i18n: { defaultLocale: 'sv', locales: ['sv', 'en'], localeDetection: false as const },
  };
  return {
    props: {
      token: params?.token || '',
      ...(await serverSideTranslations(locale || 'sv', ['common'], i18nConfig)),
    },
  };
};
