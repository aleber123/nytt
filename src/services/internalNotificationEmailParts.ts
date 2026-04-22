/**
 * Helper builders for internal "new order" notification email content blocks.
 *
 * These produce HTML strings that get injected into the editable email
 * templates (internal-new-order-legalization, internal-new-order-visa,
 * internal-portal-order) as HTML variables. The shared wrapper from the
 * template system adds header/logo/footer — these builders produce the
 * data-heavy body sections.
 */

// ─── Shared section styles ──────────────────────────────────────────────────
const SECTION_BASE =
  'background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px;margin:16px 0;';
const ROW =
  'display:flex;justify-content:space-between;gap:12px;padding:8px 0;border-bottom:1px solid #eef2f6;';
const ROW_LAST = 'display:flex;justify-content:space-between;gap:12px;padding:8px 0;';
const LABEL = 'color:#5f6368;font-weight:600;';
const VALUE = 'color:#202124;font-weight:700;';

function row(label: string, value: string, isLast = false, valueStyle = ''): string {
  return `<div style="${isLast ? ROW_LAST : ROW}"><span style="${LABEL}">${label}</span><span style="${VALUE}${valueStyle}">${value}</span></div>`;
}

// ─── LEGALIZATION — order summary section ───────────────────────────────────
export interface LegalizationInternalSummaryParams {
  orderNumber: string;
  countryName: string;
  documentType: string;
  quantity: number;
  services: string;
  totalPrice: number;
  documentSource: 'original' | 'upload';
  willSendMainDocsLater?: boolean;
  hasPickup?: boolean;
  returnShipping: string;
  premiumText?: string;
}

export function buildLegalizationInternalSummaryHtml(
  p: LegalizationInternalSummaryParams
): string {
  const date = new Date().toLocaleDateString('en-GB');
  const sourceValue = p.willSendMainDocsLater
    ? '⏳ AWAITING - Customer will send via email'
    : p.documentSource === 'original'
      ? 'Original documents'
      : 'Uploaded files';
  const sourceStyle = p.willSendMainDocsLater ? ';color:#D97706;font-weight:800;' : '';
  const pickupValue = p.hasPickup ? '✅ YES - BOOK PICKUP' : '❌ No';
  const pickupStyle = p.hasPickup ? ';color:#D97706;font-weight:800;' : '';

  return `
<div style="${SECTION_BASE}">
  ${row('Date', date)}
  ${row('Country', p.countryName)}
  ${row('Document Type', p.documentType)}
  ${row('Quantity', `${p.quantity} pcs`)}
  ${row('Services', p.services)}
  ${row('Total Amount', `${p.totalPrice} SEK`)}
  ${row('Document Source', sourceValue, false, sourceStyle)}
  ${row('Pickup', pickupValue, !p.premiumText && !p.returnShipping, pickupStyle)}
  ${row('Return Shipping', p.returnShipping, !p.premiumText)}
  ${p.premiumText ? row('Premium', p.premiumText, true) : ''}
</div>`.trim();
}

// ─── Customer info section (shared for legalization + visa) ─────────────────
export interface InternalCustomerInfoParams {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  address?: string;
  postalCode?: string;
  city?: string;
  customerNumber?: string;
  invoiceReference?: string;
  companyName?: string;
}

export function buildInternalCustomerInfoHtml(p: InternalCustomerInfoParams): string {
  const fullAddress =
    [p.address, [p.postalCode, p.city].filter(Boolean).join(' ')]
      .filter(Boolean)
      .join(', ')
      .trim() || '-';
  const fullName = `${p.firstName || ''} ${p.lastName || ''}`.trim() || '-';
  const rows: string[] = [];
  if (p.companyName) rows.push(row('Company', p.companyName));
  rows.push(row('Customer', fullName));
  rows.push(row('Email', p.email || '-'));
  rows.push(row('Phone', p.phone || '-'));
  rows.push(row('Address', fullAddress));
  if (p.customerNumber) rows.push(row('Customer Number', p.customerNumber));
  if (p.invoiceReference) rows.push(row('Invoice Reference', p.invoiceReference));
  // Last row should not have border
  const lastIdx = rows.length - 1;
  rows[lastIdx] = rows[lastIdx].replace(ROW, ROW_LAST);
  return `<div style="${SECTION_BASE}">${rows.join('')}</div>`;
}

// ─── Legalization alert blocks (pickup + stockholm return + awaiting docs) ──
export interface PickupAlertParams {
  pickupMethodName: string;
  premiumPickupName?: string;
  stockholmLevel?: string;
  pickupDate?: string;
  pickupTimeWindow?: string;
  isStockholmPickup: boolean;
  pickupAddress?: {
    company?: string;
    name?: string;
    street?: string;
    postalCode?: string;
    city?: string;
  } | null;
}

