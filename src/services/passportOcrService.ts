/**
 * Passport OCR Service
 * 
 * Uses Tesseract.js to extract text from passport images,
 * then parses the MRZ (Machine Readable Zone) to extract:
 * - Given names, Family name
 * - Passport number
 * - Date of birth, Date of expiry
 * - Gender
 * - Nationality / Issuing country
 * 
 * MRZ format for passports (Type P, 2 lines of 44 chars):
 * Line 1: P<ISSUING_COUNTRY<SURNAME<<GIVEN_NAMES<<<<<<<<<<<<<<<<<<
 * Line 2: PASSPORT_NUMBER<CHECK_DIGIT<NATIONALITY<DOB<CHECK<SEX<EXPIRY<CHECK<PERSONAL_NUMBER<CHECK<OVERALL_CHECK
 */

import Tesseract from 'tesseract.js';
import * as pdfjsLib from 'pdfjs-dist';

// Set worker source for pdf.js (use CDN for browser compatibility)
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
}

/**
 * Convert a PDF file to an array of image Blobs (one per page).
 * Renders at 2x scale for better OCR accuracy.
 */
async function pdfToImages(file: File): Promise<Blob[]> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const images: Blob[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const scale = 2.0;
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d')!;
    await page.render({ canvasContext: ctx, viewport }).promise;
    const blob = await new Promise<Blob>((resolve) => {
      canvas.toBlob((b) => resolve(b!), 'image/png');
    });
    images.push(blob);
  }

  return images;
}

/**
 * Get an OCR-compatible image source from a file.
 * If the file is a PDF, renders the first page to an image.
 * Otherwise returns the file as-is.
 */
async function getOcrImageSource(file: File): Promise<File | Blob> {
  if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
    const images = await pdfToImages(file);
    if (images.length === 0) throw new Error('PDF has no pages');
    return images[0]; // Use first page
  }
  return file;
}

export interface PassportOcrResult {
  success: boolean;
  // Extracted fields
  givenNames: string;
  familyNames: string;
  passportNumber: string;
  dateOfBirth: string;     // YYYY-MM-DD
  dateOfExpiry: string;    // YYYY-MM-DD
  gender: 'Male' | 'Female' | '';
  nationality: string;     // 3-letter country code
  issuingCountry: string;  // 3-letter country code
  // Raw data
  rawMrzLine1: string;
  rawMrzLine2: string;
  rawText: string;
  confidence: number;
  error?: string;
}

/**
 * Parse a 6-digit MRZ date (YYMMDD) to ISO format (YYYY-MM-DD).
 * Uses a 100-year window: years 00-30 → 2000-2030, 31-99 → 1931-1999.
 */
function parseMrzDate(mrzDate: string): string {
  if (!mrzDate || mrzDate.length !== 6) return '';
  const yy = parseInt(mrzDate.substring(0, 2), 10);
  const mm = mrzDate.substring(2, 4);
  const dd = mrzDate.substring(4, 6);
  const year = yy <= 30 ? 2000 + yy : 1900 + yy;
  return `${year}-${mm}-${dd}`;
}

/**
 * Clean MRZ name: replace < with spaces, trim, title-case
 */
