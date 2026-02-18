/**
 * BrazilVisaScriptButton — Admin component for generating DPVN auto-fill script
 * 
 * Shows a button per traveler that:
 * 1. Fetches latest form submission data
 * 2. Builds BrazilVisaData from order + form data
 * 3. Generates a console script for auto-filling the DPVN Angular form
 * 4. Copies the script to clipboard so admin can paste it in the browser console
 */

import { useState, useEffect } from 'react';
import { buildBrazilVisaDataFromOrder, generateBrazilAutoFillScript } from '@/services/formAutomation/brazilVisaAutofill';
import { getFormSubmissionsForOrder } from '@/firebase/visaFormService';
import { toast } from 'react-hot-toast';

interface BrazilVisaScriptButtonProps {
  order: any;
  travelerIndex: number;
}

export default function BrazilVisaScriptButton({ order, travelerIndex }: BrazilVisaScriptButtonProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Record<string, string> | null>(null);
  const [scriptGenerated, setScriptGenerated] = useState(false);

  const traveler = order.travelers?.[travelerIndex];
  if (!traveler) return null;

  const name = `${traveler.firstName || ''} ${traveler.lastName || ''}`.trim() || `Traveler ${travelerIndex + 1}`;

  useEffect(() => {
    const fetchFormData = async () => {
      try {
        let submissions = await getFormSubmissionsForOrder(order.id);
        if (submissions.length === 0 && order.orderNumber) {
          submissions = await getFormSubmissionsForOrder(order.orderNumber);
        }
        const completed = submissions.find((s: any) => s.status === 'completed') || submissions.find((s: any) => s.status === 'partial');
        if (completed?.formData) {
          setFormData(completed.formData);
        }
      } catch {
        // Non-critical
      }
    };
    fetchFormData();
  }, [order.orderNumber, order.id]);

  const handleGenerate = async () => {
    setLoading(true);

    // Re-fetch latest form data
    let latestFormData = formData;
    try {
      let submissions = await getFormSubmissionsForOrder(order.id);
      if (submissions.length === 0 && order.orderNumber) {
        submissions = await getFormSubmissionsForOrder(order.orderNumber);
      }
      const completed = submissions.find((s: any) => s.status === 'completed') || submissions.find((s: any) => s.status === 'partial');
      if (completed?.formData) {
        latestFormData = completed.formData;
        setFormData(latestFormData);
      }
    } catch {
      // Use cached
    }

    const data = buildBrazilVisaDataFromOrder(order, travelerIndex, latestFormData || undefined);

    if (!data) {
      toast.error('Could not build visa data for this traveler');
      setLoading(false);
      return;
    }

    if (!data.passportNumber) {
      toast(`Passport number missing for ${name} — script will have empty passport field.`, { icon: '⚠️' });
    }

    try {
      const script = generateBrazilAutoFillScript(data);
      await navigator.clipboard.writeText(script);
      setScriptGenerated(true);
      toast.success(`DPVN auto-fill script copied to clipboard for ${name}! Paste it in the browser console on the Brazilian visa website.`);
      
      // Reset indicator after 5s
      setTimeout(() => setScriptGenerated(false), 5000);
    } catch (err: any) {
      toast.error(`Failed to copy script: ${err.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-3 p-2 bg-white rounded border border-green-100">
      <span className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-full bg-green-100 text-green-700 text-xs font-bold">
        {travelerIndex + 1}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{name}</p>
        <div className="flex items-center gap-1.5">
          {formData && (
            <span className="text-xs text-blue-600">📋 Form data</span>
          )}
          {scriptGenerated && (
            <span className="text-xs text-green-600">✅ Script copied!</span>
          )}
        </div>
      </div>
      <button
        onClick={handleGenerate}
        disabled={loading}
        className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium bg-green-100 text-green-700 border border-green-200 hover:bg-green-200 transition-colors disabled:opacity-50"
      >
        {loading ? '⏳ Generating...' : '🇧🇷 Copy DPVN Script'}
      </button>
    </div>
  );
}
