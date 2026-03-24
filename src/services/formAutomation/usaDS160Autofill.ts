/**
 * USA DS-160 Visa Application Form Autofill Script Generator
 * 
 * Generates JavaScript for browser console to auto-fill DS-160 forms
 * DS-160 uses ASP.NET WebForms with field IDs like:
 * - ctl00_SiteContentPlaceHolder_FormView1_tbxAPP_SURNAME
 */

export interface DS160FormData {
  surname?: string;
  givenName?: string;
  fullNameNative?: string;
  fullNameNativeNA?: boolean;
  hasOtherNames?: boolean;
  sex?: 'M' | 'F';
  maritalStatus?: string;
  dateOfBirth?: string;
  placeOfBirthCity?: string;
  placeOfBirthState?: string;
  placeOfBirthCountry?: string;
  nationality?: string;
  nationalIdNumber?: string;
  homeAddress?: string;
  homeCity?: string;
  homeState?: string;
  homePostalCode?: string;
  homeCountry?: string;
  primaryPhone?: string;
  email?: string;
  passportNumber?: string;
  passportIssuingCountry?: string;
  passportIssueDate?: string;
  passportExpiryDate?: string;
  arrivalDate?: string;
  departureDate?: string;
  usAddress?: string;
  usCity?: string;
  usState?: string;
  usZipCode?: string;
  usContactName?: string;
  usContactOrganization?: string;
  usContactAddress?: string;
  usContactCity?: string;
  usContactState?: string;
  usContactZipCode?: string;
  usContactPhone?: string;
  usContactEmail?: string;
  fatherSurname?: string;
  fatherGivenName?: string;
  fatherDateOfBirth?: string;
  motherSurname?: string;
  motherGivenName?: string;
  motherDateOfBirth?: string;
  spouseSurname?: string;
  spouseGivenName?: string;
  primaryOccupation?: string;
  employerName?: string;
  employerAddress?: string;
  employerCity?: string;
  employerPhone?: string;
  jobTitle?: string;
  hasBeenToUS?: boolean;
  hasHadUSVisa?: boolean;
  hasBeenRefused?: boolean;
}

// Country code mapping
export const DS160_COUNTRY_CODES: Record<string, string> = {
  'Sweden': 'SWDN', 'Sverige': 'SWDN', 'SE': 'SWDN',
  'Norway': 'NORW', 'Norge': 'NORW', 'NO': 'NORW',
  'Denmark': 'DEN', 'Danmark': 'DEN', 'DK': 'DEN',
  'Finland': 'FIN', 'FI': 'FIN',
  'Germany': 'GER', 'Tyskland': 'GER', 'DE': 'GER',
  'United Kingdom': 'GRBR', 'Storbritannien': 'GRBR', 'GB': 'GRBR',
  'France': 'FRAN', 'Frankrike': 'FRAN', 'FR': 'FRAN',
  'USA': 'USA', 'US': 'USA',
};

function formatDateForDS160(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const months = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
  return `${String(date.getDate()).padStart(2,'0')}-${months[date.getMonth()]}-${date.getFullYear()}`;
}

