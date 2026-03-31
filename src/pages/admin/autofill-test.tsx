/**
 * Admin page to test auto-fill scripts for Madagascar and USA ESTA.
 * Generates scripts with sample data so admin can verify before deploy.
 */

import { useState } from 'react';
import { GetServerSideProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import Head from 'next/head';
import Link from 'next/link';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { toast } from 'react-hot-toast';
import { generatePage1Script, generatePage2Script, MadagascarVisaData } from '@/services/formAutomation/madagascarVisa';
import { generateESTAScript, generateEligibilityScript, ESTAData } from '@/services/formAutomation/usaESTA';

const SAMPLE_MADAGASCAR: MadagascarVisaData = {
  lastName: 'SVENSSON',
  firstName: 'ERIK JOHAN',
  birthDay: '15',
  birthMonth: '06',
  birthYear: '1990',
  nativeCountry: 'SUÈDE',
  gender: 'M',
  passportType: 'O',
  passportIssuingCountry: 'SUÈDE',
  passportNumber: 'A12345678',
  passportNationality: 'SUÉDOIS',
  passportIssueDay: '10',
  passportIssueMonth: '03',
  passportIssueYear: '2022',
  passportExpiryDay: '10',
  passportExpiryMonth: '03',
  passportExpiryYear: '2032',
  arrivalDay: '15',
  arrivalMonth: '05',
  arrivalYear: '2026',
  departureDay: '30',
  departureMonth: '05',
  departureYear: '2026',
  pointOfEntry: 'TNR',
  visaDuration: '15',
  phoneNumber: '+46701234567',
  email: 'erik.svensson@example.com',
};

const SAMPLE_ESTA: ESTAData = {
  familyName: 'SVENSSON',
  firstName: 'ERIK JOHAN',
  passportNumber: 'A12345678',
  issuingCountry: 'SE',
  citizenshipCountry: 'SE',
  gender: 'M',
  birthDay: '15',
  birthMonth: '6',
  birthYear: '1990',
  issueDay: '10',
  issueMonth: '3',
  issueYear: '2022',
  expiryDay: '10',
  expiryMonth: '3',
  expiryYear: '2032',
  cityOfBirth: 'Stockholm',
  countryOfBirth: 'SE',
  email: 'erik.svensson@example.com',
  confirmEmail: 'erik.svensson@example.com',
  phoneCountryCode: '46',
  phoneNumber: '701234567',
  addressLine1: 'Storgatan 1',
  city: 'Stockholm',
  state: 'Stockholm',
  countryOfResidence: 'SE',
};

type ScriptEntry = {
  title: string;
  script: string;
};

export default function AutofillTestPage() {
  const [madagascarScripts, setMadagascarScripts] = useState<ScriptEntry[] | null>(null);
  const [estaScripts, setEstaScripts] = useState<ScriptEntry[] | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<string | null>(null);

  const generateMadagascar = () => {
    const scripts: ScriptEntry[] = [
      { title: 'Sida 1: Personuppgifter + Pass', script: generatePage1Script(SAMPLE_MADAGASCAR) },
      { title: 'Sida 2: Vistelse + Kontakt', script: generatePage2Script(SAMPLE_MADAGASCAR) },
    ];
    setMadagascarScripts(scripts);
    toast.success(`Generated ${scripts.length} Madagascar scripts`);
  };

  const generateESTA = () => {
    const scripts: ScriptEntry[] = [
      { title: 'Huvudformulär: Pass + Personuppgifter', script: generateESTAScript(SAMPLE_ESTA) },
      { title: 'Behörighetsfrågor: Alla → No', script: generateEligibilityScript() },
    ];
    setEstaScripts(scripts);
    toast.success(`Generated ${scripts.length} ESTA scripts`);
  };

  const copyScript = async (script: string, key: string) => {
    try {
      await navigator.clipboard.writeText(script);
      setCopiedIndex(key);
      toast.success('Script copied! Paste in browser console on the visa portal.');
      setTimeout(() => setCopiedIndex(null), 4000);
    } catch {
      toast.error('Failed to copy');
    }
  };

  return (
    <ProtectedRoute requiredPermission="canManageVisaRequirements">
      <Head>
        <title>Autofill Script Test - Admin</title>
      </Head>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 py-8">
          <Link href="/admin" className="text-sm text-gray-500 hover:text-gray-700 mb-2 inline-block">
            ← Back to Admin
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Autofill Script Test</h1>
          <p className="text-gray-600 mb-8">
            Generera och testa autofill-script med exempeldata innan deploy.
          </p>

          <div className="grid gap-8">
            {/* Madagascar Section */}
            <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
              <div className="p-6 border-b bg-green-50">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                      <span className="text-2xl">🇲🇬</span> Madagascar Visa
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">
                      2 sidor: Personuppgifter + Pass → Vistelse + Kontakt
                    </p>
                  </div>
                  <button
                    onClick={generateMadagascar}
                    className="px-5 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                  >
                    Generate Scripts
                  </button>
                </div>
              </div>

              {madagascarScripts && (
                <div className="p-6 space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4 text-sm">
                    <h4 className="font-medium text-gray-700 mb-2">Testdata:</h4>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-gray-600">
                      <p>Namn: <strong>ERIK JOHAN SVENSSON</strong></p>
                      <p>Pass: <strong>A12345678</strong></p>
                      <p>Född: <strong>1990-06-15</strong></p>
                      <p>Land: <strong>SUÈDE (franska)</strong></p>
                      <p>Ankomst: <strong>2026-05-15</strong></p>
                      <p>Avresa: <strong>2026-05-30</strong></p>
                      <p>Inrese: <strong>Antananarivo (TNR)</strong></p>
                      <p>Visum: <strong>15 dagar</strong></p>
                    </div>
                  </div>
                  {madagascarScripts.map((s, i) => (
                    <ScriptBlock
                      key={`mg-${i}`}
                      title={s.title}
                      script={s.script}
                      copied={copiedIndex === `mg-${i}`}
                      onCopy={() => copyScript(s.script, `mg-${i}`)}
                      color="green"
                    />
                  ))}
                </div>
              )}
            </div>

            {/* USA ESTA Section */}
            <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
              <div className="p-6 border-b bg-blue-50">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                      <span className="text-2xl">🇺🇸</span> USA ESTA
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">
                      Huvudformulär + Behörighetsfrågor (Angular-portal)
                    </p>
                  </div>
                  <button
                    onClick={generateESTA}
                    className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                  >
                    Generate Scripts
                  </button>
                </div>
              </div>

              {estaScripts && (
                <div className="p-6 space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4 text-sm">
                    <h4 className="font-medium text-gray-700 mb-2">Testdata:</h4>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-gray-600">
                      <p>Namn: <strong>ERIK JOHAN SVENSSON</strong></p>
                      <p>Pass: <strong>A12345678</strong></p>
                      <p>Född: <strong>1990-06-15</strong></p>
                      <p>Land: <strong>SWEDEN (SE)</strong></p>
                      <p>Email: <strong>erik.svensson@example.com</strong></p>
                      <p>Telefon: <strong>+46 701234567</strong></p>
                      <p>Adress: <strong>Storgatan 1, Stockholm</strong></p>
                      <p>Kön: <strong>Male</strong></p>
                    </div>
                  </div>
                  {estaScripts.map((s, i) => (
                    <ScriptBlock
                      key={`us-${i}`}
                      title={s.title}
                      script={s.script}
                      copied={copiedIndex === `us-${i}`}
                      onCopy={() => copyScript(s.script, `us-${i}`)}
                      color="blue"
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Instructions */}
          <div className="mt-8 bg-amber-50 border border-amber-200 rounded-xl p-6">
            <h3 className="font-bold text-amber-900 mb-2">Hur man testar:</h3>
            <ol className="text-sm text-amber-800 space-y-1.5 list-decimal list-inside">
              <li>Klicka <strong>Generate Scripts</strong> för att skapa script med exempeldata</li>
              <li>Öppna visumportalen i en annan flik (Madagascar eller ESTA)</li>
              <li>Tryck <strong>F12</strong> för att öppna DevTools → Console</li>
              <li>Klicka <strong>Copy</strong> på scriptet → klistra in i konsolen → Enter</li>
              <li>Verifiera att alla fält fylls i korrekt</li>
              <li>En alert visar hur många fält som fylldes / misslyckades</li>
            </ol>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

function ScriptBlock({ title, script, copied, onCopy, color }: {
  title: string;
  script: string;
  copied: boolean;
  onCopy: () => void;
  color: 'green' | 'blue';
}) {
  const [expanded, setExpanded] = useState(false);
  const lines = script.split('\n').length;
  const chars = script.length;

  const colorClasses = color === 'green'
    ? { badge: 'bg-green-100 text-green-700', btn: 'bg-green-600 hover:bg-green-700' }
    : { badge: 'bg-blue-100 text-blue-700', btn: 'bg-blue-600 hover:bg-blue-700' };

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-gray-50">
        <div className="flex items-center gap-3">
          <span className={`px-2 py-0.5 rounded text-xs font-medium ${colorClasses.badge}`}>
            {lines} rader • {chars.toLocaleString()} tecken
          </span>
          <h4 className="font-medium text-gray-800 text-sm">{title}</h4>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setExpanded(!expanded)}
            className="px-3 py-1.5 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
          >
            {expanded ? 'Dölj' : 'Visa script'}
          </button>
          <button
            onClick={onCopy}
            className={`px-4 py-1.5 text-sm text-white rounded font-medium ${
              copied ? 'bg-emerald-500' : colorClasses.btn
            }`}
          >
            {copied ? '✅ Copied!' : 'Copy'}
          </button>
        </div>
      </div>
      {expanded && (
        <pre className="p-4 text-xs font-mono bg-gray-900 text-green-400 overflow-x-auto max-h-96 overflow-y-auto whitespace-pre">
          {script}
        </pre>
      )}
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ locale }) => {
  const i18nConfig = {
    i18n: { defaultLocale: 'sv', locales: ['sv', 'en'], localeDetection: false as const },
  };
  return {
    props: {
      ...(await serverSideTranslations(locale || 'sv', ['common'], i18nConfig)),
    },
  };
};
