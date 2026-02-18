/**
 * Brazil Visa DPVN Auto-fill Script
 * 
 * Generates a JavaScript snippet that can be pasted into the browser console
 * on the Brazilian visa application website (DPVN Angular app) to auto-fill
 * all form fields from collected customer data.
 * 
 * The DPVN form has 6 sections navigated via tabs:
 * 1. General Data (Identification + Parents)
 * 2. Visa Data (Purpose, dates, previous visits)
 * 3. Documents (Passport, other docs)
 * 4. Professional Data (Job, employer)
 * 5. Contacts (Email, phone, address, Brazil contact)
 * 6. Biometric Data and Scanned Documents (Photo, signature, uploads)
 * 
 * File uploads (passport copy, criminal record, personbevis) must be done manually.
 */

export interface BrazilVisaData {
  // Identification
  givenNames: string;
  familyNames: string;
  dateOfBirth: string; // MM/DD/YYYY (Brazilian format)
  sex: 'Male' | 'Female';
  maritalStatus: string; // Single, Married, Divorced, Separated, Widowed, Stable Union, Other
  formerNames?: string;
  placeOfBirthCountry: string; // Country name as it appears in DPVN dropdown
  placeOfBirthState?: string;
  placeOfBirthCity: string;
  hasBrazilianNationality: boolean;
  otherNationalities?: string;

  // Passport
  passportNumber: string;
  passportIssuedBy: string;
  passportDateOfIssue: string; // MM/DD/YYYY
  passportDateOfExpiry: string; // MM/DD/YYYY

  // Parents
  motherGivenNames?: string;
  motherFamilyNames?: string;
  motherCountryOfBirth?: string;
  motherDateOfBirth?: string; // MM/DD/YYYY
  fatherGivenNames?: string;
  fatherFamilyNames?: string;
  fatherCountryOfBirth?: string;
  fatherDateOfBirth?: string; // MM/DD/YYYY

  // Travel
  estimatedArrivalDate: string; // MM/DD/YYYY
  plannedStayDays: string;
  previousVisitBrazil: boolean;
  previousVisitWhen?: string;

  // Professional
  profession: string;
  jobDescription: string;
  activitiesInBrazil: string;
  monthlyIncomeUSD: string;
  employerName: string;
  employerCountry: string;
  employerState?: string;
  employerCity: string;
  employerAddress: string;
  employerZipCode?: string;
  employerEmail?: string;
  employerPhone?: string;
  employerBusinessNature: string;

  // Contacts
  email: string;
  phone: string;
  permanentAddressCountry: string;
  permanentAddressState?: string;
  permanentAddressCity: string;
  permanentAddressStreet: string;
  permanentAddressZip: string;

  // Brazil contact
  brazilContactName?: string;
  brazilContactState?: string;
  brazilContactCity?: string;
  brazilContactAddress?: string;
  brazilContactZip?: string;
  brazilContactRelationship?: string; // Co-worker, Friend, Relative, Others
  brazilContactPhone?: string;

  // Document URLs (uploaded by admin in Form Fill tab)
  passportCopyUrl?: string;
  passportPhotoUrl?: string;
  criminalRecordUrl?: string;
  personbevisUrl?: string;
}

/**
 * Convert ISO date (YYYY-MM-DD) to Brazilian format (MM/DD/YYYY)
 */
function toBrazilDate(isoDate: string): string {
  if (!isoDate) return '';
  const parts = isoDate.split('-');
  if (parts.length !== 3) return isoDate;
  return `${parts[1]}/${parts[2]}/${parts[0]}`;
}

/**
 * Build BrazilVisaData from order + form submission data
 */
