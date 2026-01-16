import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { 
  getInvoiceById, 
  updateInvoice, 
  updateInvoiceStatus,
  generateInvoicePDF, 
  sendInvoiceEmail,
  recalculateLineItem,
  Invoice, 
  InvoiceLineItem 
} from '@/services/invoiceService';
import { Timestamp } from 'firebase/firestore';

const InvoiceDetailPage = () => {
  const router = useRouter();
  const { id } = router.query;

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editedLineItems, setEditedLineItems] = useState<InvoiceLineItem[]>([]);
  const [editedNotes, setEditedNotes] = useState('');

  useEffect(() => {
    if (id && typeof id === 'string') {
      loadInvoice(id);
    }
  }, [id]);

  const loadInvoice = async (invoiceId: string) => {
    setLoading(true);
    try {
      const data = await getInvoiceById(invoiceId);
      if (data) {
        setInvoice(data);
        setEditedLineItems(data.lineItems);
        setEditedNotes(data.notes || '');
      } else {
        toast.error('Invoice not found');
        router.push('/admin/invoices');
      }
    } catch (error) {
      toast.error('Could not load invoice');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp: Timestamp | any) => {
    if (!timestamp) return 'N/A';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return new Intl.DateTimeFormat('sv-SE', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }).format(date);
    } catch {
      return 'N/A';
    }
  };

  const handleVatChange = (index: number, newVatPercent: number) => {
    const updatedItems = [...editedLineItems];
    updatedItems[index] = recalculateLineItem(updatedItems[index], newVatPercent);
    setEditedLineItems(updatedItems);
  };

  const handleUnitPriceChange = (index: number, newPrice: number) => {
    const updatedItems = [...editedLineItems];
    const item = updatedItems[index];
    const vatPercent = (item.vatRate || 0) * 100;
    updatedItems[index] = recalculateLineItem({
      ...item,
      unitPrice: newPrice
    }, vatPercent);
    setEditedLineItems(updatedItems);
  };

  const handleQuantityChange = (index: number, newQuantity: number) => {
    const updatedItems = [...editedLineItems];
    const item = updatedItems[index];
    const vatPercent = (item.vatRate || 0) * 100;
    updatedItems[index] = recalculateLineItem({
      ...item,
      quantity: newQuantity
    }, vatPercent);
    setEditedLineItems(updatedItems);
  };

  const handleDescriptionChange = (index: number, newDescription: string) => {
    const updatedItems = [...editedLineItems];
    updatedItems[index] = {
      ...updatedItems[index],
      description: newDescription
    };
    setEditedLineItems(updatedItems);
  };

  const handleRemoveLineItem = (index: number) => {
    const updatedItems = editedLineItems.filter((_, i) => i !== index);
    setEditedLineItems(updatedItems);
  };

  const handleAddLineItem = () => {
    const newItem: InvoiceLineItem = {
      id: `new_${Date.now()}`,
      description: 'New line item',
      quantity: 1,
      unitPrice: 0,
      totalPrice: 0,
      vatRate: 0.25,
      vatAmount: 0
    };
    setEditedLineItems([...editedLineItems, newItem]);
  };

  const calculateTotals = () => {
    const subtotal = editedLineItems.reduce((sum, item) => sum + item.totalPrice, 0);
    const vatTotal = editedLineItems.reduce((sum, item) => sum + item.vatAmount, 0);
    return { subtotal, vatTotal };
  };

  const handleSave = async () => {
    if (!invoice?.id) return;

    setSaving(true);
    try {
      await updateInvoice(invoice.id, {
        lineItems: editedLineItems,
        notes: editedNotes
      });
      
      // Reload invoice to get updated data
      await loadInvoice(invoice.id);
      setEditMode(false);
      toast.success('Invoice updated successfully');
    } catch (error) {
      toast.error('Could not save invoice');
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (newStatus: Invoice['status']) => {
    if (!invoice?.id) return;

    try {
      await updateInvoiceStatus(invoice.id, newStatus);
      setInvoice({ ...invoice, status: newStatus });
      toast.success(`Status updated to ${newStatus}`);
    } catch (error) {
      toast.error('Could not update status');
    }
  };

  const handleDownload = async () => {
    if (!invoice) return;
    try {
      await generateInvoicePDF(invoice);
      toast.success('PDF downloading');
    } catch (error) {
      toast.error('Could not generate PDF');
    }
  };

  const handleSendEmail = async () => {
    if (!invoice) return;

    setSending(true);
    try {
      // If in edit mode, save first
      if (editMode) {
        await handleSave();
      }
      
      const success = await sendInvoiceEmail(invoice);
      if (success) {
        toast.success('Invoice sent via email');
        // Update status to sent if it was draft
        if (invoice.status === 'draft') {
          await handleStatusChange('sent');
        }
      } else {
        toast.error('Could not send invoice');
      }
    } catch (error) {
      toast.error('Could not send invoice');
    } finally {
      setSending(false);
    }
  };

  const handleSetAllVatExempt = () => {
    const updatedItems = editedLineItems.map(item => recalculateLineItem(item, 0));
    setEditedLineItems(updatedItems);
    toast.success('All items set to 0% VAT (reverse charge)');
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </ProtectedRoute>
    );
  }

  if (!invoice) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Invoice not found</h2>
            <Link href="/admin/invoices" className="text-primary-600 hover:underline">
              Back to invoices
            </Link>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  const { subtotal, vatTotal } = calculateTotals();

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-6">
            <Link 
              href={invoice.orderId ? `/admin/orders/${invoice.orderId}` : '/admin/invoices'}
              className="text-primary-600 hover:text-primary-700 flex items-center text-sm mb-4"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              {invoice.orderId ? 'Back to Order' : 'Back to Invoices'}
            </Link>

            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Invoice {invoice.invoiceNumber}</h1>
                <p className="text-gray-600">Order: {invoice.orderNumber || invoice.orderId}</p>
              </div>
              <div className="flex items-center space-x-3">
                {!editMode ? (
                  <>
                    <button
                      onClick={() => setEditMode(true)}
                      className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                    >
                      Edit Invoice
                    </button>
                    <button
                      onClick={handleDownload}
                      className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                    >
                      Download PDF
                    </button>
                    <button
                      onClick={handleSendEmail}
                      disabled={sending}
                      className="px-4 py-2 bg-primary-600 text-white rounded-md text-sm font-medium hover:bg-primary-700 disabled:opacity-50"
                    >
                      {sending ? 'Sending...' : 'Send via Email'}
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        setEditMode(false);
                        setEditedLineItems(invoice.lineItems);
                        setEditedNotes(invoice.notes || '');
                      }}
                      className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 disabled:opacity-50"
                    >
                      {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Status and Quick Actions */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <span className="text-sm font-medium text-gray-700">Status:</span>
                <select
                  value={invoice.status}
                  onChange={(e) => handleStatusChange(e.target.value as Invoice['status'])}
                  className={`px-3 py-1 rounded-full text-sm font-medium border-0 ${
                    invoice.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                    invoice.status === 'sent' ? 'bg-blue-100 text-blue-800' :
                    invoice.status === 'paid' ? 'bg-green-100 text-green-800' :
                    invoice.status === 'overdue' ? 'bg-red-100 text-red-800' :
                    invoice.status === 'cancelled' ? 'bg-gray-100 text-gray-800' :
                    'bg-gray-100 text-gray-800'
                  }`}
                >
                  <option value="draft">Draft</option>
                  <option value="sent">Sent</option>
                  <option value="paid">Paid</option>
                  <option value="overdue">Overdue</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div className="text-sm text-gray-600">
                Created: {formatDate(invoice.issueDate)} • Due: {formatDate(invoice.dueDate)}
              </div>
            </div>
          </div>

          {/* Edit Mode: Quick VAT Actions */}
          {editMode && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-amber-800">Edit Mode</h3>
                  <p className="text-sm text-amber-700">You can edit line items, VAT rates, and notes below.</p>
                </div>
                <button
                  onClick={handleSetAllVatExempt}
                  className="px-4 py-2 bg-amber-600 text-white rounded-md text-sm font-medium hover:bg-amber-700"
                >
                  Set All to 0% VAT (Reverse Charge)
                </button>
              </div>
            </div>
          )}

          {/* Customer Info */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Customer Information</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                {invoice.customerInfo.companyName && (
                  <p className="font-medium text-gray-900">{invoice.customerInfo.companyName}</p>
                )}
                <p className="text-gray-700">
                  {invoice.customerInfo.firstName} {invoice.customerInfo.lastName}
                </p>
                <p className="text-gray-600">{invoice.customerInfo.email}</p>
                <p className="text-gray-600">{invoice.customerInfo.phone}</p>
              </div>
              <div>
                <p className="text-gray-700">{invoice.customerInfo.address}</p>
                <p className="text-gray-700">
                  {invoice.customerInfo.postalCode} {invoice.customerInfo.city}
                </p>
                {invoice.customerInfo.orgNumber && (
                  <p className="text-gray-600">Org.nr: {invoice.customerInfo.orgNumber}</p>
                )}
              </div>
            </div>
          </div>

          {/* Line Items */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Line Items</h2>
              {editMode && (
                <button
                  onClick={handleAddLineItem}
                  className="px-3 py-1 text-sm bg-primary-600 text-white rounded hover:bg-primary-700"
                >
                  + Add Line
                </button>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 text-sm font-medium text-gray-700">Description</th>
                    <th className="text-right py-2 text-sm font-medium text-gray-700 w-20">Qty</th>
                    <th className="text-right py-2 text-sm font-medium text-gray-700 w-28">Unit Price</th>
                    <th className="text-right py-2 text-sm font-medium text-gray-700 w-24">VAT %</th>
                    <th className="text-right py-2 text-sm font-medium text-gray-700 w-24">VAT</th>
                    <th className="text-right py-2 text-sm font-medium text-gray-700 w-28">Total</th>
                    {editMode && <th className="w-10"></th>}
                  </tr>
                </thead>
                <tbody>
                  {editedLineItems.map((item, index) => (
                    <tr key={item.id} className="border-b border-gray-100">
                      <td className="py-3">
                        {editMode ? (
                          <input
                            type="text"
                            value={item.description}
                            onChange={(e) => handleDescriptionChange(index, e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                          />
                        ) : (
                          <span className="text-gray-900">{item.description}</span>
                        )}
                      </td>
                      <td className="py-3 text-right">
                        {editMode ? (
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => handleQuantityChange(index, parseInt(e.target.value) || 1)}
                            className="w-16 px-2 py-1 border border-gray-300 rounded text-sm text-right"
                            min="1"
                          />
                        ) : (
                          <span className="text-gray-700">{item.quantity}</span>
                        )}
                      </td>
                      <td className="py-3 text-right">
                        {editMode ? (
                          <input
                            type="number"
                            value={item.unitPrice}
                            onChange={(e) => handleUnitPriceChange(index, parseFloat(e.target.value) || 0)}
                            className="w-24 px-2 py-1 border border-gray-300 rounded text-sm text-right"
                            min="0"
                            step="0.01"
                          />
                        ) : (
                          <span className="text-gray-700">{item.unitPrice.toLocaleString()} kr</span>
                        )}
                      </td>
                      <td className="py-3 text-right">
                        {editMode ? (
                          <select
                            value={Math.round((item.vatRate || 0) * 100)}
                            onChange={(e) => handleVatChange(index, parseInt(e.target.value))}
                            className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                          >
                            <option value="0">0%</option>
                            <option value="6">6%</option>
                            <option value="12">12%</option>
                            <option value="25">25%</option>
                          </select>
                        ) : (
                          <span className="text-gray-700">{Math.round((item.vatRate || 0) * 100)}%</span>
                        )}
                      </td>
                      <td className="py-3 text-right text-gray-700">
                        {item.vatAmount.toLocaleString()} kr
                      </td>
                      <td className="py-3 text-right font-medium text-gray-900">
                        {item.totalPrice.toLocaleString()} kr
                      </td>
                      {editMode && (
                        <td className="py-3 text-center">
                          <button
                            onClick={() => handleRemoveLineItem(index)}
                            className="text-red-600 hover:text-red-800"
                            title="Remove line"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="mt-6 border-t border-gray-200 pt-4">
              <div className="flex justify-end">
                <div className="w-64 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal (excl. VAT):</span>
                    <span className="text-gray-900">{(subtotal - vatTotal).toLocaleString()} kr</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">VAT:</span>
                    <span className="text-gray-900">{vatTotal.toLocaleString()} kr</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold border-t border-gray-200 pt-2">
                    <span className="text-gray-900">Total:</span>
                    <span className="text-gray-900">{subtotal.toLocaleString()} kr</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Notes</h2>
            {editMode ? (
              <textarea
                value={editedNotes}
                onChange={(e) => setEditedNotes(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                rows={4}
                placeholder="Add notes (e.g., 'Reverse charge - VAT to be accounted for by the recipient')"
              />
            ) : (
              <p className="text-gray-700 whitespace-pre-wrap">
                {invoice.notes || 'No notes'}
              </p>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default InvoiceDetailPage;