function cleanMrzName(raw: string): string {
  return raw
    .replace(/</g, ' ')
    .trim()
    .split(/\s+/)
    .filter(w => {
      if (w.length === 0) return false;
      // Filter out single characters (OCR noise from filler <)
      if (w.length === 1) return false;
      // Filter out words that are all the same character (e.g. "LLLL", "CCC")
      if (w.length >= 2 && new Set(w.toLowerCase().split('')).size === 1) return false;
      // Filter out words mostly composed of OCR-filler characters (C, l, L, I, i, 1)
      // These are common misreadings of MRZ padding <<<
      const fillerChars = w.split('').filter(c => 'ClLIi1'.includes(c)).length;
      if (fillerChars / w.length >= 0.7 && w.length >= 2) return false;
      return true;
    })
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Try to find and parse MRZ lines from OCR text.
 * MRZ lines are 44 chars long, contain only A-Z, 0-9, and <.
 */
function findMrzLines(text: string): { line1: string; line2: string } | null {
  // Normalize: replace common OCR mistakes
  const cleaned = text
    .replace(/[|]/g, '<')
    .replace(/[{}[\]()]/g, '<')
    .replace(/\u00AB/g, '<')  // «
    .replace(/\u00BB/g, '<')  // »
    .replace(/[^\x20-\x7E\n]/g, '') // Remove non-ASCII except newlines
    .toUpperCase();

  const lines = cleaned.split(/\n/).map(l => l.trim()).filter(l => l.length >= 40);

  // Find lines that look like MRZ (mostly A-Z, 0-9, <)
  const mrzCandidates = lines.filter(l => {
    const mrzChars = l.replace(/[^A-Z0-9<]/g, '');
    return mrzChars.length >= 40 && (mrzChars.length / l.length) > 0.85;
  });

  if (mrzCandidates.length >= 2) {
    // Find the pair that starts with P< (line 1) followed by passport number line
    for (let i = 0; i < mrzCandidates.length - 1; i++) {
      const l1 = mrzCandidates[i].replace(/[^A-Z0-9<]/g, '');
      const l2 = mrzCandidates[i + 1].replace(/[^A-Z0-9<]/g, '');
      if (l1.startsWith('P') && l1.length >= 42 && l2.length >= 42) {
        return {
          line1: l1.substring(0, 44).padEnd(44, '<'),
          line2: l2.substring(0, 44).padEnd(44, '<'),
        };
      }
    }
    // Fallback: use last two MRZ-like lines
    const l1 = mrzCandidates[mrzCandidates.length - 2].replace(/[^A-Z0-9<]/g, '');
    const l2 = mrzCandidates[mrzCandidates.length - 1].replace(/[^A-Z0-9<]/g, '');
    return {
      line1: l1.substring(0, 44).padEnd(44, '<'),
      line2: l2.substring(0, 44).padEnd(44, '<'),
    };
  }

  return null;
}

/**
 * Parse MRZ line 1 and line 2 into structured data.
 */
function parseMrz(line1: string, line2: string): Omit<PassportOcrResult, 'rawText' | 'confidence' | 'error'> {
  // Line 1: P<COUNTRY<SURNAME<<GIVEN_NAMES<<<...
  const issuingCountry = line1.substring(2, 5).replace(/</g, '');
  const nameSection = line1.substring(5);
  const nameParts = nameSection.split('<<');
  const familyNames = cleanMrzName(nameParts[0] || '');
  // Given names: join parts after <<, but strip trailing filler (sequences of <)
  const givenRaw = nameParts.slice(1).join('<<').replace(/<+$/g, '');
  const givenNames = cleanMrzName(givenRaw);

  // Line 2: PASSPORT_NO(9)<CHECK(1)<NATIONALITY(3)<DOB(6)<CHECK(1)<SEX(1)<EXPIRY(6)<CHECK(1)<...
  const passportNumber = line2.substring(0, 9).replace(/</g, '');
  const nationality = line2.substring(10, 13).replace(/</g, '');
  const dobRaw = line2.substring(13, 19);
  const sex = line2.substring(20, 21);
  const expiryRaw = line2.substring(21, 27);

  return {
    success: true,
    givenNames,
    familyNames,
    passportNumber,
    dateOfBirth: parseMrzDate(dobRaw),
    dateOfExpiry: parseMrzDate(expiryRaw),
    gender: sex === 'F' ? 'Female' : sex === 'M' ? 'Male' : '',
    nationality,
    issuingCountry,
    rawMrzLine1: line1,
    rawMrzLine2: line2,
  };
}

/**
 * Extract passport data from an image file using OCR + MRZ parsing.
 * 
 * @param imageSource - File object, Blob, or URL string of the passport image
 * @param onProgress - Optional progress callback (0-100)
 */
export async function extractPassportData(
  imageSource: File | Blob | string,
  onProgress?: (progress: number) => void
): Promise<PassportOcrResult> {
  try {
    onProgress?.(2);

    // Convert PDF to image if needed
    const ocrSource = imageSource instanceof File ? await getOcrImageSource(imageSource) : imageSource;
    onProgress?.(5);

    const result = await Tesseract.recognize(
      ocrSource,
      'eng',
      {
        logger: (m: any) => {
          if (m.status === 'recognizing text' && m.progress) {
            onProgress?.(Math.round(5 + m.progress * 85));
          }
        },
      }
    );

    onProgress?.(90);

    const rawText = result.data.text;
    const confidence = result.data.confidence;

    // Try to find MRZ
    const mrz = findMrzLines(rawText);
    if (!mrz) {
      return {
        success: false,
        givenNames: '',
        familyNames: '',
        passportNumber: '',
        dateOfBirth: '',
        dateOfExpiry: '',
        gender: '',
        nationality: '',
        issuingCountry: '',
        rawMrzLine1: '',
        rawMrzLine2: '',
        rawText,
        confidence,
        error: 'Could not find MRZ (Machine Readable Zone) in the image. Please ensure the full passport page is visible and the image is clear.',
      };
    }

    const parsed = parseMrz(mrz.line1, mrz.line2);
    onProgress?.(100);

    return {
      ...parsed,
      rawText,
      confidence,
    };
  } catch (err: any) {
    return {
      success: false,
      givenNames: '',
      familyNames: '',
      passportNumber: '',
      dateOfBirth: '',
      dateOfExpiry: '',
      gender: '',
      nationality: '',
      issuingCountry: '',
      rawMrzLine1: '',
      rawMrzLine2: '',
      rawText: '',
      confidence: 0,
      error: `OCR failed: ${err.message || 'Unknown error'}`,
    };
  }
}

// ============================================================
// PERSONBEVIS (Swedish Population Register Extract) OCR
// ============================================================

export interface PersonbevisOcrResult {
  success: boolean;
  fullName: string;
  givenNames: string;
  familyNames: string;
  personalNumber: string;   // Swedish personnummer (YYYYMMDD-XXXX)
  dateOfBirth: string;      // YYYY-MM-DD
  address: string;
  postalCode: string;
  city: string;
  county: string;           // Swedish län (county/state/province)
  maritalStatus: string;    // Ogift, Gift, Skild, Änka/Änkling
  placeOfBirth: string;
  citizenship: string;
  rawText: string;
  confidence: number;
  error?: string;
}

/**
 * Extract data from a Swedish Personbevis image using OCR.
 * Looks for common Swedish keywords and patterns.
 */
export async function extractPersonbevisData(
  imageSource: File | Blob | string,
  onProgress?: (progress: number) => void
): Promise<PersonbevisOcrResult> {
  const empty: PersonbevisOcrResult = {
    success: false, fullName: '', givenNames: '', familyNames: '',
    personalNumber: '', dateOfBirth: '', address: '', postalCode: '',
    city: '', county: '', maritalStatus: '', placeOfBirth: '', citizenship: '',
    rawText: '', confidence: 0,
  };

  try {
    onProgress?.(2);
    const ocrSource = imageSource instanceof File ? await getOcrImageSource(imageSource) : imageSource;
    onProgress?.(5);
    const result = await Tesseract.recognize(ocrSource, 'swe+eng', {
      logger: (m: any) => {
        if (m.status === 'recognizing text' && m.progress) {
          onProgress?.(Math.round(5 + m.progress * 85));
        }
      },
    });
    onProgress?.(90);

    const rawText = result.data.text;
    const confidence = result.data.confidence;
    const lines = rawText.split('\n').map((l: string) => l.trim()).filter((l: string) => l);

    // Extract personnummer (YYYYMMDD-XXXX or YYMMDD-XXXX)
    let personalNumber = '';
    let dateOfBirth = '';
    const pnrMatch = rawText.match(/(\d{8})[- ]?(\d{4})/);
    if (pnrMatch) {
      personalNumber = `${pnrMatch[1]}-${pnrMatch[2]}`;
      const pnr = pnrMatch[1];
      if (pnr.length === 8) {
        dateOfBirth = `${pnr.substring(0, 4)}-${pnr.substring(4, 6)}-${pnr.substring(6, 8)}`;
      }
    }

    // Extract name — look for "Namn" or "Förnamn" / "Efternamn" labels
    let fullName = '';
    let givenNames = '';
    let familyNames = '';
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lower = line.toLowerCase();
      if (lower.includes('förnamn') || lower.includes('fornamn')) {
        const val = line.replace(/^.*?(förnamn|fornamn)[:\s]*/i, '').trim();
        if (val) givenNames = val;
        else if (i + 1 < lines.length) givenNames = lines[i + 1];
      }
      if (lower.includes('efternamn')) {
        const val = line.replace(/^.*?efternamn[:\s]*/i, '').trim();
        if (val) familyNames = val;
        else if (i + 1 < lines.length) familyNames = lines[i + 1];
      }
      if (lower.includes('namn') && !lower.includes('förnamn') && !lower.includes('fornamn') && !lower.includes('efternamn') && !fullName) {
        const val = line.replace(/^.*?namn[:\s]*/i, '').trim();
        if (val && val.length > 3) fullName = val;
        else if (i + 1 < lines.length && lines[i + 1].length > 3) fullName = lines[i + 1];
      }
    }
    // If we got fullName but not split names, try to split
    if (fullName && !givenNames && !familyNames) {
      const parts = fullName.split(/,\s*/);
      if (parts.length === 2) {
        familyNames = parts[0].trim();
        givenNames = parts[1].trim();
      }
    }

    // Extract address
    let address = '';
    let postalCode = '';
    let city = '';
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lower = line.toLowerCase();
      if (lower.includes('adress') || lower.includes('folkbokföringsadress') || lower.includes('folkbokforingsadress')) {
        // Look for postal code and street on subsequent lines
        for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
          const pcMatch = lines[j].match(/^(\d{3}\s?\d{2})\s+(.+)/);
          if (pcMatch) {
            postalCode = pcMatch[1].replace(/\s/g, '');
            city = pcMatch[2].trim();
            break;
          } else if (!address && lines[j].length > 2) {
            // First non-postal-code line after "Adress" label is the street address
            address = lines[j];
          }
        }
        break;
      }
    }

    // Extract marital status
    let maritalStatus = '';
    const statusMap: Record<string, string> = {
      'ogift': 'Single', 'gift': 'Married', 'skild': 'Divorced',
      'änka': 'Widowed', 'änkling': 'Widowed', 'anka': 'Widowed', 'ankling': 'Widowed',
    };
    for (const line of lines) {
      const lower = line.toLowerCase();
      if (lower.includes('civilstånd') || lower.includes('civilstand')) {
        for (const [sv, en] of Object.entries(statusMap)) {
          if (lower.includes(sv)) { maritalStatus = en; break; }
        }
        if (!maritalStatus) {
          const val = line.replace(/^.*?civilst[åa]nd[:\s]*/i, '').trim();
          for (const [sv, en] of Object.entries(statusMap)) {
            if (val.toLowerCase().includes(sv)) { maritalStatus = en; break; }
          }
        }
      }
    }

    // Extract citizenship
    let citizenship = '';
    for (const line of lines) {
      const lower = line.toLowerCase();
      if (lower.includes('medborgarskap') || lower.includes('citizenship')) {
        const val = line.replace(/^.*?(medborgarskap|citizenship)[:\s]*/i, '').trim();
        if (val) citizenship = val;
      }
    }

    // Extract place of birth — personbevis often uses "Födelse(hem)ort" or "Födelseort"
    let placeOfBirth = '';
    for (let i = 0; i < lines.length; i++) {
      const lower = lines[i].toLowerCase();
      if (lower.includes('födelse') && (lower.includes('ort') || lower.includes('hem'))) {
        // Match variants: Födelseort, Födelse(hem)ort, Födelsehem ort, etc.
        const val = lines[i].replace(/^.*?födelse\(?hem\)?\s*ort[:\s]*/i, '')
          .replace(/^.*?födelseort[:\s]*/i, '')
          .replace(/^.*?fodelseort[:\s]*/i, '')
          .replace(/^.*?fodelse\(?hem\)?\s*ort[:\s]*/i, '')
          .trim();
        if (val && val.length > 1) placeOfBirth = val;
        else if (i + 1 < lines.length && lines[i + 1].trim().length > 1) placeOfBirth = lines[i + 1].trim();
        if (placeOfBirth) break;
      } else if (lower.includes('fodelseort') || lower.includes('födelseland') || lower.includes('fodelseland')) {
        const val = lines[i].replace(/^.*?(fodelseort|födelseland|fodelseland)[:\s]*/i, '').trim();
        if (val && val.length > 1) placeOfBirth = val;
        else if (i + 1 < lines.length && lines[i + 1].trim().length > 1) placeOfBirth = lines[i + 1].trim();
        if (placeOfBirth) break;
      }
    }

    // Extract county (län) — look for "län" keyword in text
    let county = '';
    for (let i = 0; i < lines.length; i++) {
      const lower = lines[i].toLowerCase();
      if (lower.includes('län') && !lower.includes('födelseland') && !lower.includes('fodelseland')) {
        // Try to extract the län name from the line
        const lanMatch = lines[i].match(/([A-Za-zÅÄÖåäö\s]+)\s*län/i);
        if (lanMatch) {
          county = lanMatch[1].trim() + ' län';
        } else {
          const val = lines[i].replace(/^.*?län[:\s]*/i, '').trim();
          if (val) county = val;
        }
        if (county) break;
      }
    }
    // Fallback: try to determine county from postal code
    if (!county && postalCode) {
      const pc = parseInt(postalCode.substring(0, 3));
      if (pc >= 100 && pc <= 199) county = 'Stockholms län';
      else if (pc >= 200 && pc <= 234) county = 'Stockholms län';
      else if (pc >= 250 && pc <= 267) county = 'Skåne län';
      else if (pc >= 300 && pc <= 339) county = 'Jönköpings län';
      else if (pc >= 400 && pc <= 459) county = 'Västra Götalands län';
      else if (pc >= 500 && pc <= 549) county = 'Östergötlands län';
      else if (pc >= 550 && pc <= 579) county = 'Jönköpings län';
      else if (pc >= 580 && pc <= 599) county = 'Östergötlands län';
      else if (pc >= 600 && pc <= 629) county = 'Östergötlands län';
      else if (pc >= 630 && pc <= 689) county = 'Södermanlands län';
      else if (pc >= 700 && pc <= 749) county = 'Örebro län';
      else if (pc >= 750 && pc <= 799) county = 'Uppsala län';
      else if (pc >= 800 && pc <= 849) county = 'Dalarnas län';
      else if (pc >= 850 && pc <= 899) county = 'Gävleborgs län';
      else if (pc >= 900 && pc <= 949) county = 'Västerbottens län';
      else if (pc >= 950 && pc <= 989) county = 'Norrbottens län';
    }

    const hasData = !!(givenNames || familyNames || fullName || personalNumber || address);
    onProgress?.(100);

    return {
      success: hasData,
      fullName,
      givenNames,
      familyNames,
      personalNumber,
      dateOfBirth,
      address,
      postalCode,
      city,
      county,
      maritalStatus,
      placeOfBirth,
      citizenship,
      rawText,
      confidence,
      error: hasData ? undefined : 'Could not extract data from personbevis. Ensure the document is clearly visible.',
    };
  } catch (err: any) {
    return { ...empty, error: `OCR failed: ${err.message || 'Unknown error'}` };
  }
}