export function buildBrazilVisaDataFromOrder(
  order: any,
  travelerIndex: number,
  formSubmissionData?: Record<string, string>,
  uploadedDocs?: { id: string; downloadURL: string }[]
): BrazilVisaData | null {
  const travelers = order.travelers || [];
  const traveler = travelers[travelerIndex];
  if (!traveler) return null;

  const fd = formSubmissionData || {};
  const passport = traveler.passportData || {};
  const customer = order.customerInfo || {};

  const get = (fieldId: string) => fd[`${fieldId}_${travelerIndex}`] || fd[fieldId] || '';

  return {
    // Identification
    givenNames: get('givenNames') || get('firstName') || passport.givenNames || traveler.firstName || '',
    familyNames: get('familyNames') || get('lastName') || passport.surname || traveler.lastName || '',
    dateOfBirth: toBrazilDate(get('dateOfBirth') || passport.dateOfBirth || traveler.dateOfBirth || ''),
    sex: (get('sex') || get('gender') || passport.gender || '').includes('F') ? 'Female' : 'Male',
    maritalStatus: get('maritalStatus') || get('civilStatus') || 'Single',
    formerNames: get('formerNames') || '',
    placeOfBirthCountry: get('placeOfBirthCountry') || get('countryOfBirth') || '',
    placeOfBirthState: get('placeOfBirthState') || '',
    placeOfBirthCity: get('placeOfBirthCity') || get('placeOfBirth') || '',
    hasBrazilianNationality: false,
    otherNationalities: get('otherNationalities') || '',

    // Passport
    passportNumber: get('passportNumber') || passport.passportNumber || traveler.passportNumber || '',
    passportIssuedBy: get('passportIssuedBy') || get('issuedIn') || '',
    passportDateOfIssue: toBrazilDate(get('passportDateOfIssue') || get('dateOfIssue') || ''),
    passportDateOfExpiry: toBrazilDate(get('passportDateOfExpiry') || get('dateOfExpiry') || passport.expiryDate || traveler.passportExpiry || ''),

    // Parents
    motherGivenNames: get('motherGivenNames') || '',
    motherFamilyNames: get('motherFamilyNames') || '',
    motherCountryOfBirth: get('motherCountryOfBirth') || '',
    motherDateOfBirth: toBrazilDate(get('motherDateOfBirth') || ''),
    fatherGivenNames: get('fatherGivenNames') || '',
    fatherFamilyNames: get('fatherFamilyNames') || '',
    fatherCountryOfBirth: get('fatherCountryOfBirth') || '',
    fatherDateOfBirth: toBrazilDate(get('fatherDateOfBirth') || ''),

    // Travel
    estimatedArrivalDate: toBrazilDate(get('estimatedArrivalDate') || order.departureDate || ''),
    plannedStayDays: get('plannedStayDays') || '30',
    previousVisitBrazil: get('previousVisitBrazil') === 'Yes',
    previousVisitWhen: get('previousVisitWhen') || '',

    // Professional
    profession: get('profession') || '',
    jobDescription: get('jobDescription') || '',
    activitiesInBrazil: get('activitiesInBrazil') || '',
    monthlyIncomeUSD: get('monthlyIncomeUSD') || '',
    employerName: get('employerName') || '',
    employerCountry: get('employerCountry') || '',
    employerState: get('employerState') || '',
    employerCity: get('employerCity') || '',
    employerAddress: get('employerAddress') || '',
    employerZipCode: get('employerZipCode') || '',
    employerEmail: get('employerEmail') || '',
    employerPhone: get('employerPhone') || '',
    employerBusinessNature: get('employerBusinessNature') || '',

    // Contacts
    email: get('email') || customer.email || '',
    phone: get('phone') || customer.phone || '',
    permanentAddressCountry: get('permanentAddressCountry') || '',
    permanentAddressState: get('permanentAddressState') || '',
    permanentAddressCity: get('permanentAddressCity') || customer.city || '',
    permanentAddressStreet: get('permanentAddressStreet') || customer.address || '',
    permanentAddressZip: get('permanentAddressZip') || customer.postalCode || '',

    // Brazil contact
    brazilContactName: get('brazilContactName') || '',
    brazilContactState: get('brazilContactState') || '',
    brazilContactCity: get('brazilContactCity') || '',
    brazilContactAddress: get('brazilContactAddress') || '',
    brazilContactZip: get('brazilContactZip') || '',
    brazilContactRelationship: get('brazilContactRelationship') || '',
    brazilContactPhone: get('brazilContactPhone') || '',

    // Document URLs from admin uploads
    passportCopyUrl: uploadedDocs?.find(d => d.id === `passportCopy_${travelerIndex}`)?.downloadURL || '',
    passportPhotoUrl: uploadedDocs?.find(d => d.id === `passportPhoto_${travelerIndex}`)?.downloadURL || '',
    criminalRecordUrl: uploadedDocs?.find(d => d.id === `criminalRecord_${travelerIndex}`)?.downloadURL || '',
    personbevisUrl: uploadedDocs?.find(d => d.id === `personbevis_${travelerIndex}`)?.downloadURL || '',
  };
}

