import { useState } from 'react';
import { toast } from 'react-hot-toast';
import type { ExtendedOrder } from './types';

interface QuoteLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  vatRate: number;
}

interface CommunicationTabProps {
  order: ExtendedOrder;
  onShowDocumentRequestModal: () => void;
  onShowNewTemplateModal: () => void;
  quoteLineItems?: QuoteLineItem[];
  quoteTotalAmount?: number;
}

function translateDesc(desc: string): string {
  const map: Record<string, string> = {
    'Apostille - Officiell avgift': 'Apostille - Official Fee',
    'Apostille - Serviceavgift': 'Apostille - Service Fee',
    'Notarisering - Officiell avgift': 'Notarization - Official Fee',
    'Notarisering - Serviceavgift': 'Notarization - Service Fee',
    'UD-legalisering - Officiell avgift': 'UD Legalization - Official Fee',
    'UD-legalisering - Serviceavgift': 'UD Legalization - Service Fee',
    'Ambassadlegalisering - Officiell avgift': 'Embassy Legalization - Official Fee',
    'Ambassadlegalisering - Serviceavgift': 'Embassy Legalization - Service Fee',
    'Handelskammarlegalisering - Officiell avgift': 'Chamber of Commerce - Official Fee',
    'Handelskammarlegalisering - Serviceavgift': 'Chamber of Commerce - Service Fee',
    'Expresshantering': 'Express Handling',
    'Returservice': 'Return Service',
    'Skannade kopior': 'Scanned Copies',
  };
  return map[desc] || desc;
}

