/**
 * PassportScanner — Admin component for extracting data from passport photos
 * 
 * Features:
 * 1. Upload or drag-drop passport photo
 * 2. Send to Vision API for OCR → parse MRZ
 * 3. Show extracted data with edit capability
 * 4. Apply data to traveler in order
 */

import { useState, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { parseMRZ } from '@/services/passportService';
import type { PassportData } from '@/services/passportService';

interface PassportScannerProps {
  order: any;
  travelerIndex: number;
  onDataExtracted?: (data: PassportData, travelerIndex: number) => void;
  onApplyToOrder?: (updates: Record<string, any>) => Promise<void>;
}

export default function PassportScanner({ order, travelerIndex, onDataExtracted, onApplyToOrder }: PassportScannerProps) {
  const { currentUser } = useAuth();
  const [scanning, setScanning] = useState(false);
  const [extractedData, setExtractedData] = useState<PassportData | null>(null);
  const [rawText, setRawText] = useState<string>('');
  const [showRawText, setShowRawText] = useState(false);
  const [error, setError] = useState<string>('');
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [applying, setApplying] = useState(false);
  const [showMrzInput, setShowMrzInput] = useState(false);
  const [mrzLine1, setMrzLine1] = useState('');
  const [mrzLine2, setMrzLine2] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const traveler = order?.travelers?.[travelerIndex];
  const travelerName = traveler
    ? `${traveler.firstName || ''} ${traveler.lastName || ''}`.trim()
    : `Traveler ${travelerIndex + 1}`;

  const handleFileSelect = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file (JPG, PNG)');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image too large. Maximum 10MB.');
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Convert to base64 and scan
    setScanning(true);
    setError('');
    setExtractedData(null);

    try {
      const base64 = await fileToBase64(file);
      const token = await currentUser?.getIdToken();

      const response = await fetch('/api/admin/passport-scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          image: base64,
          orderId: order?.orderNumber || order?.id,
          travelerIndex,
        }),
      });

      const result = await response.json();

      if (result.success && result.data) {
        setExtractedData(result.data);
        setRawText(result.rawText || '');
        onDataExtracted?.(result.data, travelerIndex);
        toast.success(`Passport data extracted! Confidence: ${result.data.confidence}%`);
      } else {
        setError(result.error || 'Could not extract passport data');
        setRawText(result.rawText || '');
        toast.error(result.error || 'Extraction failed');
      }
    } catch (err: any) {
      setError(err.message || 'Scan failed');
      toast.error('Passport scan failed');
    } finally {
      setScanning(false);
    }
  }, [currentUser, order, travelerIndex, onDataExtracted]);

  const handleManualMRZ = useCallback(() => {
    if (!mrzLine1 || !mrzLine2) {
      toast.error('Please enter both MRZ lines');
      return;
    }

    const data = parseMRZ(mrzLine1, mrzLine2);

    if (data) {
      setExtractedData(data);
      onDataExtracted?.(data, travelerIndex);
      toast.success(`MRZ parsed! Confidence: ${data.confidence}%`);
      setShowMrzInput(false);
    } else {
      toast.error('Could not parse MRZ lines. Check the input.');
    }
  }, [mrzLine1, mrzLine2, travelerIndex, onDataExtracted]);

  const handleApplyToOrder = useCallback(async () => {
    if (!extractedData || !onApplyToOrder) return;

    setApplying(true);
    try {
      const travelers = [...(order?.travelers || [])];
      const existing = travelers[travelerIndex] || {};

      travelers[travelerIndex] = {
        ...existing,
        firstName: extractedData.givenNames.split(' ')[0] || existing.firstName,
        lastName: extractedData.surname || existing.lastName,
        passportNumber: extractedData.passportNumber || existing.passportNumber,
        dateOfBirth: extractedData.dateOfBirth || existing.dateOfBirth,
        gender: extractedData.gender || existing.gender,
        nationality: extractedData.nationality || existing.nationality,
        nationalityCode: extractedData.nationalityCode || existing.nationalityCode,
        passportExpiry: extractedData.expiryDate || existing.passportExpiry,
        issuingCountry: extractedData.issuingCountry || existing.issuingCountry,
        issuingCountryCode: extractedData.issuingCountryCode || existing.issuingCountryCode,
        passportData: {
          ...extractedData,
          extractedAt: new Date().toISOString(),
        },
      };

      await onApplyToOrder({ travelers });
      toast.success(`Passport data applied to ${travelerName}`);
    } catch (err: any) {
      toast.error('Failed to apply data: ' + (err.message || ''));
    } finally {
      setApplying(false);
    }
  }, [extractedData, onApplyToOrder, order, travelerIndex, travelerName]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  }, [handleFileSelect]);

  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-white">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
          📷 Passport Scanner
          <span className="text-xs font-normal text-gray-500">({travelerName})</span>
        </h4>
        <button
          onClick={() => setShowMrzInput(!showMrzInput)}
          className="text-xs text-blue-600 hover:text-blue-800"
        >
          {showMrzInput ? 'Upload image instead' : 'Enter MRZ manually'}
        </button>
      </div>

      {/* Manual MRZ input */}
      {showMrzInput ? (
        <div className="space-y-2 mb-3">
          <p className="text-xs text-gray-500">Enter the two MRZ lines from the bottom of the passport:</p>
          <input
            type="text"
            value={mrzLine1}
            onChange={(e) => setMrzLine1(e.target.value.toUpperCase())}
            placeholder="P<SWEBERG QVIST<<ALEXANDER<<<<<<<<<<<<<<<<<"
            className="w-full px-3 py-2 border border-gray-300 rounded text-xs font-mono focus:ring-2 focus:ring-blue-500"
            maxLength={44}
          />
          <input
            type="text"
            value={mrzLine2}
            onChange={(e) => setMrzLine2(e.target.value.toUpperCase())}
            placeholder="L1234567<8SWE9001011M3012315<<<<<<<<<<<<<<04"
            className="w-full px-3 py-2 border border-gray-300 rounded text-xs font-mono focus:ring-2 focus:ring-blue-500"
            maxLength={44}
          />
          <button
            onClick={handleManualMRZ}
            className="px-4 py-1.5 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
          >
            Parse MRZ
          </button>
        </div>
      ) : (
        /* Image upload area */
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
            scanning ? 'border-blue-300 bg-blue-50' : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileSelect(file);
            }}
          />
          {scanning ? (
            <div className="py-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-sm text-blue-600">Scanning passport...</p>
            </div>
          ) : previewUrl ? (
            <div>
              <img src={previewUrl} alt="Passport" className="max-h-32 mx-auto rounded mb-2" />
              <p className="text-xs text-gray-500">Click to upload a different image</p>
            </div>
          ) : (
            <div className="py-2">
              <p className="text-2xl mb-1">📷</p>
              <p className="text-sm text-gray-600">Drop passport photo here or click to upload</p>
              <p className="text-xs text-gray-400 mt-1">JPG/PNG, max 10MB — photo page with MRZ visible</p>
            </div>
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">{error}</p>
          {rawText && (
            <button
              onClick={() => setShowRawText(!showRawText)}
              className="text-xs text-red-500 hover:text-red-700 mt-1"
            >
              {showRawText ? 'Hide raw text' : 'Show raw OCR text'}
            </button>
          )}
          {showRawText && rawText && (
            <pre className="mt-2 text-xs bg-red-100 p-2 rounded overflow-x-auto whitespace-pre-wrap max-h-40">
              {rawText}
            </pre>
          )}
        </div>
      )}

      {/* Extracted data */}
      {extractedData && (
        <div className="mt-3 space-y-3">
          <div className={`p-3 rounded-lg border ${
            extractedData.confidence >= 80 ? 'bg-green-50 border-green-200' :
            extractedData.confidence >= 50 ? 'bg-yellow-50 border-yellow-200' :
            'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">
                {extractedData.confidence >= 80 ? '✅' : extractedData.confidence >= 50 ? '⚠️' : '❌'}
                {' '}Confidence: {extractedData.confidence}%
              </span>
              {rawText && (
                <button
                  onClick={() => setShowRawText(!showRawText)}
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  {showRawText ? 'Hide raw' : 'Show raw'}
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 text-sm">
              <DataField label="Surname" value={extractedData.surname} />
              <DataField label="Given Names" value={extractedData.givenNames} />
              <DataField label="Passport No." value={extractedData.passportNumber} />
              <DataField label="Nationality" value={`${extractedData.nationality} (${extractedData.nationalityCode})`} />
              <DataField label="Date of Birth" value={extractedData.dateOfBirth} />
              <DataField label="Gender" value={extractedData.gender} />
              <DataField label="Expiry Date" value={extractedData.expiryDate} />
              <DataField label="Issuing Country" value={`${extractedData.issuingCountry} (${extractedData.issuingCountryCode})`} />
            </div>

            {/* MRZ lines */}
            <div className="mt-2 pt-2 border-t border-gray-200">
              <p className="text-xs text-gray-500 font-mono">{extractedData.mrzLine1}</p>
              <p className="text-xs text-gray-500 font-mono">{extractedData.mrzLine2}</p>
            </div>
          </div>

          {showRawText && rawText && (
            <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto whitespace-pre-wrap max-h-40 border">
              {rawText}
            </pre>
          )}

          {/* Apply button */}
          {onApplyToOrder && (
            <button
              onClick={handleApplyToOrder}
              disabled={applying}
              className="w-full px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              {applying ? 'Applying...' : `✅ Apply to ${travelerName}`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function DataField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-xs text-gray-500">{label}</span>
      <p className="font-medium text-gray-900 text-sm">{value || '—'}</p>
    </div>
  );
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Return just the base64 part (strip data URL prefix)
      resolve(result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