/**
 * Generate a console script that auto-fills the DPVN Angular form.
 * 
 * The script uses Angular's ngModel change detection by dispatching
 * 'input' and 'change' events after setting values.
 * 
 * Each section is a separate function so the operator can run them
 * one at a time as they navigate through the DPVN tabs.
 */
export function generateBrazilAutoFillScript(data: BrazilVisaData): string {
  // DPVN form uses English option text for marital status and relationship dropdowns
  const maritalStatusMap: Record<string, string> = {
    'Single': 'Single',
    'Married': 'Married',
    'Divorced': 'Divorced',
    'Separated': 'Separated',
    'Widowed': 'Widow',
    'Widow(er)': 'Widow',
    'Stable Union': 'Stable Union',
    'Other': 'Other',
  };

  const relationshipMap: Record<string, string> = {
    'Co-worker': 'Co-worker',
    'Friend': 'Friend',
    'Relative': 'Relative',
    'Neighbor': 'Neighbor',
    'Others': 'Others',
  };

  const escapeJS = (s: string) => (s || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n');

  return `
// ============================================================
// BRAZIL DPVN VISA AUTO-FILL SCRIPT
// Generated: ${new Date().toISOString()}
// Applicant: ${data.givenNames} ${data.familyNames}
// ============================================================

// Helper: set Angular input value and trigger change detection
function setVal(id, value) {
  const el = document.getElementById(id);
  if (!el) { console.warn('⚠️ Field not found:', id); return; }
  const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set
    || Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')?.set;
  if (nativeInputValueSetter) {
    nativeInputValueSetter.call(el, value);
  } else {
    el.value = value;
  }
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
  el.dispatchEvent(new Event('blur', { bubbles: true }));
  console.log('✅', id, '=', value);
}

// Helper: set select dropdown
function setSelect(id, value) {
  let el = document.getElementById(id);
  // Fallback: querySelector with escaped colons (Angular IDs often contain colons)
  if (!el) { try { el = document.querySelector('[id="' + id + '"]'); } catch(e) {} }
  if (!el) { console.warn('⚠️ Select not found:', id); return; }
  const options = el.querySelectorAll('option');
  let found = false;
  // 1st pass: exact match on value or text
  for (const opt of options) {
    const txt = opt.textContent.trim();
    if (opt.value === value || txt.toLowerCase() === value.toLowerCase()) {
      el.value = opt.value;
      found = true;
      break;
    }
  }
  // 2nd pass: partial match (includes) as fallback
  if (!found) {
    for (const opt of options) {
      if (opt.textContent.trim().toLowerCase().includes(value.toLowerCase())) {
        el.value = opt.value;
        found = true;
        break;
      }
    }
  }
  if (!found) {
    console.warn('⚠️ Option not found for', id, ':', value);
    el.value = value;
  }
  el.dispatchEvent(new Event('change', { bubbles: true }));
  el.dispatchEvent(new Event('input', { bubbles: true }));
  console.log('✅', id, '=', value);
}

// Helper: click radio button
function setRadio(id) {
  const el = document.getElementById(id);
  if (!el) { console.warn('⚠️ Radio not found:', id); return; }
  el.click();
  el.dispatchEvent(new Event('change', { bubbles: true }));
  console.log('✅ Radio:', id);
}

// Helper: set checkbox
function setCheckbox(id, checked) {
  const el = document.getElementById(id);
  if (!el) { console.warn('⚠️ Checkbox not found:', id); return; }
  if (el.checked !== checked) el.click();
  console.log('✅ Checkbox:', id, '=', checked);
}

// Helper: set Angular Material datepicker
function setDate(id, dateStr) {
  const el = document.getElementById(id);
  if (!el) { console.warn('⚠️ Date field not found:', id); return; }
  const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
  if (nativeInputValueSetter) {
    nativeInputValueSetter.call(el, dateStr);
  } else {
    el.value = dateStr;
  }
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
  el.dispatchEvent(new Event('blur', { bubbles: true }));
  console.log('✅ Date:', id, '=', dateStr);
}

// ============================================================
// SECTION 1: GENERAL DATA (Identification + Parents)
// Navigate to "General Data" tab first, then run:
// ============================================================
function fillGeneralData() {
  console.log('📋 Filling General Data...');
  
  // Identification
  setVal('prenome', '${escapeJS(data.givenNames)}');
  setVal('sobrenome', '${escapeJS(data.familyNames)}');
  setDate('indataNascimento', '${escapeJS(data.dateOfBirth)}');
  setSelect('comboEstadoCivil', '${maritalStatusMap[data.maritalStatus] || 'Single'}');
  setRadio('sexo:${data.sex === 'Female' ? '1' : '0'}');
  ${data.formerNames ? `setRadio('possuiNomeAnt:0'); // Yes, has former names` : `setRadio('possuiNomeAnt:1'); // No former names`}
  
  // Place of birth
  setSelect('comboPais', '${escapeJS(data.placeOfBirthCountry)}');
  ${data.placeOfBirthState ? `setVal('estado', '${escapeJS(data.placeOfBirthState)}');` : ''}
  setVal('lnCidade', '${escapeJS(data.placeOfBirthCity)}');
  
  // Nationality
  setRadio('radioNacionalidadeBR:${data.hasBrazilianNationality ? '0' : '1'}');
  setRadio('radioOutraNacionalidade:${data.otherNationalities ? '0' : '1'}');
  
  // Mother
  ${data.motherGivenNames ? `
  setVal('prenomeMae', '${escapeJS(data.motherGivenNames)}');
  setVal('sobrenomeMae', '${escapeJS(data.motherFamilyNames || '')}');
  ${data.motherCountryOfBirth ? `setSelect('comboPaisNacMae', '${escapeJS(data.motherCountryOfBirth)}');` : ''}
  ${data.motherDateOfBirth ? `setDate('inDataNascMae', '${escapeJS(data.motherDateOfBirth)}');` : ''}
  ` : `setCheckbox('ncMae', true); // Mother not informed`}
  
  // Father
  ${data.fatherGivenNames ? `
  setVal('prenomePai', '${escapeJS(data.fatherGivenNames)}');
  setVal('sobrenomePai', '${escapeJS(data.fatherFamilyNames || '')}');
  ${data.fatherCountryOfBirth ? `setSelect('comboPaisNacPai', '${escapeJS(data.fatherCountryOfBirth)}');` : ''}
  ${data.fatherDateOfBirth ? `setDate('inDataNascPai', '${escapeJS(data.fatherDateOfBirth)}');` : ''}
  ` : `setCheckbox('ncPai', true); // Father not informed`}
  
  // Legal representative — mark as not informed
  setCheckbox('ncRep', true);
  
  console.log('✅ General Data complete!');
}

// ============================================================
// SECTION 2: VISA DATA
// Navigate to "Visa Data" tab first, then run:
// ============================================================
function fillVisaData() {
  console.log('📋 Filling Visa Data...');
  
  setSelect('vistoObjetivoViagem', 'Business');
  setDate('invistoDtProvavelChegadaBR', '${escapeJS(data.estimatedArrivalDate)}');
  
  // Planned stay: "For" X days
  setRadio('vistoTipoPeriodoPrev:1'); // "For" (not "Until")
  setVal('vistoQtdeEstadiaPrev', '${escapeJS(data.plannedStayDays)}');
  setSelect('vistoUnEstadiaPrev', 'Day(s)');
  
  // Previous visit
  setRadio('vistoRadioEsteveBR:${data.previousVisitBrazil ? '0' : '1'}');
  
  // Exhibition: by mail or courier
  setSelect('vistoComboTipoApresentacao', 'By mail');
  
  console.log('✅ Visa Data complete!');
}

// ============================================================
// SECTION 3: DOCUMENTS
// Navigate to "Documents" tab first, then run:
// ============================================================
function fillDocuments() {
  console.log('📋 Filling Documents...');
  
  setSelect('comboTipoDocVisto', 'Passport');
  setVal('numeroDocViagemVisto', '${escapeJS(data.passportNumber)}');
  setSelect('orgaoDocViagemVisto', 'Sweden');
  setDate('dataExpedicaoDocViagemVisto', '${escapeJS(data.passportDateOfIssue)}');
  setDate('dataExpiracaoDocViagemVisto', '${escapeJS(data.passportDateOfExpiry)}');
  
  // Other document — not applicable
  setCheckbox('naoConstaOutroDoc', true);
  
  // CPF — unknown
  setCheckbox('ncCPF', true);
  
  console.log('✅ Documents complete!');
}

// ============================================================
// SECTION 4: PROFESSIONAL DATA
// Navigate to "Professional Data" tab first, then run:
// ============================================================
function fillProfessionalData() {
  console.log('📋 Filling Professional Data...');
  
  setVal('profissaoRequerente', '${escapeJS(data.profession)}');
  setVal('descricaoProfissaoRequerente', '${escapeJS(data.jobDescription)}');
  setVal('naturezaAtividadesRequerente', '${escapeJS(data.activitiesInBrazil)}');
  setVal('remuneracaoMensal', '${escapeJS(data.monthlyIncomeUSD)}');
  
  // Employer
  setVal('nomeEmpregador', '${escapeJS(data.employerName)}');
  setSelect('enderecoEmpregadorPais', '${escapeJS(data.employerCountry)}');
  ${data.employerState ? `setVal('ufEmpregador', '${escapeJS(data.employerState)}');` : ''}
  setVal('enderecoEmpregadorCidade', '${escapeJS(data.employerCity)}');
  setVal('enderecoEmpregadorLogradouro', '${escapeJS(data.employerAddress)}');
  ${data.employerZipCode ? `setVal('enderecoEmpregadorCEP', '${escapeJS(data.employerZipCode)}');` : ''}
  ${data.employerEmail ? `setVal('emailEmpregador', '${escapeJS(data.employerEmail)}');` : ''}
  ${data.employerPhone ? `setVal('foneEmpregador', '${escapeJS(data.employerPhone)}');` : ''}
  setVal('naturezaAtividadesEmpregador', '${escapeJS(data.employerBusinessNature)}');
  
  console.log('✅ Professional Data complete!');
}

// ============================================================
// SECTION 5: CONTACTS
// Navigate to "Contacts" tab first, then run:
// ============================================================
function fillContacts() {
  console.log('📋 Filling Contacts...');
  
  setVal('email', '${escapeJS(data.email)}');
  setVal('telefone', '${escapeJS(data.phone)}');
  
  // Permanent address
  setSelect('enderecoPermanentePais', '${escapeJS(data.permanentAddressCountry)}');
  ${data.permanentAddressState ? `setVal('enderecoPermanenteUF', '${escapeJS(data.permanentAddressState)}');` : ''}
  setVal('enderecoPermanenteCidade', '${escapeJS(data.permanentAddressCity)}');
  setVal('enderecoPermanenteLogradouro', '${escapeJS(data.permanentAddressStreet)}');
  setVal('enderecoPermanenteCEP', '${escapeJS(data.permanentAddressZip)}');
  setRadio('endPermanenteCorrespondencia:0'); // Yes, this is correspondence address
  
  // Contact in Brazil
  ${data.brazilContactName ? `
  setVal('0:contatoNome', '${escapeJS(data.brazilContactName)}');
  setSelect('0:contatoPais', 'Brazil');
  ${data.brazilContactState ? `setSelect('0:contatoUFBrasil', '${escapeJS(data.brazilContactState)}');` : ''}
  ${data.brazilContactCity ? `setVal('0:contatoCidade', '${escapeJS(data.brazilContactCity)}');` : ''}
  ${data.brazilContactAddress ? `setVal('0:contatoLogradouro', '${escapeJS(data.brazilContactAddress)}');` : ''}
  ${data.brazilContactZip ? `setVal('contatoCEP', '${escapeJS(data.brazilContactZip)}');` : ''}
  ${data.brazilContactRelationship ? `setSelect('0:contatoTipoRelacao', '${relationshipMap[data.brazilContactRelationship] || 'Others'}');` : ''}
  ${data.brazilContactPhone ? `
  setSelect('0:0:formaContato', 'Cell Phone');
  setVal('0:0:contatoConteudo', '${escapeJS(data.brazilContactPhone)}');
  ` : ''}
  ` : `setCheckbox('csrNcPessoaContatar', true); // No contact in Brazil`}
  
  console.log('✅ Contacts complete!');
}

// ============================================================
// SECTION 6: BIOMETRIC DATA
// Navigate to "Biometric Data" tab.
// File uploads must be done MANUALLY:
// - uploadArqBio_foto → Passport photo
// - uploadArqBio_assinatura → Signature
// - comboTipoDocUpload_dig → Select "Passport" then upload passport copy
// - Then add Criminal Record and Personbevis uploads
// ============================================================
function fillBiometricData() {
  console.log('📋 Biometric Data section...');
  console.log('');
  console.log('⬇️  DOWNLOAD DOCUMENTS AND UPLOAD THEM BELOW:');
  console.log('─'.repeat(50));
${data.passportPhotoUrl ? `  console.log('📷 Passport Photo:  ${escapeJS(data.passportPhotoUrl)}');` : `  console.log('⚠️ Passport Photo: NOT UPLOADED');`}
${data.passportCopyUrl ? `  console.log('📘 Passport Copy:   ${escapeJS(data.passportCopyUrl)}');` : `  console.log('⚠️ Passport Copy: NOT UPLOADED');`}
${data.criminalRecordUrl ? `  console.log('📄 Criminal Record: ${escapeJS(data.criminalRecordUrl)}');` : `  console.log('⚠️ Criminal Record: NOT UPLOADED');`}
${data.personbevisUrl ? `  console.log('📋 Personbevis:     ${escapeJS(data.personbevisUrl)}');` : `  console.log('⚠️ Personbevis: NOT UPLOADED');`}
  console.log('─'.repeat(50));
  console.log('');
  console.log('📌 UPLOAD STEPS:');
  console.log('  1. Click links above → download each file');
  console.log('  2. Upload passport PHOTO to "uploadArqBio_foto"');
  console.log('  3. Upload SIGNATURE to "uploadArqBio_assinatura" (if required)');
  console.log('  4. Select "Passport" in doc type dropdown → upload passport COPY');
  console.log('  5. Click "+" → Select "Criminal Records" → upload criminal record');
  console.log('  6. Click "+" → Select "Other" → upload Personbevis');
  
  // Auto-check the declaration
  setCheckbox('declaroInformacoesVerdadeiras', true);
  
  console.log('');
  console.log('✅ Declaration checked. Upload files above to complete!');
}

// ============================================================
// RUN ALL (call each as you navigate to each tab)
// ============================================================
console.log('🇧🇷 Brazil DPVN Auto-fill loaded!');
console.log('Run each function as you navigate to the corresponding tab:');
console.log('  fillGeneralData()    — Tab: General Data');
console.log('  fillVisaData()       — Tab: Visa Data');
console.log('  fillDocuments()      — Tab: Documents');
console.log('  fillProfessionalData() — Tab: Professional Data');
console.log('  fillContacts()       — Tab: Contacts');
console.log('  fillBiometricData()  — Tab: Biometric Data');
`.trim();
}

export interface SectionScript {
  id: string;
  label: string;
  icon: string;
  script: string;
}

/**
 * Generate per-section scripts for the DPVN form.
 * Each script is self-contained (includes helpers) and can be pasted directly into the console.
 */
export function generateBrazilSectionScripts(data: BrazilVisaData): SectionScript[] {
  const full = generateBrazilAutoFillScript(data);
  
  // Extract the helpers block (everything before SECTION 1)
  const helpersEnd = full.indexOf('// ============================================================\n// SECTION 1');
  const helpers = helpersEnd > 0 ? full.substring(0, helpersEnd).trim() : '';

  // Extract each section function body
  const sections: { id: string; label: string; icon: string; fnName: string }[] = [
    { id: 'generalData', label: '1. General Data', icon: '👤', fnName: 'fillGeneralData' },
    { id: 'visaData', label: '2. Visa Data', icon: '✈️', fnName: 'fillVisaData' },
    { id: 'documents', label: '3. Documents', icon: '📘', fnName: 'fillDocuments' },
    { id: 'professionalData', label: '4. Professional Data', icon: '💼', fnName: 'fillProfessionalData' },
    { id: 'contacts', label: '5. Contacts', icon: '🏠', fnName: 'fillContacts' },
    { id: 'biometricData', label: '6. Biometric Data', icon: '📷', fnName: 'fillBiometricData' },
  ];

  return sections.map(sec => {
    // Find the function in the full script and extract it
    const fnStart = full.indexOf(`function ${sec.fnName}()`);
    if (fnStart < 0) return { id: sec.id, label: sec.label, icon: sec.icon, script: `// ${sec.fnName} not found` };
    
    // Find the closing brace of this function
    let braceCount = 0;
    let fnEnd = fnStart;
    let started = false;
    for (let i = fnStart; i < full.length; i++) {
      if (full[i] === '{') { braceCount++; started = true; }
      if (full[i] === '}') { braceCount--; }
      if (started && braceCount === 0) { fnEnd = i + 1; break; }
    }
    
    const fnBody = full.substring(fnStart, fnEnd);
    
    // Build self-contained script: helpers + function + immediate call
    return {
      id: sec.id,
      label: sec.label,
      icon: sec.icon,
      script: `${helpers}\n\n${fnBody}\n\n// Auto-run\n${sec.fnName}();`,
    };
  });
}