export default function CommunicationTab({ order, onShowDocumentRequestModal, onShowNewTemplateModal, quoteLineItems, quoteTotalAmount }: CommunicationTabProps) {
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [quoteMessage, setQuoteMessage] = useState('');
  const [sendingQuote, setSendingQuote] = useState(false);
  const [editableLineItems, setEditableLineItems] = useState<QuoteLineItem[]>([]);
  const [editableTotal, setEditableTotal] = useState(0);

  const quoteStatus = (order as any).quote?.status as string | undefined;
  const quoteSentAt = (order as any).quote?.sentAt as string | undefined;
  const quoteRespondedAt = (order as any).quote?.respondedAt as string | undefined;
  const quoteDeclineReason = (order as any).quote?.declineReason as string | undefined;

  const openQuoteModal = () => {
    // Initialize editable line items from props
    const items = (quoteLineItems || []).map(item => ({ ...item }));
    setEditableLineItems(items);
    setEditableTotal(quoteTotalAmount || items.reduce((sum, i) => sum + i.total, 0));
    setQuoteMessage('');
    setShowQuoteModal(true);
  };

  const recalcTotal = (items: QuoteLineItem[]) => {
    return items.reduce((sum, i) => sum + i.total, 0);
  };

  const updateLineItem = (idx: number, field: 'unitPrice' | 'quantity', value: number) => {
    const next = [...editableLineItems];
    next[idx] = { ...next[idx], [field]: value, total: field === 'unitPrice' ? value * next[idx].quantity : next[idx].unitPrice * value };
    setEditableLineItems(next);
    setEditableTotal(recalcTotal(next));
  };

  const sendQuote = async () => {
    if (editableLineItems.length === 0) {
      toast.error('No line items to send');
      return;
    }

    setSendingQuote(true);
    try {
      const response = await fetch('/api/quote/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order.orderNumber || order.id,
          lineItems: editableLineItems,
          totalAmount: editableTotal,
          message: quoteMessage.trim()
        })
      });

      const data = await response.json();
      if (response.ok) {
        toast.success(data.message || 'Quote sent');
        setShowQuoteModal(false);
        // Force page reload to reflect new quote status
        window.location.reload();
      } else {
        toast.error(data.error || 'Failed to send quote');
      }
    } catch (err: any) {
      toast.error(`Failed to send quote: ${err.message || 'Unknown error'}`);
    } finally {
      setSendingQuote(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Quote Status Banner */}
      {quoteStatus && (
        <div className={`border rounded-lg p-4 ${
          quoteStatus === 'sent' ? 'bg-blue-50 border-blue-200' :
          quoteStatus === 'accepted' ? 'bg-green-50 border-green-200' :
          'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-center gap-3">
            <span className="text-xl">
              {quoteStatus === 'sent' ? '📤' : quoteStatus === 'accepted' ? '✅' : '❌'}
            </span>
            <div>
              <p className={`font-semibold ${
                quoteStatus === 'sent' ? 'text-blue-800' :
                quoteStatus === 'accepted' ? 'text-green-800' :
                'text-red-800'
              }`}>
                {quoteStatus === 'sent' ? 'Quote sent' : quoteStatus === 'accepted' ? 'Quote accepted' : 'Quote declined'}
                {quoteSentAt && <span className="font-normal text-sm ml-2">— Sent {new Date(quoteSentAt).toLocaleDateString('en-GB')}</span>}
                {quoteRespondedAt && <span className="font-normal text-sm ml-2">— Responded {new Date(quoteRespondedAt).toLocaleDateString('en-GB')}</span>}
              </p>
              {quoteStatus === 'declined' && quoteDeclineReason && (
                <p className="text-sm text-red-700 mt-1">Reason: {quoteDeclineReason}</p>
              )}
              {quoteStatus === 'accepted' && (
                <p className="text-sm text-green-700 mt-1">Customer has accepted the quoted prices.</p>
              )}
              {quoteStatus === 'sent' && (
                <p className="text-sm text-blue-700 mt-1">Waiting for customer response.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Send Quote */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-medium mb-2">Send Quote</h3>
        <p className="text-gray-600 mb-4">
          Send a price quote to the customer based on the current pricing from the Price tab. The customer can accept or decline the quote.
        </p>
        <button
          onClick={openQuoteModal}
          className="px-4 py-2 bg-teal-600 text-white rounded hover:bg-teal-700 flex items-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          {quoteStatus ? 'Send New Quote' : 'Send Quote'}
        </button>
      </div>

      {/* Send Custom Email */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-medium">Send Custom Email</h3>
          <button
            onClick={onShowNewTemplateModal}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50 flex items-center"
          >
            + New Template
          </button>
        </div>
        <p className="text-gray-600 mb-4">
          Send an email to the customer using a template. The customer can upload files via a secure link.
        </p>
        <button
          onClick={onShowDocumentRequestModal}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          Compose Email
        </button>
        {(order as any).documentRequestSent && (
          <p className="text-sm text-green-600 mt-2">
            ✓ Last email sent {(order as any).documentRequestSentAt && new Date((order as any).documentRequestSentAt).toLocaleDateString('en-GB')}
          </p>
        )}
      </div>

      {/* Order Update Notification */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-medium mb-2">Order Update Notification</h3>
        <p className="text-gray-600 mb-4">
          Notify the customer about changes to their order (country, documents, etc).
        </p>
        <p className="text-sm text-gray-500">
          To send an update notification, edit the order information in the Services tab and click &quot;Notify Customer of Changes&quot;.
        </p>
        {(order as any).orderUpdateNotificationSent && (
          <p className="text-sm text-green-600 mt-2">
            ✓ Update notification sent {(order as any).orderUpdateNotificationSentAt && new Date((order as any).orderUpdateNotificationSentAt).toLocaleDateString('en-GB')}
          </p>
        )}
      </div>

      {/* Email History */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-medium mb-4">Email History</h3>
        <p className="text-sm text-gray-500">
          Email history will be shown here once implemented.
        </p>
      </div>

      {/* Quote Modal */}
      {showQuoteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Send Quote</h2>
                <button
                  onClick={() => setShowQuoteModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <p className="text-gray-600 mb-4">
                A quote email will be sent to: <strong>{order?.customerInfo?.email}</strong>
              </p>

              {/* Customer language indicator */}
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <span className="font-medium">Customer language:</span>{' '}
                  {(order as any)?.locale === 'en' ? '🇬🇧 English' : '🇸🇪 Swedish'}
                  <span className="text-blue-600 ml-2">(Quote email will be sent in this language)</span>
                </p>
              </div>

              {/* Line items table */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Quote Line Items</label>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="px-3 py-2 text-left font-medium text-gray-600">Description</th>
                        <th className="px-3 py-2 text-center font-medium text-gray-600 w-20">Qty</th>
                        <th className="px-3 py-2 text-right font-medium text-gray-600 w-28">Unit Price</th>
                        <th className="px-3 py-2 text-right font-medium text-gray-600 w-28">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {editableLineItems.map((item, idx) => (
                        <tr key={idx} className="border-b border-gray-100">
                          <td className="px-3 py-2 text-gray-900">{translateDesc(item.description)}</td>
                          <td className="px-3 py-2 text-center text-gray-600">{item.quantity}</td>
                          <td className="px-3 py-2 text-right">
                            <input
                              type="number"
                              className="w-24 border rounded px-2 py-1 text-right text-sm"
                              value={item.unitPrice}
                              onChange={(e) => updateLineItem(idx, 'unitPrice', Number(e.target.value))}
                            />
                          </td>
                          <td className="px-3 py-2 text-right font-medium text-gray-900">
                            {item.total.toLocaleString()} kr
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-teal-50">
                        <td colSpan={3} className="px-3 py-3 text-right font-bold text-teal-900">Total:</td>
                        <td className="px-3 py-3 text-right font-bold text-teal-900 text-lg">{editableTotal.toLocaleString()} kr</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
                <p className="text-xs text-gray-500 mt-1">You can adjust unit prices before sending. The customer will see these prices.</p>
              </div>

              {/* Message */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message to customer (optional)
                </label>
                <textarea
                  value={quoteMessage}
                  onChange={(e) => setQuoteMessage(e.target.value)}
                  placeholder="Add a personal message to the quote email..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                />
              </div>

              {/* Warning if quote already sent */}
              {quoteStatus === 'sent' && (
                <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm text-amber-800">
                    ⚠️ A quote has already been sent and is awaiting response. Sending a new quote will replace the previous one.
                  </p>
                </div>
              )}

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowQuoteModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={sendQuote}
                  disabled={sendingQuote || editableLineItems.length === 0}
                  className="flex-1 px-4 py-2 bg-teal-600 text-white font-medium rounded-lg hover:bg-teal-700 transition disabled:opacity-50 flex items-center justify-center"
                >
                  {sendingQuote ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Sending...
                    </span>
                  ) : (
                    'Send Quote'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
