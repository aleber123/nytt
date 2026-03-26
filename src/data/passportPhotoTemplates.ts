/**
 * Passport Photo Size Templates
 *
 * Default templates + support for custom user-created templates stored in Firestore.
 * Dimensions in millimeters. All photos printed at 300 DPI.
 */

export interface PhotoTemplate {
  id: string;
  name: string;
  widthMm: number;
  heightMm: number;
  backgroundColor: 'white' | 'light-grey' | 'light-blue';
  notes?: string;
  /** true = user-created, can be edited/deleted */
  isCustom?: boolean;
}

/** Default templates that ship with the app */
export const DEFAULT_TEMPLATES: PhotoTemplate[] = [
  {
    id: 'default-sweden',
    name: 'Sweden / EU Passport (35×45 mm)',
    widthMm: 35,
    heightMm: 45,
    backgroundColor: 'white',
    notes: 'ICAO standard. Used by Sweden, EU/Schengen, and most countries.',
  },
  {
    id: 'default-usa',
    name: 'USA Passport / Visa (51×51 mm)',
    widthMm: 51,
    heightMm: 51,
    backgroundColor: 'white',
    notes: 'Square format 2×2 inches. Also used for US Green Card.',
  },
  {
    id: 'default-uk',
    name: 'UK Passport (35×45 mm)',
    widthMm: 35,
    heightMm: 45,
    backgroundColor: 'light-grey',
    notes: 'Light grey background required — not white.',
  },
  {
    id: 'default-saudi',
    name: 'Saudi Arabia (60×60 mm)',
    widthMm: 60,
    heightMm: 60,
    backgroundColor: 'white',
    notes: 'Square format for Saudi passport and visa.',
  },
  {
    id: 'default-india',
    name: 'India Passport / Visa (51×51 mm)',
    widthMm: 51,
    heightMm: 51,
    backgroundColor: 'white',
    notes: 'Square format 2×2 inches, same as USA.',
  },
];

/** Canon Selphy CP1500 postcard paper: 100×148 mm */
export const CANON_SELPHY_PAPER = {
  id: 'selphy',
  name: 'Canon Selphy CP1500 (100×148 mm)',
  widthMm: 100,
  heightMm: 148,
};

export interface PaperSize {
  id: string;
  name: string;
  widthMm: number;
  heightMm: number;
}

/** Print paper sizes — Selphy first as default */
export const PAPER_SIZES: PaperSize[] = [
  CANON_SELPHY_PAPER,
  { id: '4x6', name: '4×6 inch (102×152 mm)', widthMm: 102, heightMm: 152 },
  { id: 'a4', name: 'A4 (210×297 mm)', widthMm: 210, heightMm: 297 },
  { id: 'letter', name: 'US Letter (216×279 mm)', widthMm: 216, heightMm: 279 },
];

/** DPI for print quality */
export const PRINT_DPI = 300;

/** Convert mm to pixels at given DPI */
export function mmToPixels(mm: number, dpi: number = PRINT_DPI): number {
  return Math.round((mm / 25.4) * dpi);
}

/** Calculate how many photos fit on a paper size with spacing */
export function calculatePhotoGrid(
  paperWidthMm: number,
  paperHeightMm: number,
  photoWidthMm: number,
  photoHeightMm: number,
  gutterMm: number = 2,
  marginMm: number = 3,
): { cols: number; rows: number; total: number } {
  const usableWidth = paperWidthMm - 2 * marginMm;
  const usableHeight = paperHeightMm - 2 * marginMm;
  const cols = Math.floor((usableWidth + gutterMm) / (photoWidthMm + gutterMm));
  const rows = Math.floor((usableHeight + gutterMm) / (photoHeightMm + gutterMm));
  return { cols, rows, total: cols * rows };
}

/** Background color hex values */
export const BG_COLORS: Record<PhotoTemplate['backgroundColor'], string> = {
  'white': '#FFFFFF',
  'light-grey': '#E8E8E8',
  'light-blue': '#D6EAF8',
};
