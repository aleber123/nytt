/**
 * Passport Data Extraction Service
 * 
 * Parses Machine Readable Zone (MRZ) from passport images to extract:
 * - Full name (surname + given names)
 * - Nationality
 * - Date of birth
 * - Gender
 * - Passport number
 * - Expiry date
 * - Country of issue
 * 
 * Uses ICAO 9303 standard for MRZ parsing.
 * MRZ is 2 lines of 44 characters each for TD3 (passport) documents.
 */

export interface PassportData {
  surname: string;
  givenNames: string;
  fullName: string;
  passportNumber: string;
  nationality: string;
  nationalityCode: string;
  dateOfBirth: string;       // YYYY-MM-DD
  dateOfBirthRaw: string;    // YYMMDD
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  genderRaw: string;         // M, F, X
  expiryDate: string;        // YYYY-MM-DD
  expiryDateRaw: string;     // YYMMDD
  issuingCountry: string;
  issuingCountryCode: string;
  personalNumber: string;
  mrzLine1: string;
  mrzLine2: string;
  confidence: number;        // 0-100
}

export interface PassportExtractionResult {
  success: boolean;
  data?: PassportData;
  rawText?: string;
  error?: string;
}

// ICAO country code to country name mapping (common ones)
const COUNTRY_CODES: Record<string, string> = {
  'SWE': 'SWEDEN', 'GBR': 'UNITED KINGDOM', 'USA': 'UNITED STATES OF AMERICA',
  'DEU': 'GERMANY', 'FRA': 'FRANCE', 'ITA': 'ITALY', 'ESP': 'SPAIN',
  'NLD': 'NETHERLANDS', 'BEL': 'BELGIUM', 'AUT': 'AUSTRIA', 'CHE': 'SWITZERLAND',
  'NOR': 'NORWAY', 'DNK': 'DENMARK', 'FIN': 'FINLAND', 'ISL': 'ICELAND',
  'IRL': 'IRELAND', 'PRT': 'PORTUGAL', 'GRC': 'GREECE', 'POL': 'POLAND',
  'CZE': 'CZECH REPUBLIC', 'HUN': 'HUNGARY', 'ROU': 'ROMANIA', 'BGR': 'BULGARIA',
  'HRV': 'CROATIA', 'SVK': 'SLOVAKIA', 'SVN': 'SLOVENIA', 'EST': 'ESTONIA',
  'LVA': 'LATVIA', 'LTU': 'LITHUANIA', 'MLT': 'MALTA', 'CYP': 'CYPRUS',
  'LUX': 'LUXEMBOURG', 'IND': 'INDIA', 'CHN': 'CHINA', 'JPN': 'JAPAN',
  'KOR': 'REPUBLIC OF KOREA', 'THA': 'THAILAND', 'VNM': 'VIETNAM',
  'PHL': 'PHILIPPINES', 'IDN': 'INDONESIA', 'MYS': 'MALAYSIA', 'SGP': 'SINGAPORE',
  'AUS': 'AUSTRALIA', 'NZL': 'NEW ZEALAND', 'CAN': 'CANADA', 'MEX': 'MEXICO',
  'BRA': 'BRAZIL', 'ARG': 'ARGENTINA', 'COL': 'COLOMBIA', 'CHL': 'CHILE',
  'PER': 'PERU', 'ZAF': 'SOUTH AFRICA', 'EGY': 'EGYPT', 'MAR': 'MOROCCO',
  'TUN': 'TUNISIA', 'NGA': 'NIGERIA', 'KEN': 'KENYA', 'GHA': 'GHANA',
  'TUR': 'TURKEY', 'RUS': 'RUSSIAN FEDERATION', 'UKR': 'UKRAINE',
  'SAU': 'SAUDI ARABIA', 'ARE': 'UNITED ARAB EMIRATES', 'QAT': 'QATAR',
  'KWT': 'KUWAIT', 'OMN': 'OMAN', 'BHR': 'BAHRAIN', 'JOR': 'JORDAN',
  'ISR': 'ISRAEL', 'LBN': 'LEBANON', 'IRQ': 'IRAQ', 'IRN': 'IRAN',
  'PAK': 'PAKISTAN', 'BGD': 'BANGLADESH', 'LKA': 'SRI LANKA', 'NPL': 'NEPAL',
  'D<<': 'GERMANY', 'GBD': 'UNITED KINGDOM', 'GBN': 'UNITED KINGDOM',
  'GBO': 'UNITED KINGDOM', 'GBS': 'UNITED KINGDOM',
};

/**
 * Parse MRZ check digit (modulo 10 with weights 7,3,1)
 */
