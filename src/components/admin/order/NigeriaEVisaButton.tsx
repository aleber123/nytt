/**
 * NigeriaEVisaButton — Admin component for generating Nigeria e-visa auto-fill script
 *
 * Shows a button per traveler that:
 * 1. Fetches latest form submission data (if any)
 * 2. Builds NigeriaEVisaData from order + traveler + form data
 * 3. Generates a console script for auto-filling evisa.immigration.gov.ng
 * 4. Copies the script to clipboard so admin can paste it in the browser console
 */

import { useState, useEffect } from 'react';
import { buildNigeriaVisaDataFromOrder, generateNigeriaAutoFillScript } from '@/services/formAutomation/nigeriaEVisa';
import { getFormSubmissionsForOrder } from '@/firebase/visaFormService';
import { toast } from 'react-hot-toast';

interface NigeriaEVisaButtonProps {
  order: any;
  travelerIndex: number;
}

export default function NigeriaEVisaButton({ order, travelerIndex }: NigeriaEVisaButtonProps) {
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
        // Non-critical — form data is optional
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

    const data = buildNigeriaVisaDataFromOrder(order, travelerIndex, latestFormData || undefined);

    if (!data) {
      toast.error('Could not build visa data for this traveler');
      setLoading(false);
      return;
    }

    if (!data.passportNumber) {
      toast(`Passport number missing for ${name} — script will have empty passport field.`, { icon: '⚠️' });
    }

    try {
      const script = generateNigeriaAutoFillScript(data);
      await navigator.clipboard.writeText(script);
      setScriptGenerated(true);
      toast.success(`Nigeria e-visa script copied for ${name}! Paste in console on evisa.immigration.gov.ng`);

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
        <div className="text-sm font-medium text-gray-900 truncate">{name}</div>
        <div className="text-xs text-gray-500 truncate">
          {traveler.passportNumber || 'No passport number'}
        </div>
      </div>
      <button
        onClick={handleGenerate}
        disabled={loading}
        className={`flex-shrink-0 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
          scriptGenerated
            ? 'bg-green-100 text-green-800 border border-green-200'
            : 'bg-green-600 text-white hover:bg-green-700'
        } disabled:opacity-50`}
      >
        {loading ? (
          <span className="flex items-center gap-1">
            <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Generating...
          </span>
        ) : scriptGenerated ? (
          <span className="flex items-center gap-1">
            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Copied!
          </span>
        ) : (
          '🇳🇬 Nigeria e-Visa Script'
        )}
      </button>
    </div>
  );
}
