import { useEffect, useState } from 'react';
import Head from 'next/head';
import type { GetStaticProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import Link from 'next/link';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { getFirebaseDb, getFirebaseAuth } from '@/firebase/config';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { toast } from 'react-hot-toast';

export default function AdminProfilePage() {
  const { currentUser } = useAuth();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const db = getFirebaseDb();
        if (!db || !currentUser) return setLoading(false);
        const ref = doc(db, 'adminProfiles', currentUser.uid);
        const snap = await getDoc(ref);
        const profile = snap.exists() ? (snap.data() as any) : {};
        setName(profile.name || currentUser.displayName || '');
        setPhone(profile.phone || '');
        setEmail(profile.email || currentUser.email || '');
      } catch (e) {
        toast.error('Kunde inte ladda profilen');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [currentUser]);

  const onSave = async () => {
    if (!currentUser) return;
    setSaving(true);
    try {
      const db = getFirebaseDb();
      if (!db) throw new Error('Ingen databas');
      const ref = doc(db, 'adminProfiles', currentUser.uid);
      await setDoc(
        ref,
        {
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim(),
          updatedAt: serverTimestamp()
        },
        { merge: true }
      );

      const auth = getFirebaseAuth();
      if (auth) {
        if (name && name !== (currentUser.displayName || '')) {
          await updateProfile(currentUser, { displayName: name.trim() });
        }
      }

      toast.success('Profil uppdaterad');
    } catch (e) {
      console.error('Profile save error:', e);
      const msg = (e as any)?.message || String(e);
      toast.error(`Kunde inte spara profil: ${msg}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <ProtectedRoute>
      <Head>
        <title>Profil | Admin | Legaliseringstjänst</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <div className="bg-gray-100 min-h-screen">
        <div className="container mx-auto px-4 py-8">
          <div className="bg-white rounded-lg shadow p-6 max-w-xl mx-auto">
            <h1 className="text-2xl font-semibold mb-6">Profil</h1>
            {loading ? (
              <div className="text-gray-600">Laddar...</div>
            ) : (
              <div className="space-y-5">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Namn</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full border rounded px-3 py-2"
                    placeholder="Ditt namn"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Telefon</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full border rounded px-3 py-2"
                    placeholder="Ditt telefonnummer"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">E-post</label>
                  <input
                    type="email"
                    value={email}
                    readOnly
                    className="w-full border rounded px-3 py-2 bg-gray-50 text-gray-600 cursor-not-allowed"
                    placeholder="din@epost.se"
                  />
                  <p className="text-xs text-gray-500 mt-1">E-post kan ändras i kontoinställningar (kräver ev. ny inloggning).</p>
                </div>
                <div className="pt-2">
                  <button
                    onClick={onSave}
                    disabled={saving}
                    className={`px-4 py-2 rounded text-white ${saving ? 'bg-gray-400' : 'bg-primary-600 hover:bg-primary-700'}`}
                  >
                    {saving ? 'Sparar…' : 'Spara'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

export const getStaticProps: GetStaticProps = async ({ locale }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale || 'sv', ['common'])),
    },
  };
};
