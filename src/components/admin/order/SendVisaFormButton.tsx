/**
 * SendVisaFormButton - Admin component to send data collection form to customer
 * 
 * Creates a form submission with a unique token, sends email to customer,
 * and shows status of existing submissions.
 */

import { useState, useEffect } from 'react';
import {
  createFormSubmission,
  getAllFormTemplates,
  getTemplateForProduct,
  VisaFormTemplate,
  VisaFormSubmission,
} from '@/firebase/visaFormService';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { toast } from 'react-hot-toast';

interface SendVisaFormButtonProps {
  order: any;
}

export default function SendVisaFormButton({ order }: SendVisaFormButtonProps) {
  const [templates, setTemplates] = useState<VisaFormTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [sending, setSending] = useState(false);
  const [existingSubmissions, setExistingSubmissions] = useState<VisaFormSubmission[]>([]);
  const [showPanel, setShowPanel] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (showPanel) {
      loadData();
    }
  }, [showPanel]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load templates
      const allTemplates = await getAllFormTemplates();
      const enabledTemplates = allTemplates.filter(t => t.enabled);
      setTemplates(enabledTemplates);

      // Auto-select best matching template
      if (order.destinationCountryCode && order.visaProduct?.category) {
        const best = await getTemplateForProduct(
          order.destinationCountryCode,
          order.visaProduct.category,
          order.visaProduct?.id || ''
        );
        if (best) setSelectedTemplate(best.id);
      }

      // Load existing submissions for this order
      const q = query(
        collection(db, 'visaFormSubmissions'),
        where('orderId', '==', order.id || order.orderId)
      );
      const snap = await getDocs(q);
      const subs = snap.docs.map(d => ({ id: d.id, ...d.data() } as VisaFormSubmission));
      setExistingSubmissions(subs);
    } catch (err) {
      console.error('Failed to load form data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!selectedTemplate) {
      toast.error('Please select a form template');
      return;
    }

    const customerEmail = order.customerInfo?.email;
    const customerName = order.customerInfo?.name || `${order.customerInfo?.firstName || ''} ${order.customerInfo?.lastName || ''}`.trim();
    const orderId = order.id || order.orderId;
    const orderNumber = order.orderNumber || order.visaOrderNumber || orderId;

    if (!customerEmail) {
      toast.error('No customer email found on this order');
      return;
    }

    setSending(true);
    try {
      const { token } = await createFormSubmission({
        orderId,
        orderNumber: String(orderNumber),
        templateId: selectedTemplate,
        customerEmail,
        customerName,
      });

      const formUrl = `${window.location.origin}/visa-form/${token}`;

      // Send email via the existing email queue system
      const { addDoc, collection: fbCollection, serverTimestamp } = await import('firebase/firestore');
      const { db: firebaseDb } = await import('@/firebase/config');

      await addDoc(fbCollection(firebaseDb, 'customerEmails'), {
        name: customerName,
        email: customerEmail,
        phone: order.customerInfo?.phone || '',
        subject: 'Komplettera din visumansökan / Complete your visa application',
        message: buildEmailHtml(customerName, orderNumber, formUrl),
        orderId: String(orderId),
        createdAt: serverTimestamp(),
        status: 'unread',
      });

      toast.success(`Form link sent to ${customerEmail}`);

      // Also copy link to clipboard
      await navigator.clipboard.writeText(formUrl);
      toast.success('Form link also copied to clipboard', { duration: 3000 });

      // Reload submissions
      await loadData();
    } catch (err) {
      console.error('Failed to send form:', err);
      toast.error('Failed to send form link');
    } finally {
      setSending(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">✅ Completed</span>;
      case 'partial':
        return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">⏳ Partial</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">📩 Sent</span>;
    }
  };

  return (
    <div className="mt-3">
      <button
        onClick={() => setShowPanel(!showPanel)}
        className="inline-flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 border border-purple-200 rounded-lg hover:bg-purple-200 text-sm font-medium transition-all"
      >
        📋 {showPanel ? 'Hide' : 'Data Collection Form'}
        {existingSubmissions.length > 0 && (
          <span className="bg-purple-600 text-white text-xs px-1.5 py-0.5 rounded-full">
            {existingSubmissions.length}
          </span>
        )}
      </button>

      {showPanel && (
        <div className="mt-3 bg-purple-50 border border-purple-200 rounded-lg p-4">
          {loading ? (
            <p className="text-sm text-gray-500">Loading...</p>
          ) : (
            <>
              {/* Existing submissions */}
              {existingSubmissions.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-purple-900 mb-2">Sent Forms</h4>
                  <div className="space-y-2">
                    {existingSubmissions.map(sub => (
                      <div key={sub.id} className="flex items-center justify-between bg-white rounded-lg p-3 border">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {sub.customerEmail}
                          </p>
                          <p className="text-xs text-gray-500">
                            Sent: {new Date(sub.sentAt).toLocaleDateString('sv-SE')}
                            {sub.completedAt && ` • Completed: ${new Date(sub.completedAt).toLocaleDateString('sv-SE')}`}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(sub.status)}
                          <button
                            onClick={() => {
                              const url = `${window.location.origin}/visa-form/${sub.token}`;
                              navigator.clipboard.writeText(url);
                              toast.success('Link copied');
                            }}
                            className="text-xs text-purple-600 hover:text-purple-800"
                            title="Copy form link"
                          >
                            📎 Copy Link
                          </button>
                          {sub.status === 'completed' && (
                            <button
                              onClick={() => {
                                // Show submitted data in a new window
                                const dataStr = JSON.stringify(sub.formData, null, 2);
                                const w = window.open('', '_blank', 'width=600,height=800');
                                if (w) {
                                  w.document.write(`<html><head><title>Form Data - ${sub.orderNumber}</title></head><body><pre style="font-family:monospace;padding:20px;">${dataStr}</pre></body></html>`);
                                }
                              }}
                              className="text-xs text-blue-600 hover:text-blue-800"
                              title="View submitted data"
                            >
                              👁️ View Data
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Send new form */}
              <div>
                <h4 className="text-sm font-semibold text-purple-900 mb-2">Send New Form</h4>
                <div className="flex items-end gap-3">
                  <div className="flex-1">
                    <label className="block text-xs text-gray-600 mb-1">Form Template</label>
                    <select
                      value={selectedTemplate}
                      onChange={(e) => setSelectedTemplate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="">Select template...</option>
                      {templates.map(t => (
                        <option key={t.id} value={t.id}>
                          {t.nameEn || t.name} ({t.countryCode}/{t.visaCategory})
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    onClick={handleSend}
                    disabled={sending || !selectedTemplate}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-medium disabled:opacity-50 whitespace-nowrap"
                  >
                    {sending ? 'Sending...' : '📧 Send to Customer'}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Will send to: {order.customerInfo?.email || 'No email found'}
                </p>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function buildEmailHtml(customerName: string, orderNumber: string, formUrl: string): string {
  return `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background: #0EB0A6; padding: 20px; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 22px;">DOX Visumpartner</h1>
  </div>
  <div style="padding: 30px; background: #ffffff;">
    <p>Hej ${customerName},</p>
    <p>Tack för din beställning (order #${orderNumber})! För att vi ska kunna behandla din visumansökan behöver vi lite mer information från dig.</p>
    <p>Klicka på knappen nedan för att fylla i formuläret:</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${formUrl}" style="display: inline-block; background: #0EB0A6; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">
        Fyll i formuläret
      </a>
    </div>
    <p style="color: #666; font-size: 14px;">Du kan spara ditt framsteg och återkomma till formuläret senare. Länken är giltig i 30 dagar.</p>
    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
    <p style="color: #999; font-size: 12px;">
      <strong>English:</strong> Thank you for your order (#${orderNumber})! To process your visa application, we need some additional information. Click the button above to fill in the form. You can save your progress and return later. The link is valid for 30 days.
    </p>
  </div>
  <div style="background: #f5f5f5; padding: 15px; text-align: center; font-size: 12px; color: #999;">
    DOX Visumpartner AB | info@doxvl.se | 08-409 419 00
  </div>
</div>
  `.trim();
}
