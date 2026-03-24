// @ts-nocheck
/**
 * FormFillTab — Admin tab for manually filling visa application forms
 * 
 * Allows handlers to:
 * 1. See the order's country/visa type
 * 2. Pre-fill from existing form submission data or enter data manually
 * 3. Generate auto-fill scripts for the correct embassy website (Brazil, India, Angola, etc.)
 * 4. Copy the script to clipboard and open the embassy website
 * 
 * Works independently of whether the customer purchased a form-fill addon.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { getFormSubmissionsForOrder, getTemplateForProduct, DEFAULT_FIELD_GROUPS } from '@/firebase/visaFormService';
import type { VisaFormTemplate, FormField as TemplateFormField } from '@/firebase/visaFormService';
import { buildBrazilVisaDataFromOrder, generateBrazilAutoFillScript, generateBrazilSectionScripts } from '@/services/formAutomation/brazilVisaAutofill';
import type { SectionScript } from '@/services/formAutomation/brazilVisaAutofill';
import { generateDS160CompleteScript, buildDS160DataFromOrder } from '@/services/formAutomation/usaDS160Autofill';
import { toast } from 'react-hot-toast';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { updateVisaOrder } from '@/firebase/visaOrderService';
import { extractPassportData, extractPersonbevisData, extractCriminalRecordData, COUNTRY_CODE_MAP } from '@/services/passportOcrService';
import SendVisaFormButton from './SendVisaFormButton';

type OcrStatus = { progress: number | null; result: string | null };

interface UploadedDoc {
  id: string;
  label: string;
  fileName: string;
  downloadURL: string;
  storagePath: string;
  uploadedAt: string;
}

// Country-specific config: embassy URLs, script generators, etc.
const COUNTRY_CONFIG: Record<string, {
  label: string;
  flag: string;
  websiteUrl: string;
  websiteLabel: string;
  color: string; // tailwind color prefix
  hasAutoFill: boolean;
  instructions: string[];
}> = {
  BR: {
    label: 'Brazil',
    flag: '🇧🇷',
    websiteUrl: 'https://formulario-mre.serpro.gov.br/',
    websiteLabel: 'Brazilian DPVN Visa Application',
    color: 'green',
    hasAutoFill: true,
    instructions: [
      'Open the DPVN website and start a new application',
      'Select traveler and click "Copy Script"',
      'Paste the script in the browser console (F12 → Console)',
      'Navigate to each tab and run the corresponding function:',
      '  fillGeneralData() → fillVisaData() → fillDocuments()',
      '  fillProfessionalData() → fillContacts() → fillBiometricData()',
      'Upload files manually: passport photo, passport copy, criminal record, personbevis',
    ],
  },
  IN: {
    label: 'India',
    flag: '🇮🇳',
    websiteUrl: 'https://indianvisaonline.gov.in/visa/index.html',
    websiteLabel: 'Indian e-Visa Application',
    color: 'orange',
    hasAutoFill: true,
    instructions: [
      'Open the Indian e-Visa website',
      'Select traveler and click "Copy Script"',
      'Paste the script in the browser console',
      'Upload passport photo and passport copy manually',
    ],
  },
  AO: {
    label: 'Angola',
    flag: '🇦🇴',
    websiteUrl: '',
    websiteLabel: 'Angola Visa PDF (download)',
    color: 'red',
    hasAutoFill: false,
    instructions: [
      'Use the "Download PDF" button in the Processing tab to generate a filled PDF',
      'Print the PDF and submit to the embassy',
    ],
  },
  US: {
    label: 'USA',
    flag: '🇺🇸',
    websiteUrl: 'https://ceac.state.gov/genniv/',
    websiteLabel: 'DS-160 Visa Application',
    color: 'blue',
    hasAutoFill: true,
    instructions: [
      'Collect customer data via the DS-160 form link sent to customer',
      'Open the DS-160 website and start a new application',
      'Copy the auto-fill script and paste in browser console (F12 → Console)',
      'Run fillAll() on each page, or use specific functions like fillPersonal1()',
      'Upload passport photo manually (must meet strict US requirements)',
      'Save the application ID and confirmation page',
    ],
  },
};

interface FormFillTabProps {
  order: any;
  orderId: string;
}

export default function FormFillTab({ order, orderId }: FormFillTabProps) {
  const [formData, setFormData] = useState<Record<string, string> | null>(null);
  const [loadingFormData, setLoadingFormData] = useState(true);
  const [manualFields, setManualFields] = useState<Record<string, string>>({});
  const [selectedTraveler, setSelectedTraveler] = useState(0);
  const [scriptCopied, setScriptCopied] = useState(false);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [uploadedDocs, setUploadedDocs] = useState<UploadedDoc[]>([]);
  const [uploading, setUploading] = useState<string | null>(null);
  const [ocrStatuses, setOcrStatuses] = useState<Record<string, OcrStatus>>({});
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const [templateFieldGroups, setTemplateFieldGroups] = useState<FieldGroup[] | null>(null);
  const [loadingTemplate, setLoadingTemplate] = useState(false);
  const [matchedTemplateName, setMatchedTemplateName] = useState<string>('');

  const countryCode = order.destinationCountryCode || '';
  const countryConfig = COUNTRY_CONFIG[countryCode] || null;
  const travelers = order.travelers || [];
  const traveler = travelers[selectedTraveler];
  const hasHardcodedFields = countryCode === 'BR';

  // Dynamically load template fields for countries without hardcoded config
  useEffect(() => {
    if (hasHardcodedFields) return; // BR has hardcoded fields
    const loadTemplate = async () => {
      setLoadingTemplate(true);
      try {
        const visaCategory = order.visaProduct?.category || order.visaCategory || '';
        const productId = order.visaProduct?.id || '';
        const template = await getTemplateForProduct(countryCode || 'all', visaCategory, productId);
        if (template && template.fields.length > 0) {
          setMatchedTemplateName(template.nameEn || template.name);
          // Convert template fields to FieldGroup[] format
          const groupMap: Record<string, FieldGroup> = {};
          const groupInfo = template.groups?.length > 0 ? template.groups : DEFAULT_FIELD_GROUPS;
          template.fields
            .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
            .forEach((f) => {
              const gid = f.group || 'other';
              if (!groupMap[gid]) {
                const gi = groupInfo.find(g => g.id === gid);
                groupMap[gid] = {
                  id: gid,
                  label: gi?.labelEn || gi?.label || gid,
                  icon: gi?.icon || '📝',
                  fields: [],
                };
              }
              groupMap[gid].fields.push({
                id: f.id,
                label: f.labelEn || f.label,
                type: f.type === 'select' ? 'select' : f.type === 'date' ? 'date' : f.type === 'textarea' ? 'textarea' : f.type === 'number' ? 'number' : 'text',
                required: f.required,
                placeholder: f.placeholderEn || f.placeholder || '',
                helpText: f.helpTextEn || f.helpText || '',
                options: f.options?.map(o => ({ value: o.value, label: o.labelEn || o.label })),
              });
            });
          // Sort groups by their original order
          const sortedGroups = groupInfo
            .filter(gi => groupMap[gi.id])
            .map(gi => groupMap[gi.id]);
          // Add any groups not in groupInfo
          Object.keys(groupMap).forEach(gid => {
            if (!sortedGroups.find(g => g.id === gid)) sortedGroups.push(groupMap[gid]);
          });
          setTemplateFieldGroups(sortedGroups);
        } else {
          setTemplateFieldGroups(null);
          setMatchedTemplateName('');
        }
      } catch {
        setTemplateFieldGroups(null);
      } finally {
        setLoadingTemplate(false);
      }
    };
    loadTemplate();
  }, [countryCode, hasHardcodedFields, order.visaProduct?.category, order.visaCategory, order.visaProduct?.id]);

  // Fetch existing form submission data
  useEffect(() => {
    const fetchData = async () => {
      setLoadingFormData(true);
      try {
        let submissions = await getFormSubmissionsForOrder(orderId);
        if (submissions.length === 0 && order.orderNumber) {
          submissions = await getFormSubmissionsForOrder(order.orderNumber);
        }
        const completed = submissions.find((s: any) => s.status === 'completed') || submissions.find((s: any) => s.status === 'partial');
        if (completed?.formData) {
          setFormData(completed.formData);
        }
      } catch {
        // Non-critical
      } finally {
        setLoadingFormData(false);
      }
    };
    fetchData();
  }, [orderId, order.orderNumber]);

  // Load previously uploaded docs from order
  useEffect(() => {
    if (order.formFillDocuments) {
      setUploadedDocs(order.formFillDocuments);
    }
  }, [order.formFillDocuments]);

  // Upload a document to Firebase Storage
  const handleFileUpload = async (docId: string, label: string, file: File) => {
    setUploading(docId);
    try {
      const storage = getStorage();
      const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const storagePath = `visa-documents/${orderId}_formfill_${docId}_${selectedTraveler}_${cleanName}`;
      const storageRef = ref(storage, storagePath);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);

      const newDoc: UploadedDoc = {
        id: `${docId}_${selectedTraveler}`,
        label,
        fileName: file.name,
        downloadURL,
        storagePath,
        uploadedAt: new Date().toISOString(),
      };

      const updated = [...uploadedDocs.filter(d => d.id !== newDoc.id), newDoc];
      setUploadedDocs(updated);

      // Save to order
      await updateVisaOrder(orderId, { formFillDocuments: updated });
      toast.success(`${label} uploaded`);

      // Run OCR for scannable documents
      if (docId === 'passportCopy' || docId === 'personbevis' || docId === 'criminalRecord') {
        await runOcrForDocument(docId, file);
      }
    } catch (err: any) {
      toast.error(`Upload failed: ${err.message || 'Unknown error'}`);
    } finally {
      setUploading(null);
    }
  };

  // Run OCR for a specific document type and auto-fill fields
  const runOcrForDocument = async (docId: string, file: File) => {
    setOcrStatuses(prev => ({ ...prev, [docId]: { progress: 0, result: null } }));
    const updateProgress = (p: number) => setOcrStatuses(prev => ({ ...prev, [docId]: { ...prev[docId], progress: p } }));
    const docLabels: Record<string, string> = { passportCopy: 'Passport', personbevis: 'Personbevis', criminalRecord: 'Criminal Record' };
    toast(`\ud83d\udd0d Scanning ${docLabels[docId] || docId}...`, { duration: 4000 });

    try {
      const fieldsToFill: Record<string, string> = {};

      if (docId === 'passportCopy') {
        const ocrData = await extractPassportData(file, updateProgress);
        if (ocrData.success) {
          if (ocrData.givenNames) { fieldsToFill['givenNames'] = ocrData.givenNames; fieldsToFill['firstName'] = ocrData.givenNames; }
          if (ocrData.familyNames) { fieldsToFill['familyNames'] = ocrData.familyNames; fieldsToFill['lastName'] = ocrData.familyNames; }
          if (ocrData.passportNumber) fieldsToFill['passportNumber'] = ocrData.passportNumber;
          if (ocrData.dateOfBirth) fieldsToFill['dateOfBirth'] = ocrData.dateOfBirth;
          if (ocrData.dateOfExpiry) fieldsToFill['passportDateOfExpiry'] = ocrData.dateOfExpiry;
          if (ocrData.gender) fieldsToFill['sex'] = ocrData.gender;
          if (ocrData.nationality) fieldsToFill['nationality'] = COUNTRY_CODE_MAP[ocrData.nationality] || ocrData.nationality;
          if (ocrData.issuingCountry) fieldsToFill['passportIssuedBy'] = COUNTRY_CODE_MAP[ocrData.issuingCountry] || ocrData.issuingCountry;
        } else {
          setOcrStatuses(prev => ({ ...prev, [docId]: { progress: null, result: `\u26a0\ufe0f ${ocrData.error || 'Could not read passport'}` } }));
          toast.error(ocrData.error || 'Could not read passport MRZ');
          return;
        }
      } else if (docId === 'personbevis') {
        const ocrData = await extractPersonbevisData(file, updateProgress);
        if (ocrData.success) {
          if (ocrData.givenNames) { fieldsToFill['givenNames'] = ocrData.givenNames; fieldsToFill['firstName'] = ocrData.givenNames; }
          if (ocrData.familyNames) { fieldsToFill['familyNames'] = ocrData.familyNames; fieldsToFill['lastName'] = ocrData.familyNames; }
          if (ocrData.dateOfBirth) fieldsToFill['dateOfBirth'] = ocrData.dateOfBirth;
          if (ocrData.maritalStatus) fieldsToFill['maritalStatus'] = ocrData.maritalStatus;
          if (ocrData.address) fieldsToFill['permanentAddressStreet'] = ocrData.address;
          if (ocrData.postalCode) fieldsToFill['permanentAddressZip'] = ocrData.postalCode;
          if (ocrData.city) fieldsToFill['permanentAddressCity'] = ocrData.city;
          if (ocrData.placeOfBirth) fieldsToFill['placeOfBirthCity'] = ocrData.placeOfBirth;
          if (ocrData.citizenship) fieldsToFill['nationality'] = ocrData.citizenship;
          if (ocrData.county) fieldsToFill['permanentAddressState'] = ocrData.county;
          // Personbevis is always Swedish — set country of residence
          fieldsToFill['permanentAddressCountry'] = 'Sweden';
          fieldsToFill['placeOfBirthCountry'] = 'Sweden';
          // Auto-fill email/phone from order data (not in personbevis)
          if (order.customerInfo?.email) fieldsToFill['email'] = order.customerInfo.email;
          if (order.customerInfo?.phone) fieldsToFill['phone'] = order.customerInfo.phone;
        } else {
          setOcrStatuses(prev => ({ ...prev, [docId]: { progress: null, result: `\u26a0\ufe0f ${ocrData.error || 'Could not read personbevis'}` } }));
          toast.error(ocrData.error || 'Could not read personbevis');
          return;
        }
      } else if (docId === 'criminalRecord') {
        const ocrData = await extractCriminalRecordData(file, updateProgress);
        if (ocrData.success) {
          if (ocrData.dateOfBirth) fieldsToFill['dateOfBirth'] = ocrData.dateOfBirth;
          // Split fullName if available
          if (ocrData.fullName) {
            const parts = ocrData.fullName.split(/,\s*/);
            if (parts.length === 2) {
              fieldsToFill['familyNames'] = parts[0].trim();
              fieldsToFill['lastName'] = parts[0].trim();
              fieldsToFill['givenNames'] = parts[1].trim();
              fieldsToFill['firstName'] = parts[1].trim();
            }
          }
        } else {
          setOcrStatuses(prev => ({ ...prev, [docId]: { progress: null, result: `\u26a0\ufe0f ${ocrData.error || 'Could not read criminal record'}` } }));
          toast.error(ocrData.error || 'Could not read criminal record');
          return;
        }
      }

      const count = Object.keys(fieldsToFill).length;
      if (count > 0) {
        setManualFields(prev => ({ ...prev, ...fieldsToFill }));
        setOcrStatuses(prev => ({ ...prev, [docId]: { progress: null, result: `\u2705 Extracted ${count} fields` } }));
        toast.success(`${docLabels[docId]} scanned \u2014 ${count} fields auto-filled!`);
      } else {
        setOcrStatuses(prev => ({ ...prev, [docId]: { progress: null, result: '\u26a0\ufe0f No fields extracted' } }));
      }
    } catch (ocrErr: any) {
      setOcrStatuses(prev => ({ ...prev, [docId]: { progress: null, result: `\u274c OCR failed: ${ocrErr.message}` } }));
      toast.error('Document scan failed');
    }
  };

  // Merge form submission data + manual overrides into a single data object
  const getMergedData = useCallback(() => {
    const merged: Record<string, string> = {};
    // Start with form submission data
    if (formData) {
      Object.entries(formData).forEach(([k, v]) => {
        merged[k] = v;
      });
    }
    // Override with manual fields
    Object.entries(manualFields).forEach(([k, v]) => {
      if (v.trim()) merged[k] = v;
    });
    return merged;
  }, [formData, manualFields]);

  // Get a field value (manual override > form data > traveler/order data)
  const getFieldValue = useCallback((fieldId: string, fallback = '') => {
    if (manualFields[fieldId]?.trim()) return manualFields[fieldId];
    const idx = selectedTraveler;
    if (formData) {
      const indexed = formData[`${fieldId}_${idx}`];
      if (indexed) return indexed;
      const plain = formData[fieldId];
      if (plain) return plain;
    }
    return fallback;
  }, [manualFields, formData, selectedTraveler]);

  const updateField = (fieldId: string, value: string) => {
    setManualFields(prev => ({ ...prev, [fieldId]: value }));
  };

  // Generate and copy full script (legacy)
  const handleCopyScript = async () => {
    if (countryCode === 'BR') {
      const mergedData = getMergedData();
      const data = buildBrazilVisaDataFromOrder(order, selectedTraveler, mergedData, uploadedDocs);
      if (!data) {
        toast.error('Could not build visa data for this traveler');
        return;
      }
      const script = generateBrazilAutoFillScript(data);
      try {
        await navigator.clipboard.writeText(script);
        setScriptCopied(true);
        toast.success('DPVN auto-fill script copied to clipboard!');
        setTimeout(() => setScriptCopied(false), 5000);
      } catch {
        toast.error('Failed to copy to clipboard');
      }
    } else if (countryCode === 'US') {
      const mergedData = getMergedData();
      const script = generateDS160CompleteScript(mergedData);
      try {
        await navigator.clipboard.writeText(script);
        setScriptCopied(true);
        toast.success('DS-160 auto-fill script copied! Paste in browser console on DS-160 site.');
        setTimeout(() => setScriptCopied(false), 5000);
      } catch {
        toast.error('Failed to copy to clipboard');
      }
    } else {
      toast.error(`Auto-fill script not yet available for ${countryCode}`);
    }
  };

  // Copy a single section script to clipboard
  const handleCopySectionScript = async (sectionId: string) => {
    if (countryCode === 'BR') {
      const mergedData = getMergedData();
      const data = buildBrazilVisaDataFromOrder(order, selectedTraveler, mergedData, uploadedDocs);
      if (!data) {
        toast.error('Could not build visa data for this traveler');
        return;
      }
      const sections = generateBrazilSectionScripts(data);
      const section = sections.find(s => s.id === sectionId);
      if (!section) {
        toast.error('Section not found');
        return;
      }
      try {
        await navigator.clipboard.writeText(section.script);
        setCopiedSection(sectionId);
        toast.success(`${section.label} script copied!`);
        setTimeout(() => setCopiedSection(null), 3000);
      } catch {
        toast.error('Failed to copy to clipboard');
      }
    }
  };

  // Get section scripts for rendering buttons
  const getSectionScripts = (): SectionScript[] => {
    if (countryCode !== 'BR') return [];
    const mergedData = getMergedData();
    const data = buildBrazilVisaDataFromOrder(order, selectedTraveler, mergedData, uploadedDocs);
    if (!data) return [];
    return generateBrazilSectionScripts(data);
  };

  // Field groups for the manual form: use template fields if loaded, otherwise hardcoded/generic
  const fieldGroups = templateFieldGroups || getFieldGroupsForCountry(countryCode);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">
            {countryConfig ? `${countryConfig.flag} ${countryConfig.label} Visa — Form Fill` : '📝 Visa Form Fill'}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Fill in traveler data and generate auto-fill scripts for the embassy website.
            {order.visaProduct?.name && <span className="ml-1 font-medium">Product: {order.visaProduct.name}</span>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/visa-form-templates"
            target="_blank"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-purple-100 text-purple-700 hover:bg-purple-200 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
            Edit Form Templates
          </Link>
          {countryConfig?.websiteUrl && (
            <a
              href={countryConfig.websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-${countryConfig.color}-100 text-${countryConfig.color}-700 hover:bg-${countryConfig.color}-200 transition-colors`}
            >
              🌐 Open {countryConfig.websiteLabel}
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
            </a>
          )}
        </div>
      </div>

      {/* Order matching info — helps handler know what to set in template */}
      <div className="flex flex-wrap items-center gap-2 text-xs bg-gray-50 border border-gray-200 rounded-lg px-4 py-2">
        <span className="text-gray-500 font-medium">Template matching:</span>
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white border text-gray-700">
          Country: <strong>{countryCode || '—'}</strong>
        </span>
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white border text-gray-700">
          Category: <strong>{order.visaProduct?.category || order.visaCategory || '—'}</strong>
        </span>
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white border text-gray-700">
          Product ID: <strong className="font-mono">{order.visaProduct?.id || '—'}</strong>
        </span>
        {matchedTemplateName && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-purple-50 border border-purple-200 text-purple-700">
            Matched: <strong>{matchedTemplateName}</strong>
          </span>
        )}
      </div>

      {/* Instructions */}
      {countryConfig && (
        <div className={`p-4 rounded-lg border bg-${countryConfig.color}-50 border-${countryConfig.color}-200`}>
          <p className={`text-sm font-medium text-${countryConfig.color}-900 mb-2`}>📋 Instructions:</p>
          <ol className="text-sm text-gray-700 space-y-1 list-decimal list-inside">
            {countryConfig.instructions.map((instr, i) => (
              <li key={i} className={instr.startsWith('  ') ? 'ml-4 list-none text-gray-500' : ''}>{instr}</li>
            ))}
          </ol>
        </div>
      )}

      {/* Send Form to Customer */}
      <SendVisaFormButton order={order} />

      {/* Data source indicator */}
      <div className="flex flex-col gap-1 text-sm">
        <div className="flex items-center gap-3">
          {loadingFormData ? (
            <span className="text-gray-400">⏳ Loading form data...</span>
          ) : formData ? (
            <span className="text-green-600 font-medium">✅ Customer form data found — fields pre-filled</span>
          ) : (
            <span className="text-amber-600 font-medium">⚠️ No customer form data — fill in manually below</span>
          )}
        </div>
        {!hasHardcodedFields && (
          <div className="flex items-center gap-2">
            {loadingTemplate ? (
              <span className="text-gray-400">⏳ Loading form template...</span>
            ) : matchedTemplateName ? (
              <span className="text-purple-600 font-medium">📋 Using template: {matchedTemplateName}</span>
            ) : (
              <span className="text-gray-500">📋 No matching template found — using generic fields.{' '}
                <Link href="/admin/visa-form-templates" target="_blank" className="text-purple-600 hover:underline">
                  Create one →
                </Link>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Traveler selector */}
      {travelers.length > 1 && (
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">Traveler:</span>
          {travelers.map((t: any, idx: number) => (
            <button
              key={idx}
              onClick={() => setSelectedTraveler(idx)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                selectedTraveler === idx
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {idx + 1}. {t.firstName || ''} {t.lastName || ''}
            </button>
          ))}
        </div>
      )}

      {/* Documents & Uploads */}
      <div className="bg-white rounded-xl shadow-sm border p-5">
          <h3 className="text-base font-semibold text-gray-900 mb-2 flex items-center gap-2">
            <span>📎</span> Step 1: Upload & Scan Documents
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            Upload the customer's documents below. Passport will be <strong>automatically scanned</strong> (OCR) to extract data and pre-fill the form fields.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { id: 'passportCopy', label: 'Passport Copy (first page)', accept: '.jpg,.jpeg,.png,.pdf', icon: '📘', scannable: true },
              ...(countryCode === 'BR' ? [
                { id: 'personbevis', label: 'Personbevis (Population Register)', accept: '.jpg,.jpeg,.png,.pdf', icon: '📋', scannable: true },
                { id: 'criminalRecord', label: 'Criminal Record Extract', accept: '.jpg,.jpeg,.png,.pdf', icon: '📄', scannable: true },
              ] : []),
              { id: 'passportPhoto', label: 'Passport Photo (biometric)', accept: '.jpg,.jpeg,.png', icon: '📷', scannable: false },
            ].map(docType => {
              const existing = uploadedDocs.find(d => d.id === `${docType.id}_${selectedTraveler}`);
              const isUploading = uploading === docType.id;
              const ocr = ocrStatuses[docType.id];
              return (
                <div key={docType.id} className={`border rounded-lg p-4 ${docType.scannable ? 'border-blue-200 bg-blue-50/30' : ''}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">
                      {docType.icon} {docType.label}
                      {docType.scannable && <span className="ml-1 text-xs text-blue-500 font-normal">(auto-scan)</span>}
                    </span>
                  </div>
                  {existing ? (
                    <div className="flex items-center gap-2">
                      <a
                        href={existing.downloadURL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline truncate flex-1"
                      >
                        \u2705 {existing.fileName}
                      </a>
                      <button
                        onClick={() => fileInputRefs.current[docType.id]?.click()}
                        className="text-xs text-gray-500 hover:text-gray-700 whitespace-nowrap"
                      >
                        Replace
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => fileInputRefs.current[docType.id]?.click()}
                      disabled={isUploading}
                      className="w-full py-2 px-3 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors disabled:opacity-50"
                    >
                      {isUploading ? '\u23f3 Uploading...' : 'Click to upload'}
                    </button>
                  )}
                  {/* Per-document OCR progress */}
                  {ocr?.progress !== null && ocr?.progress !== undefined && (
                    <div className="mt-2">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-blue-600">\ud83d\udd0d Scanning... {ocr.progress}%</span>
                      </div>
                      <div className="w-full bg-blue-200 rounded-full h-1.5">
                        <div className="bg-blue-600 h-1.5 rounded-full transition-all duration-300" style={{ width: `${ocr.progress}%` }} />
                      </div>
                    </div>
                  )}
                  {ocr?.result && ocr?.progress === null && (
                    <div className={`mt-2 text-xs px-2 py-1 rounded ${
                      ocr.result.startsWith('\u2705') ? 'bg-green-100 text-green-700' :
                      ocr.result.startsWith('\u26a0') ? 'bg-amber-100 text-amber-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {ocr.result}
                    </div>
                  )}
                  <input
                    ref={el => { fileInputRefs.current[docType.id] = el; }}
                    type="file"
                    accept={docType.accept}
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(docType.id, docType.label, file);
                      e.target.value = '';
                    }}
                  />
                </div>
              );
            })}
          </div>
        </div>

      {/* Generate Script Button */}
      {countryConfig?.hasAutoFill && (
        <div className="flex items-center gap-3">
          <button
            onClick={handleCopyScript}
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
              scriptCopied
                ? 'bg-green-600 text-white'
                : `bg-${countryConfig.color}-600 text-white hover:bg-${countryConfig.color}-700`
            }`}
          >
            {scriptCopied ? '✅ Script Copied!' : `📋 Copy Auto-Fill Script for ${traveler?.firstName || 'Traveler'} ${traveler?.lastName || ''}`}
          </button>
          {countryConfig.websiteUrl && (
            <a
              href={countryConfig.websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:underline"
            >
              Open website →
            </a>
          )}
        </div>
      )}

      {/* Editable Form Fields */}
      <div className="space-y-6">
        {fieldGroups.map(group => (
          <div key={group.id} className="bg-white rounded-xl shadow-sm border p-5">
            <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <span>{group.icon}</span> {group.label}
            </h3>
            {/* SAAB quick-fill for Brazil Contact */}
            {group.id === 'brazilContact' && (
              <div className="mb-4 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setManualFields(prev => ({
                      ...prev,
                      brazilContactName: 'Jose Laercio Pereira',
                      brazilContactAddress: 'Base Aérea de Anápolis BR 414 KM 4, Zona Rural Caixa Postal 811',
                      brazilContactZip: '75024970',
                      brazilContactCity: 'Anápolis',
                      brazilContactState: 'GO',
                      brazilContactRelationship: 'Co-worker',
                      brazilContactEmail: 'Laercio.pereira@saabgroup.com',
                      brazilContactPhone: '+55 11 9 8676 4053',
                    }));
                    toast.success('SAAB contact info filled');
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors"
                >
                  <span className="font-bold">SAAB</span> — Fill Jose Laercio Pereira
                </button>
                <span className="text-xs text-gray-400">Quick-fill SAAB contact in Brazil</span>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {group.fields.map(field => {
                const value = getFieldValue(field.id, field.defaultValue || '');
                return (
                  <div key={field.id} className={field.fullWidth ? 'md:col-span-2' : ''}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {field.label}
                      {field.required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    {field.type === 'select' ? (
                      <select
                        value={value}
                        onChange={(e) => updateField(field.id, e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Select...</option>
                        {field.options?.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    ) : field.type === 'textarea' ? (
                      <textarea
                        value={value}
                        onChange={(e) => updateField(field.id, e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder={field.placeholder || ''}
                      />
                    ) : (
                      <input
                        type={field.type || 'text'}
                        value={value}
                        onChange={(e) => updateField(field.id, e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder={field.placeholder || ''}
                      />
                    )}
                    {field.helpText && (
                      <p className="text-xs text-gray-400 mt-1">{field.helpText}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Per-section copy buttons */}
      {countryConfig?.hasAutoFill && countryCode === 'BR' && (
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <span>🇧🇷</span> DPVN Auto-fill Scripts
            </h3>
            {countryConfig.websiteUrl && (
              <a
                href={countryConfig.websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
              >
                🌐 Open DPVN Website
              </a>
            )}
          </div>
          <p className="text-xs text-gray-500 mb-3">Navigate to each tab on the DPVN website, then click the corresponding button to copy & paste the script into the browser console.</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {getSectionScripts().map(sec => (
              <button
                key={sec.id}
                onClick={() => handleCopySectionScript(sec.id)}
                className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium border transition-colors ${
                  copiedSection === sec.id
                    ? 'bg-green-50 border-green-300 text-green-700'
                    : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700'
                }`}
              >
                <span>{copiedSection === sec.id ? '✅' : sec.icon}</span>
                <span>{copiedSection === sec.id ? 'Copied!' : sec.label}</span>
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-3">
            {Object.keys(manualFields).filter(k => manualFields[k].trim()).length} field(s) manually edited
          </p>
        </div>
      )}

      {/* No config for this country */}
      {!countryConfig && countryCode && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 text-center">
          <p className="text-amber-800 font-medium">⚠️ No auto-fill configuration for country code: {countryCode}</p>
          <p className="text-sm text-amber-600 mt-1">You can still view and edit the form data above.</p>
        </div>
      )}
    </div>
  );
}

// ============================================================
// Field definitions per country
// ============================================================

interface FieldDef {
  id: string;
  label: string;
  type?: 'text' | 'date' | 'select' | 'textarea' | 'number';
  required?: boolean;
  options?: { value: string; label: string }[];
  placeholder?: string;
  helpText?: string;
  defaultValue?: string;
  fullWidth?: boolean;
}

interface FieldGroup {
  id: string;
  label: string;
  icon: string;
  fields: FieldDef[];
}

function getFieldGroupsForCountry(countryCode: string): FieldGroup[] {
  if (countryCode === 'BR') return getBrazilFields();
  // Fallback: generic fields
  return getGenericFields();
}

function getBrazilFields(): FieldGroup[] {
  return [
    {
      id: 'identification',
      label: 'Identification Data',
      icon: '👤',
      fields: [
        { id: 'givenNames', label: 'Given Names (as in passport)', required: true, placeholder: 'John' },
        { id: 'familyNames', label: 'Family Names (as in passport)', required: true, placeholder: 'Smith' },
        { id: 'dateOfBirth', label: 'Date of Birth', type: 'date', required: true },
        { id: 'sex', label: 'Sex', type: 'select', required: true, options: [
          { value: 'Male', label: 'Male' }, { value: 'Female', label: 'Female' },
        ]},
        { id: 'maritalStatus', label: 'Marital Status', type: 'select', required: true, options: [
          { value: 'Single', label: 'Single' }, { value: 'Married', label: 'Married' },
          { value: 'Divorced', label: 'Divorced' }, { value: 'Separated', label: 'Separated' },
          { value: 'Widowed', label: 'Widow(er)' }, { value: 'Stable Union', label: 'Stable Union' },
          { value: 'Other', label: 'Other' },
        ]},
        { id: 'formerNames', label: 'Former Names', placeholder: 'Leave empty if none' },
        { id: 'placeOfBirthCountry', label: 'Country of Birth', required: true, placeholder: 'Sweden' },
        { id: 'placeOfBirthState', label: 'State/Province of Birth', placeholder: 'Stockholm' },
        { id: 'placeOfBirthCity', label: 'City of Birth', required: true, placeholder: 'Stockholm' },
        { id: 'otherNationalities', label: 'Other Nationalities', placeholder: 'Leave empty if none' },
      ],
    },
    {
      id: 'passport',
      label: 'Travel Document',
      icon: '📘',
      fields: [
        { id: 'passportNumber', label: 'Passport Number', required: true },
        { id: 'passportIssuedBy', label: 'Issued by', required: true, defaultValue: 'Suécia/Polismyndigheten' },
        { id: 'passportDateOfIssue', label: 'Date of Issue', type: 'date', required: true },
        { id: 'passportDateOfExpiry', label: 'Date of Expiry', type: 'date', required: true },
      ],
    },
    {
      id: 'parents',
      label: 'Parents',
      icon: '👨‍👩‍👧',
      fields: [
        { id: 'motherGivenNames', label: "Mother's Given Names", placeholder: 'Leave empty if unknown' },
        { id: 'motherFamilyNames', label: "Mother's Family Names" },
        { id: 'motherCountryOfBirth', label: "Mother's Country of Birth" },
        { id: 'motherDateOfBirth', label: "Mother's Date of Birth", type: 'date' },
        { id: 'fatherGivenNames', label: "Father's Given Names", placeholder: 'Leave empty if unknown' },
        { id: 'fatherFamilyNames', label: "Father's Family Names" },
        { id: 'fatherCountryOfBirth', label: "Father's Country of Birth" },
        { id: 'fatherDateOfBirth', label: "Father's Date of Birth", type: 'date' },
      ],
    },
    {
      id: 'travel',
      label: 'Visa & Travel Data',
      icon: '✈️',
      fields: [
        { id: 'estimatedArrivalDate', label: 'Estimated Arrival Date', type: 'date', required: true },
        { id: 'plannedStayDays', label: 'Planned Stay (days)', type: 'number', required: true, defaultValue: '30' },
        { id: 'previousVisitBrazil', label: 'Previous Visit to Brazil?', type: 'select', required: true, options: [
          { value: 'No', label: 'No' }, { value: 'Yes', label: 'Yes' },
        ]},
        { id: 'previousVisitWhen', label: 'When? (if yes)', helpText: 'Fill in if answered Yes above' },
      ],
    },
    {
      id: 'professional',
      label: 'Professional Data',
      icon: '💼',
      fields: [
        { id: 'profession', label: 'Profession / Occupation', placeholder: 'e.g. Engineer' },
        { id: 'jobDescription', label: 'Job Description' },
        { id: 'activitiesInBrazil', label: 'Activities in Brazil', type: 'textarea', fullWidth: true },
        { id: 'monthlyIncomeUSD', label: 'Monthly Income (USD)' },
        { id: 'employerName', label: 'Employer Name' },
        { id: 'employerCountry', label: 'Employer Country', placeholder: 'Sweden' },
        { id: 'employerState', label: 'Employer State/Province' },
        { id: 'employerCity', label: 'Employer City' },
        { id: 'employerAddress', label: 'Employer Address' },
        { id: 'employerZipCode', label: 'Employer Zip Code' },
        { id: 'employerEmail', label: 'Employer Email' },
        { id: 'employerPhone', label: 'Employer Phone' },
        { id: 'employerBusinessNature', label: 'Nature of Business in Brazil', type: 'textarea', fullWidth: true },
      ],
    },
    {
      id: 'contacts',
      label: 'Contacts & Address',
      icon: '🏠',
      fields: [
        { id: 'email', label: 'Email', required: true },
        { id: 'phone', label: 'Phone', required: true },
        { id: 'permanentAddressCountry', label: 'Country of Residence', required: true, placeholder: 'Sweden' },
        { id: 'permanentAddressState', label: 'State/Province' },
        { id: 'permanentAddressCity', label: 'City', required: true },
        { id: 'permanentAddressStreet', label: 'Street Address', required: true },
        { id: 'permanentAddressZip', label: 'Zip Code', required: true },
      ],
    },
    {
      id: 'brazilContact',
      label: 'Contact in Brazil',
      icon: '🇧🇷',
      fields: [
        { id: 'brazilContactName', label: 'Contact Name', helpText: 'Leave empty if no contact in Brazil' },
        { id: 'brazilContactAddress', label: 'Contact Address', fullWidth: true },
        { id: 'brazilContactZip', label: 'Contact Zip Code' },
        { id: 'brazilContactCity', label: 'Contact City' },
        { id: 'brazilContactState', label: 'Contact State' },
        { id: 'brazilContactRelationship', label: 'Relationship', type: 'select', options: [
          { value: 'Co-worker', label: 'Co-worker' }, { value: 'Friend', label: 'Friend' },
          { value: 'Relative', label: 'Relative' }, { value: 'Others', label: 'Others' },
        ]},
        { id: 'brazilContactEmail', label: 'Contact Email' },
        { id: 'brazilContactPhone', label: 'Contact Phone' },
      ],
    },
  ];
}

function getGenericFields(): FieldGroup[] {
  return [
    {
      id: 'personal',
      label: 'Personal Information',
      icon: '👤',
      fields: [
        { id: 'givenNames', label: 'Given Names', required: true },
        { id: 'familyNames', label: 'Family Names', required: true },
        { id: 'dateOfBirth', label: 'Date of Birth', type: 'date', required: true },
        { id: 'sex', label: 'Sex', type: 'select', required: true, options: [
          { value: 'Male', label: 'Male' }, { value: 'Female', label: 'Female' },
        ]},
        { id: 'placeOfBirth', label: 'Place of Birth', required: true },
        { id: 'nationality', label: 'Nationality', required: true },
      ],
    },
    {
      id: 'passport',
      label: 'Passport',
      icon: '📘',
      fields: [
        { id: 'passportNumber', label: 'Passport Number', required: true },
        { id: 'passportIssuedBy', label: 'Issued by' },
        { id: 'passportDateOfIssue', label: 'Date of Issue', type: 'date' },
        { id: 'passportDateOfExpiry', label: 'Date of Expiry', type: 'date', required: true },
      ],
    },
    {
      id: 'contact',
      label: 'Contact Information',
      icon: '🏠',
      fields: [
        { id: 'email', label: 'Email', required: true },
        { id: 'phone', label: 'Phone', required: true },
        { id: 'address', label: 'Address', fullWidth: true },
        { id: 'city', label: 'City' },
        { id: 'postalCode', label: 'Postal Code' },
      ],
    },
  ];
}
