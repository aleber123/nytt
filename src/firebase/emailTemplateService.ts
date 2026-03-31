/**
 * Email Template Service
 *
 * Stores editable email template overrides in Firestore.
 * When sending emails, check here first — fall back to hardcoded templates if no override exists.
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './config';

// ============================================================
// TYPES
// ============================================================

export type EmailCategory =
  | 'order-confirmation'
  | 'visa-status'
  | 'document-handling'
  | 'shipping'
  | 'billing'
  | 'custom';

export type EmailTrigger =
  | 'automatic'   // Fires automatically on event
  | 'manual'      // Admin clicks a button to send
  | 'scheduled';  // Sent on a schedule/cron

export interface EmailTemplateVariable {
  key: string;        // e.g. "customerName"
  description: string; // e.g. "Kundens förnamn"
  example: string;     // e.g. "Erik"
}

export interface EmailTemplate {
  id: string;
  name: string;                // Display name, e.g. "Orderbekräftelse"
  nameEn: string;              // English name
  description: string;         // When/why this email is sent (Swedish)
  descriptionEn: string;       // English description
  category: EmailCategory;
  trigger: EmailTrigger;
  triggerEvent: string;        // Technical event, e.g. "order.created", "visa.approved"

  // Process map positioning
  processStep: number;         // Order in the process flow (1-based)
  processGroup: string;        // Group label, e.g. "Beställning", "Handläggning"

  // Template content (editable)
  subjectSv: string;
  subjectEn: string;
  bodySv: string;              // HTML body or key text blocks (Swedish)
  bodyEn: string;              // HTML body or key text blocks (English)

  // Available variables for this template
  variables: EmailTemplateVariable[];

  // Source reference
  sourceFile: string;          // Where the hardcoded template lives
  sourceFunction: string;      // Function name in source file

  // State
  isCustomized: boolean;       // Has admin overridden the default?
  isActive: boolean;
  lastEditedBy?: string;
  lastEditedAt?: any;
  createdAt?: any;
  updatedAt?: any;
}

// ============================================================
// COLLECTION REF
// ============================================================

const COLLECTION = 'emailTemplates';
const collectionRef = () => collection(db, COLLECTION);
const docRef = (id: string) => doc(db, COLLECTION, id);

// ============================================================
// CRUD
// ============================================================

export async function getAllEmailTemplates(): Promise<EmailTemplate[]> {
  const snap = await getDocs(collectionRef());
  const templates = snap.docs.map(d => ({ id: d.id, ...d.data() } as EmailTemplate));
  return templates.sort((a, b) => (a.processStep || 0) - (b.processStep || 0));
}

export async function getEmailTemplate(id: string): Promise<EmailTemplate | null> {
  const snap = await getDoc(docRef(id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as EmailTemplate;
}

export async function saveEmailTemplate(template: EmailTemplate): Promise<void> {
  const { id, ...data } = template;
  await setDoc(docRef(id), {
    ...data,
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

export async function updateEmailTemplateContent(
  id: string,
  updates: {
    subjectSv?: string;
    subjectEn?: string;
    bodySv?: string;
    bodyEn?: string;
    isCustomized?: boolean;
    lastEditedBy?: string;
  }
): Promise<void> {
  await updateDoc(docRef(id), {
    ...updates,
    isCustomized: true,
    updatedAt: serverTimestamp(),
    lastEditedAt: serverTimestamp(),
  });
}

export async function deleteEmailTemplate(id: string): Promise<void> {
  await deleteDoc(docRef(id));
}

// ============================================================
// SEED — Default template catalog (all 20 customer-facing emails)
// ============================================================

export const DEFAULT_EMAIL_TEMPLATES: Omit<EmailTemplate, 'createdAt' | 'updatedAt'>[] = [
  // === ORDER CONFIRMATION ===
  {
    id: 'order-confirmation-legalization',
    name: 'Orderbekräftelse (Legalisering)',
    nameEn: 'Order Confirmation (Legalization)',
    description: 'Skickas automatiskt till kund efter godkänd betalning av legaliseringsorder.',
    descriptionEn: 'Sent automatically to customer after successful payment for legalization order.',
    category: 'order-confirmation',
    trigger: 'automatic',
    triggerEvent: 'order.created.legalization',
    processStep: 1,
    processGroup: 'Beställning',
    subjectSv: 'Bekräftelse på din beställning',
    subjectEn: 'Order Confirmation',
    bodySv: 'Tack för din beställning! Vi har tagit emot din order och kommer att påbörja handläggningen.',
    bodyEn: 'Thank you for your order! We have received your order and will begin processing.',
    variables: [
      { key: 'customerName', description: 'Kundens namn', example: 'Erik' },
      { key: 'orderNumber', description: 'Ordernummer', example: 'SWE000325' },
      { key: 'orderSummary', description: 'Ordersammanfattning (HTML)', example: '<table>...</table>' },
    ],
    sourceFile: 'src/components/order/steps/Step10ReviewSubmit.tsx',
    sourceFunction: 'generateCustomerConfirmationEmail',
    isCustomized: false,
    isActive: true,
  },
  {
    id: 'order-confirmation-visa',
    name: 'Orderbekräftelse (Visum)',
    nameEn: 'Order Confirmation (Visa)',
    description: 'Skickas automatiskt till kund efter godkänd betalning av visumorder.',
    descriptionEn: 'Sent automatically to customer after successful visa order payment.',
    category: 'order-confirmation',
    trigger: 'automatic',
    triggerEvent: 'order.created.visa',
    processStep: 1,
    processGroup: 'Beställning',
    subjectSv: 'Bekräftelse på din visumbeställning',
    subjectEn: 'Visa Order Confirmation',
    bodySv: 'Tack för din visumbeställning! Vi har tagit emot din ansökan och kommer att börja handlägga den.',
    bodyEn: 'Thank you for your visa order! We have received your application and will begin processing.',
    variables: [
      { key: 'customerName', description: 'Kundens namn', example: 'Erik' },
      { key: 'orderNumber', description: 'Ordernummer', example: 'VISA000451' },
      { key: 'destinationCountry', description: 'Destinationsland', example: 'Thailand' },
      { key: 'visaProduct', description: 'Visumprodukt', example: 'Turistvisum 60 dagar' },
      { key: 'travelers', description: 'Lista resenärer', example: 'Erik Svensson, Anna Svensson' },
    ],
    sourceFile: 'src/components/order/visa/VisaStep10Review.tsx',
    sourceFunction: 'generateVisaConfirmationEmail',
    isCustomized: false,
    isActive: true,
  },

  // === DOCUMENT HANDLING ===
  {
    id: 'document-instructions',
    name: 'Dokumentinstruktioner',
    nameEn: 'Document Instructions',
    description: 'Handläggare skickar lista med dokument kunden behöver skicka in. Delas upp i post/digitalt.',
    descriptionEn: 'Admin sends list of documents customer needs to submit. Split into postal/digital.',
    category: 'document-handling',
    trigger: 'manual',
    triggerEvent: 'admin.sendDocumentInstructions',
    processStep: 2,
    processGroup: 'Dokumenthantering',
    subjectSv: 'Dokument som behövs för din ansökan',
    subjectEn: 'Documents needed for your application',
    bodySv: 'För att handlägga din ansökan behöver vi följande dokument.',
    bodyEn: 'To process your application, we need the following documents.',
    variables: [
      { key: 'customerName', description: 'Kundens namn', example: 'Erik' },
      { key: 'orderNumber', description: 'Ordernummer', example: 'VISA000451' },
      { key: 'postalDocuments', description: 'Dokument per post (HTML-lista)', example: '📄 Pass i original' },
      { key: 'digitalDocuments', description: 'Dokument digitalt (HTML-lista)', example: '📸 Passfoto' },
    ],
    sourceFile: 'src/pages/admin/orders/[id].tsx',
    sourceFunction: 'sendDocumentInstructionsEmail',
    isCustomized: false,
    isActive: true,
  },
  {
    id: 'document-request',
    name: 'Kompletteringsbegäran',
    nameEn: 'Document Request',
    description: 'Handläggare begär kompletterande dokument med uppladdningslänk.',
    descriptionEn: 'Admin requests additional documents with upload link.',
    category: 'document-handling',
    trigger: 'manual',
    triggerEvent: 'admin.sendDocumentRequest',
    processStep: 3,
    processGroup: 'Dokumenthantering',
    subjectSv: 'Begäran om komplettering',
    subjectEn: 'Document request',
    bodySv: 'Vi behöver ytterligare dokument för att kunna handlägga din ansökan.',
    bodyEn: 'We need additional documents to process your application.',
    variables: [
      { key: 'customerName', description: 'Kundens namn', example: 'Erik' },
      { key: 'orderNumber', description: 'Ordernummer', example: 'VISA000451' },
      { key: 'customMessage', description: 'Handläggarens meddelande', example: 'Vi behöver en tydligare kopia...' },
      { key: 'uploadUrl', description: 'Uppladdningslänk', example: 'https://doxvl.se/upload/...' },
    ],
    sourceFile: 'src/pages/api/document-request/send.ts',
    sourceFunction: 'generateEmailHtml',
    isCustomized: false,
    isActive: true,
  },

  // === VISA STATUS UPDATES ===
  {
    id: 'visa-docs-received',
    name: 'Dokument mottagna',
    nameEn: 'Documents Received',
    description: 'Bekräftelse till kund att vi tagit emot deras dokument.',
    descriptionEn: 'Confirmation to customer that we received their documents.',
    category: 'visa-status',
    trigger: 'manual',
    triggerEvent: 'visa.docsReceived',
    processStep: 4,
    processGroup: 'Handläggning',
    subjectSv: 'Vi har mottagit dina dokument',
    subjectEn: 'We have received your documents',
    bodySv: 'Vi bekräftar att vi mottagit dina dokument. Vårt team granskar nu din ansökan.',
    bodyEn: 'We confirm that we have received your documents. Our team is now reviewing your application.',
    variables: [
      { key: 'customerName', description: 'Kundens namn', example: 'Erik' },
      { key: 'orderNumber', description: 'Ordernummer', example: 'VISA000451' },
      { key: 'destinationCountry', description: 'Destinationsland', example: 'Thailand' },
    ],
    sourceFile: 'src/components/order/templates/visaStatusUpdateEmail.ts',
    sourceFunction: 'generateVisaDocsReceivedEmail',
    isCustomized: false,
    isActive: true,
  },
  {
    id: 'visa-submitted-portal',
    name: 'Ansökan inskickad (portal)',
    nameEn: 'Application Submitted (Portal)',
    description: 'Bekräftelse att visumansökan skickats in via portalen.',
    descriptionEn: 'Confirmation that visa application was submitted via portal.',
    category: 'visa-status',
    trigger: 'manual',
    triggerEvent: 'visa.submittedPortal',
    processStep: 5,
    processGroup: 'Handläggning',
    subjectSv: 'Din visumansökan har skickats in',
    subjectEn: 'Your visa application has been submitted',
    bodySv: 'Vi har nu skickat in din visumansökan. Du kommer att få besked så snart vi har ett svar.',
    bodyEn: 'We have now submitted your visa application. You will be notified as soon as we have a response.',
    variables: [
      { key: 'customerName', description: 'Kundens namn', example: 'Erik' },
      { key: 'orderNumber', description: 'Ordernummer', example: 'VISA000451' },
      { key: 'destinationCountry', description: 'Destinationsland', example: 'Indien' },
    ],
    sourceFile: 'src/components/order/templates/visaStatusUpdateEmail.ts',
    sourceFunction: 'generateVisaSubmittedEmail',
    isCustomized: false,
    isActive: true,
  },
  {
    id: 'visa-embassy-submitted',
    name: 'Inskickad till ambassad',
    nameEn: 'Submitted to Embassy',
    description: 'Bekräftelse att passet lämnats in till ambassaden (sticker-visum).',
    descriptionEn: 'Confirmation that passport was submitted to embassy (sticker visa).',
    category: 'visa-status',
    trigger: 'manual',
    triggerEvent: 'visa.embassySubmitted',
    processStep: 6,
    processGroup: 'Handläggning',
    subjectSv: 'Ditt pass har lämnats in till ambassaden',
    subjectEn: 'Your passport has been submitted to the embassy',
    bodySv: 'Vi har lämnat in ditt pass och din ansökan till ambassaden.',
    bodyEn: 'We have submitted your passport and application to the embassy.',
    variables: [
      { key: 'customerName', description: 'Kundens namn', example: 'Erik' },
      { key: 'orderNumber', description: 'Ordernummer', example: 'VISA000451' },
      { key: 'destinationCountry', description: 'Destinationsland', example: 'Kina' },
    ],
    sourceFile: 'src/components/order/templates/visaStatusUpdateEmail.ts',
    sourceFunction: 'generateVisaEmbassySubmittedEmail',
    isCustomized: false,
    isActive: true,
  },
  {
    id: 'visa-approved',
    name: 'Visum godkänt',
    nameEn: 'Visa Approved',
    description: 'Goda nyheter — visumet har beviljats!',
    descriptionEn: 'Great news — the visa has been approved!',
    category: 'visa-status',
    trigger: 'manual',
    triggerEvent: 'visa.approved',
    processStep: 7,
    processGroup: 'Resultat',
    subjectSv: 'Goda nyheter! Ditt visum har godkänts',
    subjectEn: 'Great news! Your visa has been approved',
    bodySv: 'Vi har goda nyheter — ditt visum har godkänts!',
    bodyEn: 'We have great news — your visa has been approved!',
    variables: [
      { key: 'customerName', description: 'Kundens namn', example: 'Erik' },
      { key: 'orderNumber', description: 'Ordernummer', example: 'VISA000451' },
      { key: 'destinationCountry', description: 'Destinationsland', example: 'USA' },
      { key: 'visaProduct', description: 'Visumprodukt', example: 'B1/B2 Turistvisum' },
    ],
    sourceFile: 'src/components/order/templates/visaStatusUpdateEmail.ts',
    sourceFunction: 'generateVisaApprovedEmail',
    isCustomized: false,
    isActive: true,
  },
  {
    id: 'visa-rejected',
    name: 'Visum avslaget',
    nameEn: 'Visa Rejected',
    description: 'Meddelande att visumansökan har avslagits.',
    descriptionEn: 'Notification that visa application was denied.',
    category: 'visa-status',
    trigger: 'manual',
    triggerEvent: 'visa.rejected',
    processStep: 7,
    processGroup: 'Resultat',
    subjectSv: 'Uppdatering om visumansökan',
    subjectEn: 'Visa application update',
    bodySv: 'Vi beklagar att meddela att din visumansökan tyvärr har avslagits.',
    bodyEn: 'We regret to inform you that your visa application has been denied.',
    variables: [
      { key: 'customerName', description: 'Kundens namn', example: 'Erik' },
      { key: 'orderNumber', description: 'Ordernummer', example: 'VISA000451' },
      { key: 'destinationCountry', description: 'Destinationsland', example: 'Australien' },
    ],
    sourceFile: 'src/components/order/templates/visaStatusUpdateEmail.ts',
    sourceFunction: 'generateVisaRejectedEmail',
    isCustomized: false,
    isActive: true,
  },

  // === DELIVERY ===
  {
    id: 'evisa-delivery',
    name: 'E-visum levererat',
    nameEn: 'E-Visa Delivered',
    description: 'E-visumet skickas som bilaga till kund.',
    descriptionEn: 'E-visa sent as attachment to customer.',
    category: 'visa-status',
    trigger: 'manual',
    triggerEvent: 'visa.evisaDelivered',
    processStep: 8,
    processGroup: 'Leverans',
    subjectSv: 'Ditt e-visum är klart!',
    subjectEn: 'Your e-visa is ready!',
    bodySv: 'Ditt e-visum är nu klart och bifogas i detta mail.',
    bodyEn: 'Your e-visa is now ready and attached to this email.',
    variables: [
      { key: 'customerName', description: 'Kundens namn', example: 'Erik' },
      { key: 'orderNumber', description: 'Ordernummer', example: 'VISA000451' },
      { key: 'destinationCountry', description: 'Destinationsland', example: 'Indien' },
    ],
    sourceFile: 'src/components/order/templates/visaStatusUpdateEmail.ts',
    sourceFunction: 'generateEVisaDeliveryEmail',
    isCustomized: false,
    isActive: true,
  },
  {
    id: 'visa-return-shipping',
    name: 'Pass skickat (retur)',
    nameEn: 'Passport Shipped (Return)',
    description: 'Kundens pass har skickats tillbaka med spårningsnummer.',
    descriptionEn: 'Customer passport shipped back with tracking number.',
    category: 'shipping',
    trigger: 'manual',
    triggerEvent: 'visa.returnShipping',
    processStep: 8,
    processGroup: 'Leverans',
    subjectSv: 'Ditt pass har skickats',
    subjectEn: 'Your passport has been shipped',
    bodySv: 'Vi har skickat ditt pass. Här är din spårningsinformation.',
    bodyEn: 'We have shipped your passport. Here is your tracking information.',
    variables: [
      { key: 'customerName', description: 'Kundens namn', example: 'Erik' },
      { key: 'orderNumber', description: 'Ordernummer', example: 'VISA000451' },
      { key: 'trackingNumber', description: 'Spårningsnummer', example: 'JJD000390001234' },
      { key: 'trackingUrl', description: 'Spårningslänk', example: 'https://tracking.dhl.com/...' },
    ],
    sourceFile: 'src/components/order/templates/visaStatusUpdateEmail.ts',
    sourceFunction: 'generateVisaReturnShippingEmail',
    isCustomized: false,
    isActive: true,
  },
  {
    id: 'dhl-pickup-label',
    name: 'DHL upphämtningsetikett',
    nameEn: 'DHL Pickup Label',
    description: 'Skickar DHL-etikett och upphämtningsinstruktioner till kund.',
    descriptionEn: 'Sends DHL label and pickup instructions to customer.',
    category: 'shipping',
    trigger: 'manual',
    triggerEvent: 'admin.sendPickupLabel',
    processStep: 2,
    processGroup: 'Dokumenthantering',
    subjectSv: 'Upphämtningsinstruktioner',
    subjectEn: 'Pickup Instructions',
    bodySv: 'Här är din DHL-etikett och instruktioner för upphämtning.',
    bodyEn: 'Here is your DHL label and pickup instructions.',
    variables: [
      { key: 'customerName', description: 'Kundens namn', example: 'Erik' },
      { key: 'orderNumber', description: 'Ordernummer', example: 'VISA000451' },
      { key: 'trackingNumber', description: 'DHL spårningsnummer', example: 'JJD000390001234' },
      { key: 'pickupDate', description: 'Upphämtningsdatum', example: '2026-04-15' },
      { key: 'pickupAddress', description: 'Upphämtningsadress', example: 'Storgatan 1, Stockholm' },
    ],
    sourceFile: 'src/pages/api/dhl/send-pickup-label.ts',
    sourceFunction: 'generatePickupEmailHtml',
    isCustomized: false,
    isActive: true,
  },

  // === ADDRESS & PRICE CONFIRMATIONS ===
  {
    id: 'address-confirmation',
    name: 'Adressbekräftelse',
    nameEn: 'Address Confirmation',
    description: 'Bekräfta/ändra hämtnings- eller returadress.',
    descriptionEn: 'Confirm/edit pickup or return address.',
    category: 'document-handling',
    trigger: 'manual',
    triggerEvent: 'admin.sendAddressConfirmation',
    processStep: 2,
    processGroup: 'Dokumenthantering',
    subjectSv: 'Bekräfta upphämtningsadress',
    subjectEn: 'Confirm pickup address',
    bodySv: 'Vänligen bekräfta att följande adress stämmer.',
    bodyEn: 'Please confirm that the following address is correct.',
    variables: [
      { key: 'customerName', description: 'Kundens namn', example: 'Erik' },
      { key: 'orderNumber', description: 'Ordernummer', example: 'SWE000325' },
      { key: 'address', description: 'Fullständig adress', example: 'Storgatan 1, 111 23 Stockholm' },
      { key: 'addressType', description: 'Typ (pickup/return)', example: 'pickup' },
    ],
    sourceFile: 'src/pages/api/address-confirmation/send.ts',
    sourceFunction: 'handler',
    isCustomized: false,
    isActive: true,
  },
  {
    id: 'embassy-price-confirmation',
    name: 'Ambassadavgift-bekräftelse',
    nameEn: 'Embassy Fee Confirmation',
    description: 'Bekräfta ny ambassadavgift med kund (vid prisändring).',
    descriptionEn: 'Confirm new embassy fee with customer (on price change).',
    category: 'billing',
    trigger: 'manual',
    triggerEvent: 'admin.sendEmbassyPriceConfirmation',
    processStep: 3,
    processGroup: 'Dokumenthantering',
    subjectSv: 'Bekräfta ambassadavgift',
    subjectEn: 'Confirm embassy fee',
    bodySv: 'Vi behöver din bekräftelse av den officiella ambassadavgiften.',
    bodyEn: 'We need your confirmation of the official embassy fee.',
    variables: [
      { key: 'customerName', description: 'Kundens namn', example: 'Erik' },
      { key: 'orderNumber', description: 'Ordernummer', example: 'SWE000325' },
      { key: 'originalPrice', description: 'Ursprungligt pris', example: '1500 kr' },
      { key: 'newPrice', description: 'Nytt pris', example: '1800 kr' },
    ],
    sourceFile: 'src/pages/api/embassy-price-confirmation/send.ts',
    sourceFunction: 'handler',
    isCustomized: false,
    isActive: true,
  },
  {
    id: 'quote',
    name: 'Offert',
    nameEn: 'Price Quote',
    description: 'Skicka prisförslag med godkänn/avböj-knappar.',
    descriptionEn: 'Send price quote with accept/decline buttons.',
    category: 'billing',
    trigger: 'manual',
    triggerEvent: 'admin.sendQuote',
    processStep: 1,
    processGroup: 'Beställning',
    subjectSv: 'Offert',
    subjectEn: 'Price Quote',
    bodySv: 'Här är vår offert baserad på dina önskemål.',
    bodyEn: 'Here is our quote based on your requirements.',
    variables: [
      { key: 'customerName', description: 'Kundens namn', example: 'Erik' },
      { key: 'orderNumber', description: 'Ordernummer', example: 'SWE000325' },
      { key: 'lineItems', description: 'Prisrader (HTML-tabell)', example: '<table>...</table>' },
      { key: 'totalAmount', description: 'Totalbelopp', example: '2500 kr' },
      { key: 'quoteUrl', description: 'Länk till offert', example: 'https://doxvl.se/quote/...' },
    ],
    sourceFile: 'src/pages/api/quote/send.ts',
    sourceFunction: 'generateQuoteEmailHtml',
    isCustomized: false,
    isActive: true,
  },

  // === FILES & PASSWORDS ===
  {
    id: 'send-files',
    name: 'Skicka filer till kund',
    nameEn: 'Send Files to Customer',
    description: 'Handläggare skickar färdiga dokument (e-visum, certifikat etc.) till kund.',
    descriptionEn: 'Admin sends completed documents (e-visa, certificates etc.) to customer.',
    category: 'document-handling',
    trigger: 'manual',
    triggerEvent: 'admin.sendFiles',
    processStep: 8,
    processGroup: 'Leverans',
    subjectSv: 'Dokument för din order',
    subjectEn: 'Documents for your order',
    bodySv: 'Här är dokumenten för din beställning.',
    bodyEn: 'Here are the documents for your order.',
    variables: [
      { key: 'customerName', description: 'Kundens namn', example: 'Erik' },
      { key: 'orderNumber', description: 'Ordernummer', example: 'VISA000451' },
      { key: 'fileList', description: 'Lista med filer (HTML)', example: '<ul><li>e-visa.pdf</li></ul>' },
      { key: 'customMessage', description: 'Meddelande från handläggare', example: 'Bifogat finner du...' },
    ],
    sourceFile: 'src/pages/api/admin/send-files-to-customer.ts',
    sourceFunction: 'generateFilesEmail',
    isCustomized: false,
    isActive: true,
  },
  {
    id: 'send-password',
    name: 'Lösenord för dokument',
    nameEn: 'Document Password',
    description: 'Skickar filens lösenord separat för säkerhet.',
    descriptionEn: 'Sends file password separately for security.',
    category: 'document-handling',
    trigger: 'manual',
    triggerEvent: 'admin.sendPassword',
    processStep: 8,
    processGroup: 'Leverans',
    subjectSv: 'Lösenord för ditt dokument',
    subjectEn: 'Password for your document',
    bodySv: 'Här är lösenordet för att öppna ditt dokument.',
    bodyEn: 'Here is the password to open your document.',
    variables: [
      { key: 'customerName', description: 'Kundens namn', example: 'Erik' },
      { key: 'orderNumber', description: 'Ordernummer', example: 'VISA000451' },
      { key: 'password', description: 'Lösenord', example: 'ABC123' },
    ],
    sourceFile: 'src/pages/api/admin/send-password-email.ts',
    sourceFunction: 'generatePasswordEmail',
    isCustomized: false,
    isActive: true,
  },

  // === CUSTOM / OTHER ===
  {
    id: 'custom-email',
    name: 'Anpassat mail',
    nameEn: 'Custom Email',
    description: 'Fritext-mail som handläggare skriver och skickar till kund.',
    descriptionEn: 'Free-text email written and sent by admin to customer.',
    category: 'custom',
    trigger: 'manual',
    triggerEvent: 'admin.sendCustomEmail',
    processStep: 0,
    processGroup: 'Övriga',
    subjectSv: '(Anpassad ämnesrad)',
    subjectEn: '(Custom subject)',
    bodySv: '(Handläggaren skriver fritt)',
    bodyEn: '(Admin writes freely)',
    variables: [
      { key: 'customerName', description: 'Kundens namn', example: 'Erik' },
      { key: 'orderNumber', description: 'Ordernummer', example: 'SWE000325' },
      { key: 'subject', description: 'Ämnesrad', example: 'Ang. din beställning' },
      { key: 'message', description: 'Meddelande', example: 'Hej Erik, ...' },
    ],
    sourceFile: 'src/pages/api/send-custom-email.ts',
    sourceFunction: 'generateEmailHtml',
    isCustomized: false,
    isActive: true,
  },
  {
    id: 'order-update-notification',
    name: 'Orderuppdatering',
    nameEn: 'Order Update Notification',
    description: 'Notis till kund när orderdetaljer ändras av handläggare.',
    descriptionEn: 'Notification when order details are changed by admin.',
    category: 'custom',
    trigger: 'manual',
    triggerEvent: 'admin.sendOrderUpdate',
    processStep: 0,
    processGroup: 'Övriga',
    subjectSv: 'Order uppdaterad',
    subjectEn: 'Order Updated',
    bodySv: 'Följande ändringar har gjorts i din beställning.',
    bodyEn: 'The following changes have been made to your order.',
    variables: [
      { key: 'customerName', description: 'Kundens namn', example: 'Erik' },
      { key: 'orderNumber', description: 'Ordernummer', example: 'SWE000325' },
      { key: 'changes', description: 'Ändringstabell (HTML)', example: '<table>Fält → Nytt värde</table>' },
      { key: 'customMessage', description: 'Meddelande från handläggare', example: '' },
    ],
    sourceFile: 'src/pages/api/order-update-notification/send.ts',
    sourceFunction: 'handler',
    isCustomized: false,
    isActive: true,
  },
  {
    id: 'invoice',
    name: 'Faktura',
    nameEn: 'Invoice',
    description: 'Faktura skickas till kund med bifogad PDF.',
    descriptionEn: 'Invoice sent to customer with attached PDF.',
    category: 'billing',
    trigger: 'manual',
    triggerEvent: 'admin.sendInvoice',
    processStep: 9,
    processGroup: 'Leverans',
    subjectSv: 'Din faktura',
    subjectEn: 'Your Invoice',
    bodySv: 'Bifogat finner du din faktura.',
    bodyEn: 'Please find your invoice attached.',
    variables: [
      { key: 'customerName', description: 'Kundens namn', example: 'Erik' },
      { key: 'orderNumber', description: 'Ordernummer', example: 'SWE000325' },
      { key: 'invoiceNumber', description: 'Fakturanummer', example: 'INV-2026-001' },
      { key: 'totalAmount', description: 'Totalbelopp', example: '2500 kr' },
    ],
    sourceFile: 'functions/index.js',
    sourceFunction: 'sendInvoiceEmail',
    isCustomized: false,
    isActive: true,
  },
];

/**
 * Seed all default templates into Firestore.
 * Skips templates that already exist (won't overwrite customized ones).
 */
export async function seedEmailTemplates(): Promise<{ created: number; skipped: number }> {
  let created = 0;
  let skipped = 0;

  for (const template of DEFAULT_EMAIL_TEMPLATES) {
    const existing = await getDoc(docRef(template.id));
    if (existing.exists()) {
      skipped++;
      continue;
    }
    await setDoc(docRef(template.id), {
      ...template,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    created++;
  }

  return { created, skipped };
}