function computeCheckDigit(input: string): number {
  const weights = [7, 3, 1];
  let sum = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input[i];
    let value: number;
    if (char === '<') value = 0;
    else if (char >= '0' && char <= '9') value = parseInt(char);
    else if (char >= 'A' && char <= 'Z') value = char.charCodeAt(0) - 55;
    else value = 0;
    sum += value * weights[i % 3];
  }
  return sum % 10;
}

/**
 * Validate MRZ check digit
 */
function validateCheckDigit(data: string, checkDigit: string): boolean {
  if (checkDigit === '<') return true;
  const expected = computeCheckDigit(data);
  return expected === parseInt(checkDigit);
}

/**
 * Convert MRZ date (YYMMDD) to YYYY-MM-DD
 */
function mrzDateToISO(yymmdd: string, isBirthDate: boolean = false): string {
  if (!yymmdd || yymmdd.length !== 6) return '';
  const yy = parseInt(yymmdd.substring(0, 2));
  const mm = yymmdd.substring(2, 4);
  const dd = yymmdd.substring(4, 6);
  
  // For birth dates: 00-99 → if > current year short, assume 1900s
  // For expiry dates: always 2000s
  let yyyy: number;
  if (isBirthDate) {
    const currentYearShort = new Date().getFullYear() % 100;
    yyyy = yy > currentYearShort ? 1900 + yy : 2000 + yy;
  } else {
    yyyy = 2000 + yy;
  }
  
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Clean MRZ name field (replace < with spaces, trim)
 */
function cleanMrzName(raw: string): string {
  return raw.replace(/</g, ' ').replace(/\s+/g, ' ').trim();
}

/**
 * Parse TD3 MRZ (passport, 2 lines × 44 chars)
 */
export function parseMRZ(line1: string, line2: string): PassportData | null {
  // Normalize: uppercase
  line1 = line1.toUpperCase();
  line2 = line2.toUpperCase();
  
  // OCR often reads '<' as spaces. Convert spaces to '<' before stripping,
  // so name separators (single < between given names, << between surname/given) are preserved.
  line1 = line1.replace(/\s/g, '<');
  line2 = line2.replace(/\s/g, '<');
  
  // Common OCR substitutions
  const fixOcr = (s: string) => s
    .replace(/0/g, (m, i, str) => {
      // Only replace 0→O in name section (line1 after P<)
      return m;
    });
  
  if (line1.length < 44 || line2.length < 44) {
    // Try to pad if close
    line1 = line1.padEnd(44, '<');
    line2 = line2.padEnd(44, '<');
  }
  
  // Line 1: P<ISSNAME<<GIVENNAMES<<<<<<<<<<<<<<<<<<<<<
  // Pos 0: Document type (P)
  // Pos 1: Type sub (< or letter)
  // Pos 2-4: Issuing country (3 chars)
  // Pos 5-43: Name (surname<<given names)
  
  const docType = line1[0];
  if (docType !== 'P') {
    // Not a passport MRZ
    return null;
  }
  
  const issuingCountryCode = line1.substring(2, 5).replace(/</g, '');
  const nameField = line1.substring(5, 44);
  
  // Split name on << (surname<<given names)
  const nameParts = nameField.split('<<');
  const surname = cleanMrzName(nameParts[0] || '');
  const givenNames = cleanMrzName(nameParts.slice(1).join(' '));
  
  // Line 2: PPPPPPPPPC<NNNDDDDDDCSSEEEEEEECPPPPPPPPPPPPPCC
  // Pos 0-8: Passport number (9 chars)
  // Pos 9: Check digit for passport number
  // Pos 10-12: Nationality (3 chars)
  // Pos 13-18: Date of birth (YYMMDD)
  // Pos 19: Check digit for DOB
  // Pos 20: Sex (M/F/<)
  // Pos 21-26: Expiry date (YYMMDD)
  // Pos 27: Check digit for expiry
  // Pos 28-42: Personal number / optional data
  // Pos 43: Overall check digit
  
  const passportNumber = line2.substring(0, 9).replace(/</g, '');
  const passportCheckDigit = line2[9];
  const nationalityCode = line2.substring(10, 13).replace(/</g, '');
  const dobRaw = line2.substring(13, 19);
  const dobCheckDigit = line2[19];
  const genderRaw = line2[20];
  const expiryRaw = line2.substring(21, 27);
  const expiryCheckDigit = line2[27];
  const personalNumber = line2.substring(28, 42).replace(/</g, '').trim();
  
  // Validate check digits
  let confidence = 100;
  if (!validateCheckDigit(line2.substring(0, 9), passportCheckDigit)) confidence -= 15;
  if (!validateCheckDigit(dobRaw, dobCheckDigit)) confidence -= 15;
  if (!validateCheckDigit(expiryRaw, expiryCheckDigit)) confidence -= 15;
  
  // Parse gender
  let gender: 'MALE' | 'FEMALE' | 'OTHER';
  if (genderRaw === 'M') gender = 'MALE';
  else if (genderRaw === 'F') gender = 'FEMALE';
  else gender = 'OTHER';
  
  // Parse dates
  const dateOfBirth = mrzDateToISO(dobRaw, true);
  const expiryDate = mrzDateToISO(expiryRaw, false);
  
  // Country names
  const issuingCountry = COUNTRY_CODES[issuingCountryCode] || issuingCountryCode;
  const nationality = COUNTRY_CODES[nationalityCode] || nationalityCode;
  
  if (!surname && !givenNames) {
    confidence -= 30;
  }
  if (!passportNumber) {
    confidence -= 20;
  }
  
  return {
    surname,
    givenNames,
    fullName: `${givenNames} ${surname}`.trim(),
    passportNumber,
    nationality,
    nationalityCode,
    dateOfBirth,
    dateOfBirthRaw: dobRaw,
    gender,
    genderRaw,
    expiryDate,
    expiryDateRaw: expiryRaw,
    issuingCountry,
    issuingCountryCode,
    personalNumber,
    mrzLine1: line1,
    mrzLine2: line2,
    confidence: Math.max(0, confidence),
  };
}

/**
 * Extract MRZ lines from raw OCR text.
 * Looks for 2 consecutive lines of ~44 chars starting with P< pattern.
 */
export function extractMRZFromText(text: string): { line1: string; line2: string } | null {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  
  // Strategy 1: Look for lines starting with P< (passport MRZ line 1)
  for (let i = 0; i < lines.length - 1; i++) {
    const line = lines[i].replace(/\s/g, '');
    if (line.length >= 40 && /^P[<A-Z]/.test(line)) {
      const nextLine = lines[i + 1].replace(/\s/g, '');
      if (nextLine.length >= 40 && /^[A-Z0-9<]/.test(nextLine)) {
        return {
          line1: line.substring(0, 44),
          line2: nextLine.substring(0, 44),
        };
      }
    }
  }
  
  // Strategy 2: Look for any 2 consecutive lines with 40+ chars containing < characters
  for (let i = 0; i < lines.length - 1; i++) {
    const line = lines[i].replace(/\s/g, '');
    const nextLine = lines[i + 1].replace(/\s/g, '');
    if (line.length >= 40 && nextLine.length >= 40 && 
        line.includes('<') && nextLine.includes('<') &&
        /^[A-Z0-9<]+$/.test(line) && /^[A-Z0-9<]+$/.test(nextLine)) {
      return {
        line1: line.substring(0, 44),
        line2: nextLine.substring(0, 44),
      };
    }
  }
  
  return null;
}

/**
 * Parse passport data from raw OCR text
 */
export function parsePassportFromText(text: string): PassportExtractionResult {
  const mrz = extractMRZFromText(text);
  if (!mrz) {
    return {
      success: false,
      rawText: text,
      error: 'Could not find MRZ (Machine Readable Zone) in the text. Make sure the passport photo includes the bottom two lines of text.',
    };
  }
  
  const data = parseMRZ(mrz.line1, mrz.line2);
  if (!data) {
    return {
      success: false,
      rawText: text,
      error: 'Found MRZ lines but could not parse them. The text may be unclear.',
    };
  }
  
  return {
    success: true,
    data,
    rawText: text,
  };
}

/**
 * Format passport data for display
 */
export function formatPassportDataForDisplay(data: PassportData): Record<string, string> {
  return {
    'Full Name': data.fullName,
    'Surname': data.surname,
    'Given Names': data.givenNames,
    'Passport Number': data.passportNumber,
    'Nationality': `${data.nationality} (${data.nationalityCode})`,
    'Date of Birth': data.dateOfBirth,
    'Gender': data.gender,
    'Expiry Date': data.expiryDate,
    'Issuing Country': `${data.issuingCountry} (${data.issuingCountryCode})`,
    'Confidence': `${data.confidence}%`,
  };
}

/**
 * Convert DD/MM/YYYY to YYYY-MM-DD
 */
export function ddmmyyyyToISO(dateStr: string): string {
  const parts = dateStr.split('/');
  if (parts.length !== 3) return dateStr;
  return `${parts[2]}-${parts[1]}-${parts[0]}`;
}

/**
 * Convert YYYY-MM-DD to DD/MM/YYYY (for India e-visa portal)
 */
export function isoToDDMMYYYY(dateStr: string): string {
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}