export function convertFormDataToDS160(formData: Record<string, any>): DS160FormData {
  const getCountry = (c: string) => DS160_COUNTRY_CODES[c] || c;
  return {
    surname: formData.surname || formData.lastName || formData.familyNames || '',
    givenName: formData.givenName || formData.firstName || formData.givenNames || '',
    fullNameNative: formData.fullNameNative || '',
    fullNameNativeNA: formData.fullNameNativeNA === 'true' || formData.fullNameNativeNA === true,
    hasOtherNames: formData.hasOtherNames === 'yes',
    sex: formData.sex === 'male' || formData.sex === 'M' ? 'M' : formData.sex === 'female' || formData.sex === 'F' ? 'F' : undefined,
    maritalStatus: formData.maritalStatus?.charAt(0).toUpperCase(),
    dateOfBirth: formatDateForDS160(formData.dateOfBirth),
    placeOfBirthCity: formData.placeOfBirthCity || formData.birthCity || '',
    placeOfBirthState: formData.placeOfBirthState || '',
    placeOfBirthCountry: getCountry(formData.placeOfBirthCountry || formData.birthCountry || ''),
    nationality: getCountry(formData.nationality || ''),
    nationalIdNumber: formData.nationalIdNumber || formData.personnummer || '',
    homeAddress: formData.homeAddress || formData.permanentAddressStreet || formData.address || '',
    homeCity: formData.homeCity || formData.permanentAddressCity || formData.city || '',
    homeState: formData.homeState || formData.permanentAddressState || '',
    homePostalCode: formData.homePostalCode || formData.permanentAddressZip || formData.postalCode || '',
    homeCountry: getCountry(formData.homeCountry || 'Sweden'),
    primaryPhone: formData.primaryPhone || formData.phone || formData.mobilePhone || '',
    email: formData.email || '',
    passportNumber: formData.passportNumber || '',
    passportIssuingCountry: getCountry(formData.passportIssuingCountry || formData.passportIssuedBy || 'Sweden'),
    passportIssueDate: formatDateForDS160(formData.passportIssueDate || formData.passportDateOfIssue),
    passportExpiryDate: formatDateForDS160(formData.passportExpiryDate || formData.passportDateOfExpiry),
    arrivalDate: formatDateForDS160(formData.arrivalDate || formData.intendedArrivalDate),
    departureDate: formatDateForDS160(formData.departureDate || formData.intendedDepartureDate),
    usAddress: formData.usAddress || formData.usStayAddress || '',
    usCity: formData.usCity || formData.usStayCity || '',
    usState: formData.usState || formData.usStayState || '',
    usZipCode: formData.usZipCode || formData.usStayZipCode || '',
    usContactName: formData.usContactName || formData.usPointOfContactName || '',
    usContactOrganization: formData.usContactOrganization || '',
    usContactAddress: formData.usContactAddress || '',
    usContactCity: formData.usContactCity || '',
    usContactState: formData.usContactState || '',
    usContactZipCode: formData.usContactZipCode || '',
    usContactPhone: formData.usContactPhone || '',
    usContactEmail: formData.usContactEmail || '',
    fatherSurname: formData.fatherSurname || '',
    fatherGivenName: formData.fatherGivenName || '',
    fatherDateOfBirth: formatDateForDS160(formData.fatherDateOfBirth),
    motherSurname: formData.motherSurname || '',
    motherGivenName: formData.motherGivenName || '',
    motherDateOfBirth: formatDateForDS160(formData.motherDateOfBirth),
    spouseSurname: formData.spouseSurname || '',
    spouseGivenName: formData.spouseGivenName || '',
    primaryOccupation: formData.primaryOccupation || '',
    employerName: formData.employerName || '',
    employerAddress: formData.employerAddress || '',
    employerCity: formData.employerCity || '',
    employerPhone: formData.employerPhone || '',
    jobTitle: formData.jobTitle || '',
    hasBeenToUS: formData.hasBeenToUS === 'yes',
    hasHadUSVisa: formData.hasHadUSVisa === 'yes',
    hasBeenRefused: formData.hasBeenRefusedVisa === 'yes',
  };
}

