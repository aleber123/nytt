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

import { useState, useEffect, useCallback } from 'react';
import { getFormSubmissionsForOrder } from '@/firebase/visaFormService';
import { buildBrazilVisaDataFromOrder, generateBrazilAutoFillScript } from '@/services/formAutomation/brazilVisaAutofill';
import { toast } from 'react-hot-toast';

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

  const countryCode = order.destinationCountryCode || '';
  const countryConfig = COUNTRY_CONFIG[countryCode] || null;
  const travelers = order.travelers || [];
  const traveler = travelers[selectedTraveler];

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

  // Generate and copy script
  const handleCopyScript = async () => {
    if (countryCode === 'BR') {
      const mergedData = getMergedData();
      const data = buildBrazilVisaDataFromOrder(order, selectedTraveler, mergedData);
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
    } else {
      toast.error(`Auto-fill script not yet available for ${countryCode}`);
    }
  };

  // Field groups for the manual form
  const fieldGroups = getFieldGroupsForCountry(countryCode);

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

      {/* Data source indicator */}
      <div className="flex items-center gap-3 text-sm">
        {loadingFormData ? (
          <span className="text-gray-400">⏳ Loading form data...</span>
        ) : formData ? (
          <span className="text-green-600 font-medium">✅ Customer form data found — fields pre-filled</span>
        ) : (
          <span className="text-amber-600 font-medium">⚠️ No customer form data — fill in manually below</span>
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

      {/* Bottom action bar */}
      {countryConfig?.hasAutoFill && (
        <div className="sticky bottom-0 bg-white border-t p-4 -mx-6 -mb-6 flex items-center justify-between">
          <p className="text-sm text-gray-500">
            {Object.keys(manualFields).filter(k => manualFields[k].trim()).length} field(s) manually edited
          </p>
          <div className="flex items-center gap-3">
            {countryConfig.websiteUrl && (
              <a
                href={countryConfig.websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
              >
                🌐 Open Website
              </a>
            )}
            <button
              onClick={handleCopyScript}
              className={`px-5 py-2 rounded-lg text-sm font-semibold text-white transition-colors ${
                scriptCopied ? 'bg-green-600' : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {scriptCopied ? '✅ Copied!' : '📋 Copy Script to Clipboard'}
            </button>
          </div>
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
        { id: 'passportIssuedBy', label: 'Issued by', required: true, placeholder: 'Swedish Police Authority' },
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
        { id: 'profession', label: 'Profession / Occupation', required: true },
        { id: 'jobDescription', label: 'Job Description', required: true },
        { id: 'activitiesInBrazil', label: 'Activities in Brazil', type: 'textarea', required: true, fullWidth: true },
        { id: 'monthlyIncomeUSD', label: 'Monthly Income (USD)', required: true },
        { id: 'employerName', label: 'Employer Name', required: true },
        { id: 'employerCountry', label: 'Employer Country', required: true, placeholder: 'Sweden' },
        { id: 'employerState', label: 'Employer State/Province' },
        { id: 'employerCity', label: 'Employer City', required: true },
        { id: 'employerAddress', label: 'Employer Address', required: true },
        { id: 'employerZipCode', label: 'Employer Zip Code' },
        { id: 'employerEmail', label: 'Employer Email' },
        { id: 'employerPhone', label: 'Employer Phone' },
        { id: 'employerBusinessNature', label: 'Nature of Business in Brazil', required: true, fullWidth: true },
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
        { id: 'brazilContactState', label: 'Contact State' },
        { id: 'brazilContactCity', label: 'Contact City' },
        { id: 'brazilContactAddress', label: 'Contact Address' },
        { id: 'brazilContactZip', label: 'Contact Zip Code' },
        { id: 'brazilContactRelationship', label: 'Relationship', type: 'select', options: [
          { value: 'Co-worker', label: 'Co-worker' }, { value: 'Friend', label: 'Friend' },
          { value: 'Relative', label: 'Relative' }, { value: 'Others', label: 'Others' },
        ]},
        { id: 'brazilContactPhone', label: 'Contact Phone/Email' },
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
