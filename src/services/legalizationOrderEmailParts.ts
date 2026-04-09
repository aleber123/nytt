/**
 * Helper builders for legalization order confirmation email content blocks.
 *
 * These produce HTML strings that get injected into the editable email
 * templates as `{{orderSummary}}` and `{{nextStepsBlock}}` variables. The
 * structure mirrors what was previously inline-built in Step10ReviewSubmit
 * so the new templated emails look the same as the legacy ones.
 */

interface OrderSummaryParams {
  orderNumber: string;
  countryName: string;
  documentType: string;
  quantity: number;
  services: string;
  totalPrice?: number;
  locale: 'sv' | 'en';
}

export function buildLegalizationOrderSummaryHtml(params: OrderSummaryParams): string {
  const isEn = params.locale === 'en';
  const dateStr = new Date().toLocaleDateString(isEn ? 'en-GB' : 'sv-SE');
  return `
<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:20px;margin:20px 0;">
  <div style="background:#0EB0A6;color:#fff;padding:10px 16px;border-radius:6px;display:inline-block;font-weight:700;font-size:15px;margin-bottom:12px;">
    ${isEn ? 'Order number' : 'Ordernummer'}: #${params.orderNumber}
  </div>
  <table style="width:100%;border-collapse:collapse;font-size:14px;margin-top:8px;">
    <tr><td style="padding:8px 0;color:#5f6368;border-bottom:1px solid #eaecef;">${isEn ? 'Date' : 'Datum'}:</td><td style="padding:8px 0;text-align:right;font-weight:700;color:#202124;border-bottom:1px solid #eaecef;">${dateStr}</td></tr>
    <tr><td style="padding:8px 0;color:#5f6368;border-bottom:1px solid #eaecef;">${isEn ? 'Country' : 'Land'}:</td><td style="padding:8px 0;text-align:right;font-weight:700;color:#202124;border-bottom:1px solid #eaecef;">${params.countryName}</td></tr>
    <tr><td style="padding:8px 0;color:#5f6368;border-bottom:1px solid #eaecef;">${isEn ? 'Document type' : 'Dokumenttyp'}:</td><td style="padding:8px 0;text-align:right;font-weight:700;color:#202124;border-bottom:1px solid #eaecef;">${params.documentType}</td></tr>
    <tr><td style="padding:8px 0;color:#5f6368;border-bottom:1px solid #eaecef;">${isEn ? 'Number of documents' : 'Antal dokument'}:</td><td style="padding:8px 0;text-align:right;font-weight:700;color:#202124;border-bottom:1px solid #eaecef;">${params.quantity} ${isEn ? 'pcs' : 'st'}</td></tr>
    <tr><td style="padding:8px 0;color:#5f6368;${params.totalPrice != null ? 'border-bottom:1px solid #eaecef;' : ''}">${isEn ? 'Selected services' : 'Valda tjänster'}:</td><td style="padding:8px 0;text-align:right;font-weight:700;color:#202124;${params.totalPrice != null ? 'border-bottom:1px solid #eaecef;' : ''}">${params.services}</td></tr>
    ${params.totalPrice != null ? `<tr><td style="padding:8px 0;color:#5f6368;">${isEn ? 'Total' : 'Totalt'}:</td><td style="padding:8px 0;text-align:right;font-weight:800;color:#202124;font-size:15px;">${params.totalPrice} kr</td></tr>` : ''}
  </table>
</div>`.trim();
}

/**
 * Green confirmation box shown to upload-flow customers ("we have your documents,
 * no need to send physical originals").
 */
export function buildLegalizationDeliveredConfirmationHtml(locale: 'sv' | 'en'): string {
  const isEn = locale === 'en';
  return `
<div style="background:#ecfdf5;border:1px solid #a7f3d0;border-radius:8px;padding:18px;margin:20px 0;">
  <h3 style="color:#065f46;margin:0 0 8px;font-size:16px;">✅ ${isEn ? 'We have your documents' : 'Vi har dina dokument'}</h3>
  <p style="color:#047857;margin:0;font-size:14px;">${isEn ? "You don't need to send any physical originals. We are starting the processing immediately and will keep you updated by email." : 'Du behöver inte skicka in några originaldokument. Vi börjar handläggningen direkt och återkommer med uppdateringar via mail.'}</p>
</div>`.trim();
}