export function generateDS160CompleteScript(formData: Record<string, any>): string {
  const data = convertFormDataToDS160(formData);
  return `
// DS-160 Auto-fill Script - DOX Visumpartner
const D=${JSON.stringify(data)};
function sv(id,v){const e=document.getElementById(id);if(e&&v){e.value=v;e.dispatchEvent(new Event('change',{bubbles:true}));console.log('✓',id.split('_').pop(),'=',v);}}
function ss(id,v){const e=document.getElementById(id);if(e&&v){for(let i=0;i<e.options.length;i++){if(e.options[i].value===v||e.options[i].text.toUpperCase().includes(v.toUpperCase())){e.selectedIndex=i;e.dispatchEvent(new Event('change',{bubbles:true}));console.log('✓',id.split('_').pop(),'=',e.options[i].text);return;}}}}
function sr(n,v){document.querySelectorAll('input[name="'+n+'"]').forEach(r=>{if(r.value===v){r.checked=true;r.dispatchEvent(new Event('change',{bubbles:true}));r.dispatchEvent(new Event('click',{bubbles:true}));}});}
function sc(id,c){const e=document.getElementById(id);if(e&&e.checked!==c){e.checked=c;e.dispatchEvent(new Event('click',{bubbles:true}));}}

function fillPersonal1(){
  console.log('🔄 Filling Personal 1...');
  sv('ctl00_SiteContentPlaceHolder_FormView1_tbxAPP_SURNAME',D.surname);
  sv('ctl00_SiteContentPlaceHolder_FormView1_tbxAPP_GIVEN_NAME',D.givenName);
  if(D.fullNameNativeNA)sc('ctl00_SiteContentPlaceHolder_FormView1_cbexAPP_FULL_NAME_NATIVE_NA',true);
  else sv('ctl00_SiteContentPlaceHolder_FormView1_tbxAPP_FULL_NAME_NATIVE',D.fullNameNative);
  sr('ctl00$SiteContentPlaceHolder$FormView1$rblOtherNames',D.hasOtherNames?'Y':'N');
  sr('ctl00$SiteContentPlaceHolder$FormView1$rblTelecodeQuestion','N');
  ss('ctl00_SiteContentPlaceHolder_FormView1_ddlAPP_GENDER',D.sex);
  ss('ctl00_SiteContentPlaceHolder_FormView1_ddlAPP_MARITAL_STATUS',D.maritalStatus);
  sv('ctl00_SiteContentPlaceHolder_FormView1_tbxAPP_DOB',D.dateOfBirth);
  sv('ctl00_SiteContentPlaceHolder_FormView1_tbxAPP_POB_CITY',D.placeOfBirthCity);
  sv('ctl00_SiteContentPlaceHolder_FormView1_tbxAPP_POB_ST_PROVINCE',D.placeOfBirthState);
  ss('ctl00_SiteContentPlaceHolder_FormView1_ddlAPP_POB_CNTRY',D.placeOfBirthCountry);
  console.log('✅ Personal 1 done!');
}

function fillPersonal2(){
  console.log('🔄 Filling Personal 2...');
  ss('ctl00_SiteContentPlaceHolder_FormView1_ddlAPP_NATL',D.nationality);
  sr('ctl00$SiteContentPlaceHolder$FormView1$rblAPP_OTH_NATL_IND','N');
  sr('ctl00$SiteContentPlaceHolder$FormView1$rblPermResOtherCntryInd','N');
  if(D.nationalIdNumber)sv('ctl00_SiteContentPlaceHolder_FormView1_tbxAPP_NATIONAL_ID',D.nationalIdNumber);
  else sc('ctl00_SiteContentPlaceHolder_FormView1_cbexAPP_NATIONAL_ID_NA',true);
  sc('ctl00_SiteContentPlaceHolder_FormView1_cbexAPP_SSN_NA',true);
  sc('ctl00_SiteContentPlaceHolder_FormView1_cbexAPP_TAX_ID_NA',true);
  console.log('✅ Personal 2 done!');
}

function fillAddress(){
  console.log('🔄 Filling Address...');
  sv('ctl00_SiteContentPlaceHolder_FormView1_tbxAPP_ADDR_LN1',D.homeAddress);
  sv('ctl00_SiteContentPlaceHolder_FormView1_tbxAPP_ADDR_CITY',D.homeCity);
  sv('ctl00_SiteContentPlaceHolder_FormView1_tbxAPP_ADDR_STATE',D.homeState);
  sv('ctl00_SiteContentPlaceHolder_FormView1_tbxAPP_ADDR_POSTAL_CD',D.homePostalCode);
  ss('ctl00_SiteContentPlaceHolder_FormView1_ddlCountry',D.homeCountry);
  sr('ctl00$SiteContentPlaceHolder$FormView1$rblMailingAddrSame','Y');
  sv('ctl00_SiteContentPlaceHolder_FormView1_tbxAPP_HOME_TEL',D.primaryPhone);
  sc('ctl00_SiteContentPlaceHolder_FormView1_cbexAPP_MOBILE_TEL_NA',true);
  sc('ctl00_SiteContentPlaceHolder_FormView1_cbexAPP_BUS_TEL_NA',true);
  sv('ctl00_SiteContentPlaceHolder_FormView1_tbxAPP_EMAIL_ADDR',D.email);
  console.log('✅ Address done!');
}

function fillPassport(){
  console.log('🔄 Filling Passport...');
  ss('ctl00_SiteContentPlaceHolder_FormView1_ddlPPT_TYPE','R');
  sv('ctl00_SiteContentPlaceHolder_FormView1_tbxPPT_NUM',D.passportNumber);
  sc('ctl00_SiteContentPlaceHolder_FormView1_cbexPPT_BOOK_NUM_NA',true);
  ss('ctl00_SiteContentPlaceHolder_FormView1_ddlPPT_ISSUED_CNTRY',D.passportIssuingCountry);
  sc('ctl00_SiteContentPlaceHolder_FormView1_cbexPPT_ISSUED_IN_STATE_NA',true);
  sv('ctl00_SiteContentPlaceHolder_FormView1_tbxPPT_ISSUED_DTD',D.passportIssueDate);
  sv('ctl00_SiteContentPlaceHolder_FormView1_tbxPPT_EXPIRE_DTD',D.passportExpiryDate);
  sr('ctl00$SiteContentPlaceHolder$FormView1$rblLOST_PPT_IND','N');
  console.log('✅ Passport done!');
}

function fillUSContact(){
  console.log('🔄 Filling US Contact...');
  const names=D.usContactName?.split(' ')||[];
  sv('ctl00_SiteContentPlaceHolder_FormView1_tbxUS_POC_SURNAME',names.slice(-1)[0]||'');
  sv('ctl00_SiteContentPlaceHolder_FormView1_tbxUS_POC_GIVEN_NAME',names[0]||'');
  sv('ctl00_SiteContentPlaceHolder_FormView1_tbxUS_POC_ORGANIZATION',D.usContactOrganization);
  sv('ctl00_SiteContentPlaceHolder_FormView1_tbxUS_POC_ADDR_LN1',D.usContactAddress);
  sv('ctl00_SiteContentPlaceHolder_FormView1_tbxUS_POC_ADDR_CITY',D.usContactCity);
  ss('ctl00_SiteContentPlaceHolder_FormView1_ddlUS_POC_ADDR_STATE',D.usContactState);
  sv('ctl00_SiteContentPlaceHolder_FormView1_tbxUS_POC_ADDR_POSTAL_CD',D.usContactZipCode);
  sv('ctl00_SiteContentPlaceHolder_FormView1_tbxUS_POC_HOME_TEL',D.usContactPhone);
  sv('ctl00_SiteContentPlaceHolder_FormView1_tbxUS_POC_EMAIL_ADDR',D.usContactEmail);
  console.log('✅ US Contact done!');
}

function fillFamily(){
  console.log('🔄 Filling Family...');
  sv('ctl00_SiteContentPlaceHolder_FormView1_tbxFATHER_SURNAME',D.fatherSurname);
  sv('ctl00_SiteContentPlaceHolder_FormView1_tbxFATHER_GIVEN_NAME',D.fatherGivenName);
  sv('ctl00_SiteContentPlaceHolder_FormView1_tbxFathersDOB',D.fatherDateOfBirth);
  sr('ctl00$SiteContentPlaceHolder$FormView1$rblFATHER_LIVE_IN_US_IND','N');
  sv('ctl00_SiteContentPlaceHolder_FormView1_tbxMOTHER_SURNAME',D.motherSurname);
  sv('ctl00_SiteContentPlaceHolder_FormView1_tbxMOTHER_GIVEN_NAME',D.motherGivenName);
  sv('ctl00_SiteContentPlaceHolder_FormView1_tbxMothersDOB',D.motherDateOfBirth);
  sr('ctl00$SiteContentPlaceHolder$FormView1$rblMOTHER_LIVE_IN_US_IND','N');
  sr('ctl00$SiteContentPlaceHolder$FormView1$rblUS_IMMED_RELATIVE_IND','N');
  console.log('✅ Family done!');
}

function fillWork(){
  console.log('🔄 Filling Work...');
  ss('ctl00_SiteContentPlaceHolder_FormView1_ddlPresentOccupation',D.primaryOccupation);
  sv('ctl00_SiteContentPlaceHolder_FormView1_tbxEmpSchName',D.employerName);
  sv('ctl00_SiteContentPlaceHolder_FormView1_tbxEmpSchAddr1',D.employerAddress);
  sv('ctl00_SiteContentPlaceHolder_FormView1_tbxEmpSchCity',D.employerCity);
  sv('ctl00_SiteContentPlaceHolder_FormView1_tbxWORK_EDUC_TEL',D.employerPhone);
  console.log('✅ Work done!');
}

function fillSecurity(){
  console.log('🔄 Filling Security (all No)...');
  ['rblDisease','rblDisorder','rblDruguser','rblArrested','rblControlledSubstances','rblProstitution','rblMoneyLaundering','rblHumanTrafficking','rblAssistedSevereTrafficking','rblHumanTraffickingRelated','rblIllegalActivity','rblTerroristActivity','rblTerroristSupport','rblTerroristOrg','rblGenocide','rblTorture','rblExJudKilling','rblChildSoldier','rblReligiousFreedom','rblPopulationControls','rblTransplant','rblDeportation','rblChildCustody','rblVotingViolation','rblTaxEvasion'].forEach(n=>sr('ctl00$SiteContentPlaceHolder$FormView1$'+n,'N'));
  console.log('✅ Security done! ⚠️ REVIEW ALL ANSWERS!');
}

function fillPreviousTravel(){
  console.log('🔄 Filling Previous Travel...');
  sr('ctl00$SiteContentPlaceHolder$FormView1$rblPREV_US_TRAVEL_IND',D.hasBeenToUS?'Y':'N');
  sr('ctl00$SiteContentPlaceHolder$FormView1$rblPREV_VISA_IND',D.hasHadUSVisa?'Y':'N');
  sr('ctl00$SiteContentPlaceHolder$FormView1$rblPREV_VISA_REFUSED_IND',D.hasBeenRefused?'Y':'N');
  console.log('✅ Previous Travel done!');
}

function fillAll(){
  const t=document.title;
  if(t.includes('Personal Information 1')||t.includes('Personal 1'))fillPersonal1();
  else if(t.includes('Personal 2'))fillPersonal2();
  else if(t.includes('Address'))fillAddress();
  else if(t.includes('Passport'))fillPassport();
  else if(t.includes('U.S. Contact'))fillUSContact();
  else if(t.includes('Family'))fillFamily();
  else if(t.includes('Work')||t.includes('Education'))fillWork();
  else if(t.includes('Security'))fillSecurity();
  else if(t.includes('Previous'))fillPreviousTravel();
  else console.log('Unknown page. Use: fillPersonal1(), fillAddress(), etc.');
}

console.log('📋 DS-160 Script loaded! Commands:');
console.log('  fillAll() - Auto-detect page');
console.log('  fillPersonal1/2(), fillAddress(), fillPassport()');
console.log('  fillUSContact(), fillFamily(), fillWork(), fillSecurity()');
`;
}

export function buildDS160DataFromOrder(order: any, formData?: Record<string, any>): DS160FormData {
  const traveler = order.travelers?.[0] || {};
  const customerInfo = order.customerInfo || {};
  return convertFormDataToDS160({ ...traveler, ...customerInfo, ...formData });
}
