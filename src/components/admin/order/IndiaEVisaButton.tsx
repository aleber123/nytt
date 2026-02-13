/**
 * IndiaEVisaButton — Admin component for auto-filling India e-Visa application
 * 
 * Shows a button per traveler that:
 * 1. Fetches latest form submission data (passport, personal info etc.)
 * 2. Opens India e-Visa portal in a new tab
 * 3. Shows page-by-page scripts that can be copied to clipboard
 * 4. Admin navigates to each page, pastes script → form is filled
 * 
 * Same principle as SvensklistanButton but multi-page.
 */

import { useState, useEffect } from 'react';
import { generateAllPageScripts, buildIndiaEVisaDataFromOrder } from '@/services/formAutomation/indiaEVisa';
import { getFormSubmissionsForOrder } from '@/firebase/visaFormService';
import { toast } from 'react-hot-toast';

interface IndiaEVisaButtonProps {
  order: any;
  travelerIndex: number;
}

export default function IndiaEVisaButton({ order, travelerIndex }: IndiaEVisaButtonProps) {
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Record<string, string> | null>(null);
  const [scripts, setScripts] = useState<{ page: number; title: string; script: string }[]>([]);
  const [copiedPage, setCopiedPage] = useState<number | null>(null);

  const traveler = order.travelers?.[travelerIndex];
  if (!traveler) return null;

  const name = `${traveler.firstName || ''} ${traveler.lastName || ''}`.trim() || `Traveler ${travelerIndex + 1}`;
  const hasPassportData = !!traveler.passportData?.passportNumber;

  // Fetch form submission data on mount
  useEffect(() => {
    const fetchFormData = async () => {
      try {
        const submissions = await getFormSubmissionsForOrder(order.orderNumber || order.id);
        const completed = submissions.find((s: any) => s.status === 'completed');
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
      const submissions = await getFormSubmissionsForOrder(order.orderNumber || order.id);
      const completed = submissions.find((s: any) => s.status === 'completed');
      if (completed?.formData) {
        latestFormData = completed.formData;
        setFormData(latestFormData);
      }
    } catch {
      // Use cached
    }

    const data = buildIndiaEVisaDataFromOrder(order, travelerIndex, latestFormData || undefined);
    setLoading(false);

    if (!data) {
      toast.error('Could not build e-Visa data for this traveler');
      return;
    }

    if (!data.passportNumber) {
      toast.error(`Missing passport number for ${name}. Scan passport or wait for customer data.`);
      return;
    }

    const allScripts = generateAllPageScripts(data);
    setScripts(allScripts);
    setExpanded(true);

    toast.success(`${allScripts.length} page scripts generated for ${name}`);
  };

  const handleCopyPage = (pageIndex: number) => {
    const script = scripts[pageIndex];
    if (!script) return;

    navigator.clipboard.writeText(script.script).then(() => {
      setCopiedPage(script.page);
      setTimeout(() => setCopiedPage(null), 4000);
      toast.success(
        `Page ${script.page} script copied! Paste in browser console on the e-Visa page.`,
        { duration: 6000 }
      );
    }).catch(() => {
      toast.error('Could not copy to clipboard');
    });
  };

  const handleOpenPortal = () => {
    window.open('https://indianvisaonline.gov.in/evisa/tvoa.html', '_blank');
  };

  return (
    <div className="border border-orange-200 rounded-lg bg-orange-50 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">🇮🇳</span>
          <div>
            <span className="text-sm font-medium text-orange-900">India e-Visa</span>
            <span className="text-xs text-orange-600 ml-2">({name})</span>
          </div>
          {hasPassportData && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-green-100 text-green-700">
              📷 Passport scanned
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {!expanded ? (
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium bg-orange-100 text-orange-700 border border-orange-200 hover:bg-orange-200 transition-colors disabled:opacity-50"
            >
              {loading ? '⏳ Generating...' : '🇮🇳 Generate Scripts'}
            </button>
          ) : (
            <button
              onClick={() => setExpanded(false)}
              className="text-xs text-orange-500 hover:text-orange-700"
            >
              Collapse ▲
            </button>
          )}
        </div>
      </div>

      {/* Expanded: page scripts */}
      {expanded && scripts.length > 0 && (
        <div className="border-t border-orange-200 p-3 space-y-2">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-orange-700">
              Open the India e-Visa portal → navigate to each page → paste the script in browser console (F12)
            </p>
            <button
              onClick={handleOpenPortal}
              className="text-xs px-2 py-1 bg-orange-600 text-white rounded hover:bg-orange-700"
            >
              Open Portal ↗
            </button>
          </div>

          {scripts.map((s, idx) => (
            <div key={s.page} className="flex items-center gap-2 p-2 bg-white rounded border border-orange-100">
              <span className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-full bg-orange-100 text-orange-700 text-xs font-bold">
                {s.page}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{s.title}</p>
                <p className="text-xs text-gray-500">{s.script.length} chars</p>
              </div>
              <button
                onClick={() => handleCopyPage(idx)}
                className={`flex-shrink-0 px-3 py-1.5 rounded text-xs font-medium transition-all ${
                  copiedPage === s.page
                    ? 'bg-green-100 text-green-800 border border-green-300'
                    : 'bg-blue-100 text-blue-700 border border-blue-200 hover:bg-blue-200'
                }`}
              >
                {copiedPage === s.page ? '✅ Copied!' : '📋 Copy'}
              </button>
            </div>
          ))}

          <div className="mt-2 p-2 bg-orange-100 rounded text-xs text-orange-800">
            <strong>Workflow:</strong> Open portal → Start application → For each page: copy script → paste in console → review → Save & Continue → next page
          </div>
        </div>
      )}
    </div>
  );
}
