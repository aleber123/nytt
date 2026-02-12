/**
 * SvensklistanButton - Admin component for auto-filling Svensklistan
 * 
 * Shows a button per traveler that:
 * 1. Opens Svensklistan in a new tab
 * 2. Copies the auto-fill script to clipboard
 * 3. Admin pastes script in browser console → form is filled
 */

import { useState } from 'react';
import { generateSvensklistanScript, buildSvensklistanDataFromOrder } from '@/services/formAutomation/svensklistan';
import { toast } from 'react-hot-toast';

interface SvensklistanButtonProps {
  order: any;
  travelerIndex: number;
}

export default function SvensklistanButton({ order, travelerIndex }: SvensklistanButtonProps) {
  const [copied, setCopied] = useState(false);

  const traveler = order.travelers?.[travelerIndex];
  if (!traveler) return null;

  const handleClick = () => {
    const data = buildSvensklistanDataFromOrder(order, travelerIndex);
    if (!data) {
      toast.error('Could not build form data for this traveler');
      return;
    }

    if (!data.personnummer) {
      toast.error(`Missing personnummer for ${data.firstName} ${data.lastName}. Please add it to the order first.`);
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
      // Fallback: show script in a prompt
      toast.error('Could not copy to clipboard. Script shown in console.');
    });
  };

  const name = `${traveler.firstName || ''} ${traveler.lastName || ''}`.trim() || `Traveler ${travelerIndex + 1}`;

  return (
    <button
      onClick={handleClick}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium transition-all ${
        copied
          ? 'bg-green-100 text-green-800 border border-green-300'
          : 'bg-blue-100 text-blue-700 border border-blue-200 hover:bg-blue-200'
      }`}
      title={`Auto-fill Svensklistan for ${name}`}
    >
      {copied ? '✅ Copied!' : '🇸🇪 Svensklistan'}
      <span className="text-xs opacity-70">({name})</span>
    </button>
  );
}
