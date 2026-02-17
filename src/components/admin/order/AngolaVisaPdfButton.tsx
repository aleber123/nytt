/**
 * AngolaVisaPdfButton — Admin component for generating filled Angola visa PDF
 * 
 * Shows a button per traveler that:
 * 1. Fetches latest form submission data (passport, personal info etc.)
 * 2. Builds AngolaVisaData from order + form data
 * 3. Fills the official Angola visa PDF template using pdf-lib
 * 4. Downloads the filled PDF for printing and embassy submission
 */

import { useState, useEffect } from 'react';
import { buildAngolaVisaDataFromOrder, downloadFilledAngolaVisaPdf } from '@/services/formAutomation/angolaVisaPdf';
import { getFormSubmissionsForOrder } from '@/firebase/visaFormService';
import { toast } from 'react-hot-toast';

interface AngolaVisaPdfButtonProps {
  order: any;
  travelerIndex: number;
}

export default function AngolaVisaPdfButton({ order, travelerIndex }: AngolaVisaPdfButtonProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Record<string, string> | null>(null);

  const traveler = order.travelers?.[travelerIndex];
  if (!traveler) return null;

  const name = `${traveler.firstName || ''} ${traveler.lastName || ''}`.trim() || `Traveler ${travelerIndex + 1}`;
  const hasPassportData = !!traveler.passportData?.passportNumber;

  // Fetch form submission data on mount — try both order.id and orderNumber
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

    // Re-fetch latest form data — try both order.id and orderNumber
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

    const data = buildAngolaVisaDataFromOrder(order, travelerIndex, latestFormData || undefined);

    if (!data) {
      toast.error('Could not build visa data for this traveler');
      setLoading(false);
      return;
    }

    if (!data.passportNumber) {
      toast(`Passport number missing for ${name} — PDF will have an empty field.`, { icon: '⚠️' });
    }

    try {
      const filename = `angola-visa-${name.replace(/\s+/g, '-').toLowerCase()}-${order.orderNumber || order.id}.pdf`;
      await downloadFilledAngolaVisaPdf(data, filename);
      toast.success(`Angola visa PDF downloaded for ${name}`);
    } catch (err: any) {
      toast.error(`Failed to generate PDF: ${err.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-3 p-2 bg-white rounded border border-red-100">
      <span className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-full bg-red-100 text-red-700 text-xs font-bold">
        {travelerIndex + 1}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{name}</p>
        <div className="flex items-center gap-1.5">
          {hasPassportData && (
            <span className="text-xs text-green-600">📷 Passport scanned</span>
          )}
          {formData && (
            <span className="text-xs text-blue-600">📋 Form data</span>
          )}
        </div>
      </div>
      <button
        onClick={handleGenerate}
        disabled={loading}
        className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium bg-red-100 text-red-700 border border-red-200 hover:bg-red-200 transition-colors disabled:opacity-50"
      >
        {loading ? '⏳ Generating...' : '📄 Download PDF'}
      </button>
    </div>
  );
}