export function buildPickupAlertHtml(p: PickupAlertParams): string {
  const addr = p.pickupAddress;
  return `
<div style="background:#FEF3C7;border:2px solid #F59E0B;border-radius:8px;padding:16px;margin:16px 0;">
  <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;">
    <span style="font-size:28px;">🚚</span>
    <h2 style="color:#92400E;font-size:18px;font-weight:700;margin:0;">PICKUP ORDERED!</h2>
  </div>
  <p style="margin:0 0 8px 0;color:#92400E;font-weight:600;">Customer has ordered document pickup. Book DHL pickup!</p>
  <div style="display:flex;justify-content:space-between;padding:4px 0;"><span style="${LABEL}">Pickup Service</span><span style="${VALUE}">${p.pickupMethodName}</span></div>
  ${p.isStockholmPickup && p.stockholmLevel ? `<div style="display:flex;justify-content:space-between;padding:4px 0;"><span style="${LABEL}">Level</span><span style="${VALUE}">${p.stockholmLevel}</span></div>` : p.premiumPickupName ? `<div style="display:flex;justify-content:space-between;padding:4px 0;"><span style="${LABEL}">Premium</span><span style="${VALUE}">${p.premiumPickupName}</span></div>` : ''}
  ${p.isStockholmPickup && p.pickupDate ? `<div style="display:flex;justify-content:space-between;padding:4px 0;"><span style="${LABEL}">Date</span><span style="${VALUE}">${p.pickupDate}</span></div>` : ''}
  ${p.isStockholmPickup && p.pickupTimeWindow ? `<div style="display:flex;justify-content:space-between;padding:4px 0;"><span style="${LABEL}">Time Window</span><span style="${VALUE}">${p.pickupTimeWindow}</span></div>` : ''}
  ${addr && addr.street ? `
  <div style="background:#fff;border:2px solid #F59E0B;border-radius:6px;padding:14px;margin-top:12px;">
    <div style="font-weight:700;margin-bottom:8px;color:#92400E;">📍 Pickup Address:</div>
    ${addr.company ? `<div style="font-weight:700;">${addr.company}</div>` : ''}
    <div>${addr.name || ''}</div>
    <div>${addr.street}</div>
    <div>${addr.postalCode || ''} ${addr.city || ''}</div>
  </div>` : ''}
</div>`.trim();
}

export interface StockholmReturnAlertParams {
  stockholmLevel: string;
  returnDeliveryDate?: string;
  deliveryAddress: {
    line1?: string;
    line2?: string;
    line3?: string;
    line4?: string;
  };
}

export function buildStockholmReturnAlertHtml(p: StockholmReturnAlertParams): string {
  const a = p.deliveryAddress;
  return `
<div style="background:#E0F2FE;border:2px solid #0284C7;border-radius:8px;padding:16px;margin:16px 0;">
  <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;">
    <span style="font-size:28px;">⚡</span>
    <h2 style="color:#075985;font-size:18px;font-weight:700;margin:0;">STOCKHOLM COURIER - DELIVERY</h2>
  </div>
  <div style="display:flex;justify-content:space-between;padding:4px 0;"><span style="${LABEL}">Level</span><span style="${VALUE}">${p.stockholmLevel}</span></div>
  ${p.returnDeliveryDate ? `<div style="display:flex;justify-content:space-between;padding:4px 0;"><span style="${LABEL}">Date</span><span style="${VALUE}">${p.returnDeliveryDate}</span></div>` : ''}
  <div style="background:#fff;border:2px solid #0284C7;border-radius:6px;padding:14px;margin-top:12px;">
    <div style="font-weight:700;margin-bottom:8px;color:#075985;">📍 Delivery Address:</div>
    ${a.line2 ? `<div style="font-weight:700;">${a.line2}</div>` : ''}
    ${a.line1 ? `<div>${a.line1}</div>` : ''}
    ${a.line3 ? `<div>${a.line3}</div>` : ''}
    ${a.line4 ? `<div>${a.line4}</div>` : ''}
  </div>
</div>`.trim();
}

export function buildAwaitingDocsAlertHtml(quantity: number): string {
  return `
<div style="background:#FEF3C7;border:2px solid #F59E0B;border-radius:8px;padding:16px;margin:16px 0;">
  <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;">
    <span style="font-size:24px;">⏳</span>
    <h3 style="margin:0;color:#92400E;font-size:16px;font-weight:700;">AWAITING DOCUMENTS VIA EMAIL</h3>
  </div>
  <div style="background:#fff;border:1px solid #FCD34D;border-radius:6px;padding:12px;color:#78350F;">
    <p style="margin:0 0 8px 0;"><strong>Customer will send ${quantity} document${quantity > 1 ? 's' : ''} to info@doxvl.se</strong></p>
    <p style="margin:0;font-size:13px;">Check inbox for incoming documents before processing this order.</p>
  </div>
</div>`.trim();
}

