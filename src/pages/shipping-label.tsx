import { useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { printShippingLabel } from '@/services/shippingLabelService';

function ShippingLabelPage() {
  const router = useRouter();
  const orderId = (router.query.orderId as string) || (typeof window !== 'undefined' ? (window as any).__finalOrderNumber : undefined);

  useEffect(() => {
    // Auto-open print dialog once query is ready
    if (!router.isReady) return;
    try {
      printShippingLabel(orderId);
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.isReady, orderId]);

  return (
    <>
      <Head>
        <title>Shipping Label | DOX Visumpartner AB</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <main className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="bg-white shadow-sm border border-gray-200 rounded-lg p-6 text-center max-w-md">
          <h1 className="text-xl font-semibold mb-2">Shipping Label</h1>
          <p className="text-gray-600 mb-6">Your label should have opened in a new tab. If it didn’t, click the button below.</p>
          <button
            onClick={() => printShippingLabel(orderId)}
            className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md"
          >
            Print shipping label
          </button>
          <div className="mt-6">
            <Link href="/" className="text-primary-600 hover:text-primary-700 underline">
              Back to homepage
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}

export default dynamic(() => Promise.resolve(ShippingLabelPage), { ssr: false });