interface NextStepsParams {
  orderNumber: string;
  returnServiceLabel?: string;
  hasPickup?: boolean;
  locale: 'sv' | 'en';
  baseUrl?: string;
}

export function buildLegalizationNextStepsHtml(params: NextStepsParams): string {
  const isEn = params.locale === 'en';
  const baseUrl = params.baseUrl || 'https://doxvl.se';

  if (params.hasPickup) {
    return `
<div style="background:#ecfdf5;border:1px solid #a7f3d0;border-radius:8px;padding:18px;margin:20px 0;">
  <h3 style="color:#065f46;margin:0 0 8px;font-size:17px;">📦 ${isEn ? 'Next steps' : 'Nästa steg'}</h3>
  <p style="color:#047857;margin:0 0 8px;font-size:14px;">${isEn ? 'You have selected <strong>pickup service</strong>. We will send you a DHL shipping label with pickup instructions by email within 1 business day.' : 'Du har valt <strong>upphämtning</strong>. Vi skickar dig en DHL-fraktsedel med upphämtningsinstruktioner via mail inom 1 arbetsdag.'}</p>
</div>`.trim();
  }

  return `
<div style="background:#ecfdf5;border:1px solid #a7f3d0;border-radius:8px;padding:18px;margin:20px 0;">
  <h3 style="color:#065f46;margin:0 0 8px;font-size:17px;">📦 ${isEn ? 'Next steps' : 'Nästa steg'}</h3>
  <p style="color:#047857;margin:0 0 14px;font-size:14px;">${isEn ? 'Send your original documents to one of the following addresses depending on your shipping method:' : 'Skicka dina originaldokument till en av följande adresser beroende på din fraktmetod:'}</p>

  <div style="background:#fff;border:1px solid #a7f3d0;border-radius:6px;padding:14px;margin-bottom:10px;">
    <p style="margin:0 0 6px;font-weight:700;color:#065f46;font-size:14px;">📮 ${isEn ? 'Registered mail (REK)' : 'REK (Rekommenderat brev)'}</p>
    <div style="font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,'Liberation Mono','Courier New',monospace;font-size:13px;color:#374151;line-height:1.5;">
      DOX Visumpartner AB<br>
      ${isEn ? 'Att: Document Handling' : 'Att: Dokumenthantering'}<br>
      Box 38<br>
      121 25 Stockholm-Globen<br>
      ${isEn ? 'Sweden' : 'Sverige'}
    </div>
  </div>

  <div style="background:#fff;border:1px solid #a7f3d0;border-radius:6px;padding:14px;margin-bottom:10px;">
    <p style="margin:0 0 6px;font-weight:700;color:#065f46;font-size:14px;">🚚 ${isEn ? 'Courier / DHL' : 'BUD / DHL'}</p>
    <div style="font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,'Liberation Mono','Courier New',monospace;font-size:13px;color:#374151;line-height:1.5;">
      DOX Visumpartner AB<br>
      ${isEn ? 'Att: Document Handling' : 'Att: Dokumenthantering'}<br>
      Livdjursgatan 4, ${isEn ? 'floor 6' : 'våning 6'}<br>
      121 62 Johanneshov<br>
      ${isEn ? 'Sweden' : 'Sverige'}
    </div>
  </div>

  <p style="margin:12px 0 0;font-size:13px;color:#065f46;"><strong>${isEn ? 'Important' : 'Viktigt'}:</strong> ${isEn ? `Mark the shipment with "Order #${params.orderNumber}".` : `Märk försändelsen med "Order #${params.orderNumber}".`}</p>

  <p style="margin:14px 0 8px;font-size:13px;color:#047857;">🖨️ ${isEn ? 'Print a shipping label with your order number:' : 'Skriv ut en fraktsedel med ditt ordernummer:'}</p>
  <a href="${baseUrl}/print-shipping-label?order=${params.orderNumber}" style="display:inline-block;background:#065f46;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:700;font-size:14px;">${isEn ? 'Print shipping label' : 'Skriv ut fraktsedel'}</a>

  ${params.returnServiceLabel ? `<p style="margin:14px 0 0;font-size:13px;color:#5f6368;">${isEn ? 'Your legalized documents will be returned via' : 'Du kommer att få dina legaliserade dokument returnerade via'} <strong>${params.returnServiceLabel}</strong>.</p>` : ''}
</div>`.trim();
}