// ============================================================
// CRIMINAL RECORD (Belastningsregister / Straffregister) OCR
// ============================================================

export interface CriminalRecordOcrResult {
  success: boolean;
  fullName: string;
  personalNumber: string;
  dateOfBirth: string;
  hasConvictions: boolean;  // true if convictions found, false if clean
  rawText: string;
  confidence: number;
  error?: string;
}

/**
 * Extract data from a Swedish criminal record extract image.
 */
export async function extractCriminalRecordData(
  imageSource: File | Blob | string,
  onProgress?: (progress: number) => void
): Promise<CriminalRecordOcrResult> {
  const empty: CriminalRecordOcrResult = {
    success: false, fullName: '', personalNumber: '', dateOfBirth: '',
    hasConvictions: false, rawText: '', confidence: 0,
  };

  try {
    onProgress?.(2);
    const ocrSource = imageSource instanceof File ? await getOcrImageSource(imageSource) : imageSource;
    onProgress?.(5);
    const result = await Tesseract.recognize(ocrSource, 'swe+eng', {
      logger: (m: any) => {
        if (m.status === 'recognizing text' && m.progress) {
          onProgress?.(Math.round(5 + m.progress * 85));
        }
      },
    });
    onProgress?.(90);

    const rawText = result.data.text;
    const confidence = result.data.confidence;
    const lines = rawText.split('\n').map((l: string) => l.trim()).filter((l: string) => l);

    // Extract personnummer
    let personalNumber = '';
    let dateOfBirth = '';
    const pnrMatch = rawText.match(/(\d{8})[- ]?(\d{4})/);
    if (pnrMatch) {
      personalNumber = `${pnrMatch[1]}-${pnrMatch[2]}`;
      const pnr = pnrMatch[1];
      dateOfBirth = `${pnr.substring(0, 4)}-${pnr.substring(4, 6)}-${pnr.substring(6, 8)}`;
    }

    // Extract name
    let fullName = '';
    for (let i = 0; i < lines.length; i++) {
      const lower = lines[i].toLowerCase();
      if (lower.includes('namn') || lower.includes('name')) {
        const val = lines[i].replace(/^.*?(namn|name)[:\s]*/i, '').trim();
        if (val && val.length > 3) fullName = val;
        else if (i + 1 < lines.length && lines[i + 1].length > 3) fullName = lines[i + 1];
        break;
      }
    }

    // Check for convictions
    const lowerText = rawText.toLowerCase();
    const hasConvictions = !(
      lowerText.includes('ej förekommer') ||
      lowerText.includes('ej forekommmer') ||
      lowerText.includes('inte förekommer') ||
      lowerText.includes('no criminal record') ||
      lowerText.includes('förekommer ej') ||
      lowerText.includes('forekommmer ej')
    );

    const hasData = !!(fullName || personalNumber);
    onProgress?.(100);

    return {
      success: hasData,
      fullName,
      personalNumber,
      dateOfBirth,
      hasConvictions,
      rawText,
      confidence,
      error: hasData ? undefined : 'Could not extract data from criminal record. Ensure the document is clearly visible.',
    };
  } catch (err: any) {
    return { ...empty, error: `OCR failed: ${err.message || 'Unknown error'}` };
  }
}

