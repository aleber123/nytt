/**
 * SvensklistanButton - Admin component for auto-filling Svensklistan
 * 
 * Shows a button per traveler that:
 * 1. Fetches latest form submission data (personnummer etc.)
 * 2. Opens Svensklistan in a new tab
 * 3. Copies the auto-fill script to clipboard
 * 4. Admin pastes script in browser console → form is filled
 */

import { useState, useEffect } from 'react';
import { generateSvensklistanScript, buildSvensklistanDataFromOrder } from '@/services/formAutomation/svensklistan';
import { getFormSubmissionsForOrder, VisaFormSubmission } from '@/firebase/visaFormService';
import { toast } from 'react-hot-toast';

interface SvensklistanButtonProps {
  order: any;
  travelerIndex: number;
}

export default function SvensklistanButton({ order, travelerIndex }: SvensklistanButtonProps) {
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Record<string, string> | null>(null);

  const traveler = order.travelers?.[travelerIndex];
  if (!traveler) return null;

  // Fetch form submission data on mount
  useEffect(() => {
    const fetchFormData = async () => {
      try {
        const submissions = await getFormSubmissionsForOrder(order.orderNumber || order.id);
        const completed = submissions.find(s => s.status === 'completed');
        if (completed?.formData) {
          setFormData(completed.formData);
        }
      } catch {
        // Non-critical
      }
    };
    fetchFormData();
  }, [order.orderNumber, order.id]);

  const handleClick = async () => {
    setLoading(true);
    
    // Re-fetch latest form data in case customer just submitted
    let latestFormData = formData;
    try {
      const submissions = await getFormSubmissionsForOrder(order.orderNumber || order.id);
      const completed = submissions.find(s => s.status === 'completed');
      if (completed?.formData) {
        latestFormData = completed.formData;
        setFormData(latestFormData);
      }
    } catch {
      // Use cached data
    }

    const data = buildSvensklistanDataFromOrder(order, travelerIndex, latestFormData || undefined);
    setLoading(false);
    
    if (!data) {
      toast.error('Could not build form data for this traveler');
      return;
    }

    if (!data.personnummer) {
      toast.error(`Missing personnummer for ${data.firstName} ${data.lastName}. Customer has not submitted the form yet.`);
      return;
    }

    const script = generateSvensklistanScript(data);

    // Copy to clipboard
    navigator.clipboard.writeText(script).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 5000);
      toast.success(
        `Script copied! Open Svensklistan → Press F12 → Console tab → Paste → Enter`,
        { duration: 8000 }
      );
      // Open Svensklistan in new tab
      window.open('https://www.swedenabroad.se/sv/svensklistan/', '_blank');
    }).catch(() => {
      toast.error('Could not copy to clipboard.');
    });
  };

  const name = `${traveler.firstName || ''} ${traveler.lastName || ''}`.trim() || `Traveler ${travelerIndex + 1}`;
  const hasPersonnummer = formData?.[`personnummer_${travelerIndex}`] || formData?.['personnummer'];

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium transition-all ${
        copied
          ? 'bg-green-100 text-green-800 border border-green-300'
          : hasPersonnummer
          ? 'bg-green-50 text-green-700 border border-green-200 hover:bg-green-100'
          : 'bg-blue-100 text-blue-700 border border-blue-200 hover:bg-blue-200'
      }`}
      title={`Auto-fill Svensklistan for ${name}${hasPersonnummer ? ' (data ready)' : ' (awaiting customer data)'}`}
    >
      {loading ? '⏳' : copied ? '✅ Copied!' : '🇸🇪 Svensklistan'}
      <span className="text-xs opacity-70">({name})</span>
      {hasPersonnummer && <span className="text-xs text-green-600">✓</span>}
    </button>
  );
}