// ─── Extra blocks (uploaded files, postal address, notes) ──────────────────
export function buildUploadedFilesBlockHtml(
  files: { name?: string }[],
  orderAdminUrl: string
): string {
  return `
<div style="background:#ECFDF5;border:2px solid #10B981;border-radius:8px;padding:16px;margin:16px 0;">
  <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;">
    <span style="font-size:24px;">📎</span>
    <h3 style="margin:0;color:#065F46;font-size:16px;font-weight:700;">UPLOADED FILES (${files.length} pcs)</h3>
  </div>
  <div style="background:#fff;border:1px solid #A7F3D0;border-radius:6px;padding:12px;">
    ${files.map((f, i) => `<div style="padding:4px 0;${i < files.length - 1 ? 'border-bottom:1px solid #D1FAE5;' : ''}">${i + 1}. ${f?.name || 'File ' + (i + 1)}</div>`).join('')}
  </div>
  <a href="${orderAdminUrl}" target="_blank" rel="noopener" style="display:inline-block;background:#0EB0A6;color:#fff;text-decoration:none;border-radius:6px;padding:10px 16px;font-weight:700;margin-top:12px;">📂 View files in admin</a>
</div>`.trim();
}

export function buildPostalAddressBlockHtml(orderNumber: string, shippingLabelUrl: string): string {
  return `
<div style="${SECTION_BASE}">
  <div style="${LABEL}margin-bottom:6px;">Incoming postal address (customer sends themselves)</div>
  <div style="background:#fff;border:2px solid #065f46;border-radius:6px;padding:14px;font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,'Liberation Mono','Courier New',monospace;font-size:14px;">
    DOX Visumpartner AB<br/>
    Att: Document handling<br/>
    Box 38<br/>
    121 25 Stockholm-Globen<br/>
    Sweden
  </div>
  <a href="${shippingLabelUrl}" target="_blank" rel="noopener" style="display:inline-block;background:#0EB0A6;color:#fff;text-decoration:none;border-radius:6px;padding:10px 16px;font-weight:700;margin-top:12px;">Print shipping label</a>
  <div style="color:#5f6368;font-size:13px;margin-top:8px;">Always ask customer to mark with Order #${orderNumber} and send via registered mail.</div>
</div>`.trim();
}

export function buildAdditionalNotesBlockHtml(notes: string): string {
  return `
<div style="${SECTION_BASE}">
  <div style="${LABEL}margin-bottom:6px;">Additional Notes</div>
  <div style="color:#202124;font-weight:500;">${notes}</div>
</div>`.trim();
}

// ─── VISA — internal notification summary ───────────────────────────────────
export interface VisaInternalSummaryParams {
  orderNumber: string;
  destinationCountry: string;
  nationality: string;
  visaProductName: string;
  visaType: string; // "E-Visa" / "Sticker Visa"
  entryType: string;
  validityDays?: number;
  departureDate?: string;
  returnDate?: string;
  passportNeededBy?: string;
  travelers?: { firstName: string; lastName: string }[];
  travelerCount?: number;
  totalPrice?: number;
  customerType?: string;
  pricingBreakdown?: {
    serviceFee?: number;
    embassyFee?: number;
    expressPrice?: number;
    urgentPrice?: number;
  };
}