/**
 * Map 3-letter country codes to country names (common ones for visa applications)
 */
export const COUNTRY_CODE_MAP: Record<string, string> = {
  SWE: 'Sweden',
  GBR: 'United Kingdom',
  USA: 'United States',
  DEU: 'Germany',
  FRA: 'France',
  NOR: 'Norway',
  DNK: 'Denmark',
  FIN: 'Finland',
  NLD: 'Netherlands',
  BEL: 'Belgium',
  ITA: 'Italy',
  ESP: 'Spain',
  PRT: 'Portugal',
  POL: 'Poland',
  AUT: 'Austria',
  CHE: 'Switzerland',
  IRL: 'Ireland',
  CAN: 'Canada',
  AUS: 'Australia',
  NZL: 'New Zealand',
  JPN: 'Japan',
  KOR: 'South Korea',
  CHN: 'China',
  IND: 'India',
  BRA: 'Brazil',
  ARG: 'Argentina',
  MEX: 'Mexico',
  ZAF: 'South Africa',
  TUR: 'Turkey',
  RUS: 'Russia',
  UKR: 'Ukraine',
  THA: 'Thailand',
  PHL: 'Philippines',
  IDN: 'Indonesia',
  MYS: 'Malaysia',
  SGP: 'Singapore',
  ARE: 'United Arab Emirates',
  SAU: 'Saudi Arabia',
  EGY: 'Egypt',
  NGA: 'Nigeria',
  KEN: 'Kenya',
  GHA: 'Ghana',
  AGO: 'Angola',
  TZA: 'Tanzania',
  ETH: 'Ethiopia',
  COL: 'Colombia',
  PER: 'Peru',
  CHL: 'Chile',
  VEN: 'Venezuela',
  CUB: 'Cuba',
  IRQ: 'Iraq',
  IRN: 'Iran',
  PAK: 'Pakistan',
  BGD: 'Bangladesh',
  LKA: 'Sri Lanka',
  VNM: 'Vietnam',
  MMR: 'Myanmar',
  D: 'Germany', // Sometimes MRZ uses single-letter codes
};