export function buildVisaInternalSummaryHtml(p: VisaInternalSummaryParams): string {
  const date = new Date().toLocaleDateString('en-GB');
  const hasBreakdown = !!(p.pricingBreakdown?.serviceFee || p.pricingBreakdown?.embassyFee || p.pricingBreakdown?.expressPrice || p.pricingBreakdown?.urgentPrice);
  const travelerCount = Math.max(1, Number(p.travelerCount) || 1);
  const multi = travelerCount > 1;
  const formatLine = (unit: number) => multi
    ? `${travelerCount} × ${unit.toLocaleString()} kr = ${(unit * travelerCount).toLocaleString()} kr`
    : `${unit.toLocaleString()} kr`;
  const priceBox = p.totalPrice && p.totalPrice > 0
    ? `
<div style="background:#ecfdf5;border:2px solid #10b981;border-radius:8px;padding:16px;margin:16px 0;text-align:center;">
  ${hasBreakdown ? `
  <div style="font-size:14px;color:#6b7280;margin-bottom:8px;">
    <div>Service fee: ${formatLine(p.pricingBreakdown?.serviceFee || 0)}</div>
    <div>Embassy fee: ${formatLine(p.pricingBreakdown?.embassyFee || 0)}</div>
    ${p.pricingBreakdown?.expressPrice ? `<div style="color:#ea580c;">Express fee: +${formatLine(p.pricingBreakdown.expressPrice)}</div>` : ''}
    ${p.pricingBreakdown?.urgentPrice ? `<div style="color:#dc2626;">Urgent fee: +${formatLine(p.pricingBreakdown.urgentPrice)}</div>` : ''}
  </div>` : ''}
  <div style="font-size:28px;font-weight:700;color:#065f46;">${p.totalPrice.toLocaleString()} kr</div>
  <div style="color:#6b7280;font-size:13px;">Total price ${p.customerType === 'company' ? '(excl. VAT)' : '(incl. VAT)'}</div>
</div>`.trim()
    : `
<div style="background:#fef3c7;border:2px solid #fcd34d;border-radius:8px;padding:16px;margin:16px 0;text-align:center;">
  <div style="font-size:18px;font-weight:700;color:#92400e;">⚠️ PRICE TBC</div>
  <div style="color:#a16207;font-size:13px;">Contact customer with pricing information</div>
</div>`.trim();

  return `
<div style="${SECTION_BASE}">
  ${row('Date', date)}
  ${row('Destination', p.destinationCountry)}
  ${row('Nationality', p.nationality)}
  ${row('Visa Product', p.visaProductName)}
  ${row('Visa Type', `${p.visaType} — ${p.entryType}`)}
  ${p.validityDays ? row('Validity', `${p.validityDays} days`) : ''}
  ${row('Departure', p.departureDate || '-')}
  ${row('Return', p.returnDate || '-')}
  ${row('Visa needed by', p.passportNeededBy || '-', true)}
  ${p.travelers && p.travelers.length > 0 ? `<div style="${ROW_LAST}"><span style="${LABEL}">Travelers (${p.travelers.length})</span><span style="${VALUE}">${p.travelers.map(t => `${t.firstName} ${t.lastName}`).join(', ')}</span></div>` : (p.travelerCount || 0) > 1 ? row('Travelers', `${p.travelerCount} persons`, true) : ''}
</div>
${priceBox}`.trim();
}

// ─── PORTAL — order summary table ───────────────────────────────────────────
export interface PortalOrderSummaryParams {
  companyName: string;
  contactPerson: string;
  contactEmail: string;
  typeLabel: string;
  country: string;
  services?: string;
  documentType?: string;
  quantity?: number;
  travelers?: string;
  pickup: string;
  additionalNotes?: string;
}

export function buildPortalOrderSummaryHtml(p: PortalOrderSummaryParams): string {
  return `
<table style="width:100%;border-collapse:collapse;font-size:14px;">
  <tr><td style="padding:8px 0;color:#6b7280;width:140px;">Företag</td><td style="padding:8px 0;font-weight:600;">${p.companyName}</td></tr>
  <tr><td style="padding:8px 0;color:#6b7280;">Kontaktperson</td><td style="padding:8px 0;">${p.contactPerson}</td></tr>
  <tr><td style="padding:8px 0;color:#6b7280;">E-post</td><td style="padding:8px 0;">${p.contactEmail}</td></tr>
  <tr><td style="padding:8px 0;color:#6b7280;">Typ</td><td style="padding:8px 0;font-weight:600;">${p.typeLabel}</td></tr>
  <tr><td style="padding:8px 0;color:#6b7280;">Land</td><td style="padding:8px 0;">${p.country}</td></tr>
  ${p.services ? `<tr><td style="padding:8px 0;color:#6b7280;">Tjänster</td><td style="padding:8px 0;">${p.services}</td></tr>` : ''}
  ${p.documentType ? `<tr><td style="padding:8px 0;color:#6b7280;">Dokumenttyp</td><td style="padding:8px 0;">${p.documentType} × ${p.quantity || 1}</td></tr>` : ''}
  ${p.travelers ? `<tr><td style="padding:8px 0;color:#6b7280;">Resenärer</td><td style="padding:8px 0;">${p.travelers}</td></tr>` : ''}
  <tr><td style="padding:8px 0;color:#6b7280;">DHL-upphämtning</td><td style="padding:8px 0;">${p.pickup}</td></tr>
  ${p.additionalNotes ? `<tr><td style="padding:8px 0;color:#6b7280;">Meddelande</td><td style="padding:8px 0;">${p.additionalNotes}</td></tr>` : ''}
</table>`.trim();
}
