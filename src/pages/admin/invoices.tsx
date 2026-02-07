import { useState, useEffect } from 'react';
import { GetStaticProps } from 'next';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import Head from 'next/head';
import Link from 'next/link';
import { getAllInvoices, updateInvoiceStatus, generateInvoiceHtml, generateInvoicePDF, createCreditInvoice, Invoice, InvoiceLineItem, generateInvoiceNumber, storeInvoice, sendInvoiceEmail } from '@/services/invoiceService';
import { Timestamp } from 'firebase/firestore';
import { toast } from 'react-hot-toast';

// Admin email check (temporary solution until custom claims work)
const ADMIN_EMAILS = ['admin@doxvl.se', 'sofia@sofia.se'];

function AdminInvoicesPage() {
  const { t } = useTranslation('common');
  const { signOut } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [updatingInvoiceId, setUpdatingInvoiceId] = useState<string | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isCreatingInvoice, setIsCreatingInvoice] = useState(false);
  const [sendingInvoiceId, setSendingInvoiceId] = useState<string | null>(null);
  const [newInvoice, setNewInvoice] = useState<Partial<Invoice>>({
    customerInfo: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      address: '',
      postalCode: '',
      city: '',
      companyName: '',
      orgNumber: ''
    },
    lineItems: [],
    currency: 'SEK',
    status: 'draft',
    paymentTerms: 'Payment within 30 days'
  });

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const invoicesData = await getAllInvoices();
      setInvoices(invoicesData);
    } catch (err) {
      setError('Failed to load invoices. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (invoiceId: string, newStatus: Invoice['status']) => {
    setUpdatingInvoiceId(invoiceId);
    try {
      await updateInvoiceStatus(invoiceId, newStatus);

      // Update the local state
      setInvoices(invoices.map(invoice =>
        invoice.id === invoiceId ? { ...invoice, status: newStatus, updatedAt: new Date() as any } : invoice
      ));

      toast.success(`Invoice ${invoiceId} status updated to ${newStatus}`);
    } catch (err) {
      toast.error('Failed to update invoice status');
    } finally {
      setUpdatingInvoiceId(null);
    }
  };

  // Format date
  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';

    try {
      let date: Date;

      if (timestamp.toDate && typeof timestamp.toDate === 'function') {
        // Firebase Timestamp
        date = timestamp.toDate();
      } else if (timestamp instanceof Date) {
        // Already a Date object
        date = timestamp;
      } else if (typeof timestamp === 'string' || typeof timestamp === 'number') {
        // String or number timestamp
        date = new Date(timestamp);
      } else {
        // Try to convert from object
        date = new Date(timestamp);
      }

      // Check if date is valid
      if (isNaN(date.getTime())) {
        return 'N/A';
      }

      return new Intl.DateTimeFormat('sv-SE', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    } catch (error) {
      return 'N/A';
    }
  };

  // Get status badge color
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'sent':
        return 'bg-blue-100 text-blue-800';
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get status text in English
  const getStatusText = (status: string) => {
    switch (status) {
      case 'draft':
        return 'Draft';
      case 'sent':
        return 'Sent';
      case 'paid':
        return 'Paid';
      case 'overdue':
        return 'Overdue';
      case 'cancelled':
        return 'Cancelled';
      case 'credit_note':
        return 'Credit Note';
      default:
        return status;
    }
  };

  // Filter and search invoices
  const filteredInvoices = invoices.filter(invoice => {
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
    
    if (searchTerm === '') {
      return matchesStatus;
    }
    
    const searchTermLower = searchTerm.toLowerCase();
    const invoiceNumberMatch = invoice.invoiceNumber.toLowerCase().includes(searchTermLower);
    const firstNameMatch = invoice.customerInfo?.firstName?.toLowerCase().includes(searchTermLower) || false;
    const lastNameMatch = invoice.customerInfo?.lastName?.toLowerCase().includes(searchTermLower) || false;
    const emailMatch = invoice.customerInfo?.email?.toLowerCase().includes(searchTermLower) || false;
    const orderNumberMatch = invoice.orderNumber?.toLowerCase().includes(searchTermLower) || false;
    
    const matchesSearch = invoiceNumberMatch || firstNameMatch || lastNameMatch || emailMatch || orderNumberMatch;
    
    return matchesStatus && matchesSearch;
  });

  // Generate PDF from invoice
  const generatePDF = (invoice: Invoice) => {
    try {
      generateInvoicePDF(invoice);
      toast.success('Invoice downloaded as PDF');
    } catch (error) {
      toast.error('Could not generate PDF');
    }
  };

  // Open invoice details modal
  const openInvoiceModal = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setEditingInvoice(null);
    setIsEditing(false);
    setShowModal(true);
  };

  // Close invoice details modal
  const closeInvoiceModal = () => {
    setSelectedInvoice(null);
    setEditingInvoice(null);
    setIsEditing(false);
    setShowModal(false);
  };

  // Start editing invoice
  const startEditingInvoice = (invoice: Invoice) => {
    setEditingInvoice({ ...invoice });
    setIsEditing(true);
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditingInvoice(null);
    setIsEditing(false);
  };

  // Save edited invoice
  const saveEditedInvoice = async () => {
    if (!editingInvoice || !editingInvoice.id) return;

    try {
      // Update in Firebase
      const { doc, updateDoc, Timestamp } = await import('firebase/firestore');
      const { db } = await import('@/firebase/config');

      const docRef = doc(db, 'invoices', editingInvoice.id);
      await updateDoc(docRef, {
        ...editingInvoice,
        updatedAt: Timestamp.now()
      });

      // Update local state
      setInvoices(invoices.map(inv =>
        inv.id === editingInvoice.id ? editingInvoice : inv
      ));

      setSelectedInvoice(editingInvoice);
      setIsEditing(false);
      setEditingInvoice(null);

      toast.success('Invoice updated');
    } catch (error) {
      toast.error('Could not update invoice');
    }
  };

  // Update editing invoice field
  const updateEditingField = (field: string, value: any) => {
    if (!editingInvoice) return;

    setEditingInvoice({
      ...editingInvoice,
      [field]: value
    });
  };

  // Update customer info in editing invoice
  const updateCustomerInfo = (field: string, value: string) => {
    if (!editingInvoice) return;

    setEditingInvoice({
      ...editingInvoice,
      customerInfo: {
        ...editingInvoice.customerInfo,
        [field]: value
      }
    });
  };

  // Create credit invoice
  const handleCreateCreditInvoice = async (originalInvoiceId: string) => {
    try {
      const creditInvoice = await createCreditInvoice(originalInvoiceId);
      if (creditInvoice) {
        // Refresh the invoices list to show the new credit invoice
        await fetchInvoices();
        toast.success(`Credit note ${creditInvoice.invoiceNumber} created`);
      }
    } catch (error) {
      toast.error('Could not create credit note');
    }
  };

  // Send invoice via email
  const handleSendInvoice = async (invoice: Invoice) => {
    setSendingInvoiceId(invoice.id!);

    try {
      const success = await sendInvoiceEmail(invoice);

      if (success) {
        // Update invoice status to 'sent' if it was 'draft'
        if (invoice.status === 'draft') {
          await updateInvoiceStatus(invoice.id!, 'sent');
          // Update local state
          setInvoices(invoices.map(inv =>
            inv.id === invoice.id ? { ...inv, status: 'sent' as Invoice['status'] } : inv
          ));
        }

        toast.success(`Invoice sent to ${invoice.customerInfo.email}`);
      } else {
        toast.error('Could not send invoice via email');
      }
    } catch (error) {
      toast.error('An error occurred while sending the invoice');
    } finally {
      setSendingInvoiceId(null);
    }
  };

  // Open create invoice modal
  const openCreateModal = () => {
    setNewInvoice({
      customerInfo: {
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        address: '',
        postalCode: '',
        city: '',
        companyName: '',
        orgNumber: ''
      },
      lineItems: [],
      currency: 'SEK',
      status: 'draft',
      paymentTerms: 'Payment within 30 days'
    });
    setShowCreateModal(true);
  };

  // Close create invoice modal
  const closeCreateModal = () => {
    setShowCreateModal(false);
    setNewInvoice({
      customerInfo: {
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        address: '',
        postalCode: '',
        city: '',
        companyName: '',
        orgNumber: ''
      },
      lineItems: [],
      currency: 'SEK',
      status: 'draft',
      paymentTerms: 'Payment within 30 days'
    });
  };

  // Update new invoice field
  const updateNewInvoiceField = (field: string, value: any) => {
    setNewInvoice(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Update new invoice customer info
  const updateNewCustomerInfo = (field: string, value: string) => {
    setNewInvoice(prev => ({
      ...prev,
      customerInfo: {
        ...prev.customerInfo!,
        [field]: value
      }
    }));
  };

  // Add line item to new invoice
  const addLineItem = () => {
    const newLineItem: InvoiceLineItem = {
      id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      description: '',
      quantity: 1,
      unitPrice: 0,
      totalPrice: 0,
      vatRate: 0.25, // Default 25% VAT
      vatAmount: 0,
      serviceType: 'custom'
    };

    setNewInvoice(prev => ({
      ...prev,
      lineItems: [...(prev.lineItems || []), newLineItem]
    }));
  };

  // Update line item
  const updateLineItem = (index: number, field: string, value: any) => {
    setNewInvoice(prev => {
      const updatedLineItems = [...(prev.lineItems || [])];
      if (updatedLineItems[index]) {
        updatedLineItems[index] = { ...updatedLineItems[index], [field]: value };

        // Recalculate totals when quantity or unitPrice changes
        if (field === 'quantity' || field === 'unitPrice' || field === 'vatRate') {
          const item = updatedLineItems[index];
          const quantity = Number(item.quantity);
          const unitPrice = Number(item.unitPrice);
          const vatRate = Number(item.vatRate);

          const subtotal = quantity * unitPrice;
          const vatAmount = Math.round(subtotal * vatRate * 100) / 100;
          const totalPrice = Math.round((subtotal + vatAmount) * 100) / 100;

          updatedLineItems[index] = {
            ...item,
            vatAmount,
            totalPrice
          };
        }
      }

      return {
        ...prev,
        lineItems: updatedLineItems
      };
    });
  };

  // Remove line item
  const removeLineItem = (index: number) => {
    setNewInvoice(prev => ({
      ...prev,
      lineItems: (prev.lineItems || []).filter((_, i) => i !== index)
    }));
  };

  // Create new invoice
  const createNewInvoice = async () => {
    // Prevent multiple submissions
    if (isCreatingInvoice) return;

    setIsCreatingInvoice(true);

    try {
      // Validate required fields
      if (!newInvoice.customerInfo?.firstName || !newInvoice.customerInfo?.lastName ||
          !newInvoice.customerInfo?.email || !newInvoice.customerInfo?.address ||
          !newInvoice.customerInfo?.postalCode || !newInvoice.customerInfo?.city) {
        toast.error('Please fill in all required customer information');
        return;
      }

      if (!newInvoice.lineItems || newInvoice.lineItems.length === 0) {
        toast.error('Please add at least one service');
        return;
      }

      // Calculate totals
      const subtotal = (newInvoice.lineItems || []).reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
      const vatTotal = (newInvoice.lineItems || []).reduce((sum, item) => sum + item.vatAmount, 0);
      const totalAmount = subtotal + vatTotal;

      // Set due date (30 days from now)
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 30);

      // Create complete invoice object
      const completeInvoice: Invoice = {
        invoiceNumber: await generateInvoiceNumber(),
        orderId: '', // No order associated
        customerInfo: newInvoice.customerInfo!,
        lineItems: newInvoice.lineItems || [],
        subtotal,
        vatTotal,
        totalAmount,
        currency: newInvoice.currency || 'SEK',
        issueDate: Timestamp.now(),
        dueDate: Timestamp.fromDate(dueDate),
        status: newInvoice.status as Invoice['status'] || 'draft',
        paymentTerms: newInvoice.paymentTerms || 'Betalning inom 30 dagar',
        paymentReference: '',
        companyInfo: {
          name: 'DOX Visumpartner AB',
          address: 'Box 38',
          postalCode: '121 25',
          city: 'Stockholm-Globen',
          orgNumber: '559015-4521',
          vatNumber: 'SE559015452101',
          phone: '08-40941900',
          email: 'info@doxvl.se'
        },
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };

      // Set payment reference to invoice number
      completeInvoice.paymentReference = completeInvoice.invoiceNumber;

      // Store the invoice
      const invoiceId = await storeInvoice(completeInvoice);

      // Refresh the list
      await fetchInvoices();

      // Close modal and show success
      closeCreateModal();
      toast.success(`Invoice ${completeInvoice.invoiceNumber} created`);

    } catch (error) {
      toast.error('Could not create invoice');
    } finally {
      setIsCreatingInvoice(false);
    }
  };

  return (
    <>
      <Head>
        <title>Admin - Invoices</title>
        <meta name="description" content="Admin panel for managing invoices" />
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b border-primary-100">
          <div className="container mx-auto px-4 py-6">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <Link href="/admin" className="text-primary-600 hover:text-primary-700 mr-3 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                  </svg>
                </Link>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Invoice Management</h1>
                  <p className="text-sm text-gray-600 mt-1">Manage and track your invoices</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <button
                  onClick={openCreateModal}
                  className="inline-flex items-center px-6 py-3 border border-transparent rounded-lg text-sm font-medium text-white bg-custom-button hover:bg-custom-button/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-custom-button shadow-sm transition-all duration-200 hover:shadow-lg transform hover:-translate-y-0.5"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Create new invoice
                </button>
                <button
                  onClick={() => signOut()}
                  className="text-gray-600 hover:text-gray-800 px-3 py-2 rounded-md hover:bg-gray-100 transition-colors"
                >
                  Sign Out
                </button>
                <Link href="/admin" className="text-primary-600 hover:text-primary-700 font-medium transition-colors">
                  Dashboard
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl mb-8 shadow-sm">
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                {error}
                <button
                  onClick={fetchInvoices}
                  className="ml-4 underline text-red-700 hover:text-red-900 font-medium"
                >
                  Try again
                </button>
              </div>
            </div>
          )}

          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-sm border border-primary-100 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="p-3 bg-primary-100 rounded-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total invoices</p>
                  <p className="text-3xl font-bold text-gray-900">{invoices.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-primary-100 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="p-3 bg-gray-100 rounded-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Utkast</p>
                  <p className="text-3xl font-bold text-gray-900">{invoices.filter(i => i.status === 'draft').length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-primary-100 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Sent</p>
                  <p className="text-3xl font-bold text-gray-900">{invoices.filter(i => i.status === 'sent').length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-primary-100 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Betalda</p>
                  <p className="text-3xl font-bold text-gray-900">{invoices.filter(i => i.status === 'paid').length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-primary-100 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="p-3 bg-red-100 rounded-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Overdue</p>
                  <p className="text-3xl font-bold text-gray-900">{invoices.filter(i => i.status === 'overdue').length}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="bg-white rounded-xl shadow-sm border border-primary-100 mb-8 overflow-hidden">
            <div className="p-6 border-b border-primary-100 bg-gradient-to-r from-primary-50 to-secondary-50">
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Invoice Management</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Showing {filteredInvoices.length} of {invoices.length} invoices
                    {statusFilter !== 'all' && ` with status "${getStatusText(statusFilter)}"`}
                    {searchTerm && ` matching "${searchTerm}"`}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
                  {/* Search */}
                  <div className="flex items-center min-w-0 flex-1 lg:flex-initial">
                    <label htmlFor="search" className="mr-3 text-sm text-gray-700 font-medium whitespace-nowrap">
                      Search:
                    </label>
                    <input
                      id="search"
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Invoice number, name, email..."
                      className="border border-gray-300 rounded-lg px-4 py-2 text-sm bg-white focus:ring-2 focus:ring-custom-button focus:border-custom-button transition-colors min-w-0 flex-1"
                    />
                  </div>

                  {/* Status Filter */}
                  <div className="flex items-center">
                    <label htmlFor="status-filter" className="mr-3 text-sm text-gray-700 font-medium whitespace-nowrap">
                      Status:
                    </label>
                    <select
                      id="status-filter"
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="border border-gray-300 rounded-lg px-4 py-2 text-sm bg-white focus:ring-2 focus:ring-custom-button focus:border-custom-button transition-colors"
                    >
                      <option value="all">All invoices</option>
                      <option value="draft">Draft</option>
                      <option value="sent">Sent</option>
                      <option value="paid">Paid</option>
                      <option value="overdue">Overdue</option>
                      <option value="cancelled">Cancelled</option>
                      <option value="credit_note">Credit notes</option>
                    </select>
                  </div>

                  <button
                    onClick={fetchInvoices}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:ring-2 focus:ring-custom-button focus:border-custom-button transition-all duration-200 hover:shadow-sm"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Refresh
                  </button>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="animate-pulse">
                      <div className="flex justify-between items-start mb-4">
                        <div className="space-y-2">
                          <div className="h-5 bg-gray-200 rounded w-32"></div>
                          <div className="h-4 bg-gray-200 rounded w-24"></div>
                        </div>
                        <div className="text-right space-y-2">
                          <div className="h-8 bg-gray-200 rounded w-20"></div>
                          <div className="h-4 bg-gray-200 rounded w-16"></div>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {[...Array(4)].map((_, j) => (
                          <div key={j} className="space-y-2">
                            <div className="h-3 bg-gray-200 rounded w-16"></div>
                            <div className="h-4 bg-gray-200 rounded w-24"></div>
                            <div className="h-3 bg-gray-200 rounded w-20"></div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredInvoices.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto mb-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No invoices found</h3>
                <p className="text-gray-500">
                  {statusFilter === 'all' && !searchTerm
                    ? 'There are no invoices to display right now.'
                    : `No invoices found with the selected filters.`
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredInvoices.map((invoice) => (
                  <div key={invoice.id} className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200">
                    <div className="p-6">
                      {/* Header with Invoice Number and Amount */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1 min-w-0">
                          {invoice.orderNumber && (
                            <div className="mb-2">
                              <p className="text-lg font-bold text-blue-600">
                                Order: #{invoice.orderNumber}
                              </p>
                            </div>
                          )}
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-normal text-gray-600">
                              #{invoice.invoiceNumber}
                            </h3>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(invoice.status)}`}>
                              {getStatusText(invoice.status)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500">
                            Created: {formatDate(invoice.createdAt)}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-gray-900 mb-1">
                            {invoice.totalAmount} kr
                          </div>
                          <div className="text-sm text-gray-600">
                            Due: {formatDate(invoice.dueDate)}
                          </div>
                        </div>
                      </div>

                      {/* Customer Info */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div className="space-y-2">
                          <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Customer</h4>
                          <div className="space-y-1">
                            <p className="text-base font-medium text-gray-900">
                              {invoice.customerInfo.firstName} {invoice.customerInfo.lastName}
                            </p>
                            <p className="text-sm text-gray-600 truncate">{invoice.customerInfo.email}</p>
                            <p className="text-sm text-gray-600">{invoice.customerInfo.phone}</p>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Invoice Information</h4>
                          <div className="space-y-1">
                            <p className="text-sm text-gray-600">
                              Number of services: {invoice.lineItems.length}
                            </p>
                            <p className="text-sm text-gray-600">
                              VAT: {invoice.vatTotal} kr ({(invoice.vatTotal / invoice.totalAmount * 100).toFixed(1)}%)
                            </p>
                            <p className="text-sm text-gray-600">
                              Payment reference: {invoice.paymentReference}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-gray-200">
                        <div className="flex items-center gap-2">
                          <label className="text-sm font-medium text-gray-700">Status:</label>
                          <select
                            disabled={updatingInvoiceId === invoice.id}
                            className="border border-gray-300 rounded-md px-3 py-1 text-sm bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            value={invoice.status}
                            onChange={(e) => handleStatusChange(invoice.id!, e.target.value as Invoice['status'])}
                          >
                            <option value="draft">Draft</option>
                            <option value="sent">Sent</option>
                            <option value="paid">Paid</option>
                            <option value="overdue">Overdue</option>
                            <option value="cancelled">Cancelled</option>
                            <option value="credit_note">Credit Note</option>
                          </select>
                          {updatingInvoiceId === invoice.id && (
                            <div className="flex items-center">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600 mr-2"></div>
                              <span className="text-xs text-gray-500">Updating...</span>
                            </div>
                          )}
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => openInvoiceModal(invoice)}
                            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            View details
                          </button>

                          <button
                            onClick={() => handleSendInvoice(invoice)}
                            disabled={sendingInvoiceId === invoice.id}
                            className={`inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white ${
                              sendingInvoiceId === invoice.id
                                ? 'bg-gray-400 cursor-not-allowed'
                                : 'bg-blue-600 hover:bg-blue-700'
                            } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors`}
                          >
                            {sendingInvoiceId === invoice.id ? (
                              <div className="flex items-center">
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Sending...
                              </div>
                            ) : (
                              <>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                                Send invoice
                              </>
                            )}
                          </button>

                          <button
                            onClick={() => handleCreateCreditInvoice(invoice.id!)}
                            className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-colors"
                            disabled={invoice.status === 'credit_note'}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
                            </svg>
                            Create credit note
                          </button>

                          <button
                            onClick={() => generatePDF(invoice)}
                            className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Download invoice
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Invoice Details Modal */}
      {showModal && selectedInvoice && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Invoice #{selectedInvoice.invoiceNumber}
              </h3>
              <div className="flex items-center gap-2">
                {!isEditing && (
                  <button
                    onClick={() => startEditingInvoice(selectedInvoice)}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit
                  </button>
                )}
                <button
                  onClick={closeInvoiceModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="space-y-6">
              {/* Invoice Header */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-2">Bill to</h4>
                  {isEditing && editingInvoice ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">First name</label>
                          <input
                            type="text"
                            value={editingInvoice.customerInfo.firstName}
                            onChange={(e) => updateCustomerInfo('firstName', e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Last name</label>
                          <input
                            type="text"
                            value={editingInvoice.customerInfo.lastName}
                            onChange={(e) => updateCustomerInfo('lastName', e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Company</label>
                        <input
                          type="text"
                          value={editingInvoice.customerInfo.companyName || ''}
                          onChange={(e) => updateCustomerInfo('companyName', e.target.value)}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                          placeholder="Company name (optional)"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Address</label>
                        <input
                          type="text"
                          value={editingInvoice.customerInfo.address}
                          onChange={(e) => updateCustomerInfo('address', e.target.value)}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Postal code</label>
                          <input
                            type="text"
                            value={editingInvoice.customerInfo.postalCode}
                            onChange={(e) => updateCustomerInfo('postalCode', e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">City</label>
                          <input
                            type="text"
                            value={editingInvoice.customerInfo.city}
                            onChange={(e) => updateCustomerInfo('city', e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
                        <input
                          type="email"
                          value={editingInvoice.customerInfo.email}
                          onChange={(e) => updateCustomerInfo('email', e.target.value)}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Phone</label>
                        <input
                          type="tel"
                          value={editingInvoice.customerInfo.phone}
                          onChange={(e) => updateCustomerInfo('phone', e.target.value)}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Org. number</label>
                        <input
                          type="text"
                          value={editingInvoice.customerInfo.orgNumber || ''}
                          onChange={(e) => updateCustomerInfo('orgNumber', e.target.value)}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                          placeholder="Organization number (optional)"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-600 space-y-1">
                      <p className="font-medium">{selectedInvoice.customerInfo.firstName} {selectedInvoice.customerInfo.lastName}</p>
                      {selectedInvoice.customerInfo.companyName && <p>{selectedInvoice.customerInfo.companyName}</p>}
                      <p>{selectedInvoice.customerInfo.address}</p>
                      <p>{selectedInvoice.customerInfo.postalCode} {selectedInvoice.customerInfo.city}</p>
                      <p>{selectedInvoice.customerInfo.email}</p>
                      <p>{selectedInvoice.customerInfo.phone}</p>
                      {selectedInvoice.customerInfo.orgNumber && <p>Org. No: {selectedInvoice.customerInfo.orgNumber}</p>}
                    </div>
                  )}
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-2">Invoice Information</h4>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p><span className="font-medium">Invoice number:</span> {selectedInvoice.invoiceNumber}</p>
                    <p><span className="font-medium">Invoice date:</span> {formatDate(selectedInvoice.issueDate)}</p>
                    <p><span className="font-medium">Due date:</span> {formatDate(selectedInvoice.dueDate)}</p>
                    {selectedInvoice.orderNumber && <p><span className="font-medium">Order number:</span> {selectedInvoice.orderNumber}</p>}
                    <p><span className="font-medium">Status:</span> {getStatusText(selectedInvoice.status)}</p>
                    <p><span className="font-medium">Payment terms:</span> {selectedInvoice.paymentTerms}</p>
                  </div>
                </div>
              </div>

              {/* Line Items */}
              <div>
                <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4">Services</h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qty</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Price</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">VAT %</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {selectedInvoice.lineItems.map((item, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.description}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">{item.quantity}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">{item.unitPrice} kr</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">{(item.vatRate * 100).toFixed(0)}%</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">{item.totalPrice} kr</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Totals */}
              <div className="flex justify-end">
                <div className="w-64 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Net amount:</span>
                    <span>{(selectedInvoice.totalAmount - selectedInvoice.vatTotal).toFixed(2)} kr</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>VAT (25%):</span>
                    <span>{selectedInvoice.vatTotal.toFixed(2)} kr</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold border-t pt-2">
                    <span>Total due:</span>
                    <span>{selectedInvoice.totalAmount} kr</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                {isEditing ? (
                  <>
                    <button
                      onClick={cancelEditing}
                      className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={saveEditedInvoice}
                      className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-green-600 hover:bg-green-700"
                    >
                      Save changes
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={closeInvoiceModal}
                      className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                    >
                      Close
                    </button>
                    <button
                      onClick={() => {
                        generatePDF(selectedInvoice);
                        closeInvoiceModal();
                      }}
                      className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-red-600 hover:bg-red-700"
                    >
                      Download invoice
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Invoice Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-medium text-gray-900">
                Create new invoice
              </h3>
              <button
                onClick={closeCreateModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-6">
              {/* Customer Information */}
              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-4">Customer Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">First name *</label>
                    <input
                      type="text"
                      value={newInvoice.customerInfo?.firstName || ''}
                      onChange={(e) => updateNewCustomerInfo('firstName', e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Last name *</label>
                    <input
                      type="text"
                      value={newInvoice.customerInfo?.lastName || ''}
                      onChange={(e) => updateNewCustomerInfo('lastName', e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Company (optional)</label>
                  <input
                    type="text"
                    value={newInvoice.customerInfo?.companyName || ''}
                    onChange={(e) => updateNewCustomerInfo('companyName', e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Address *</label>
                    <input
                      type="text"
                      value={newInvoice.customerInfo?.address || ''}
                      onChange={(e) => updateNewCustomerInfo('address', e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Postal code *</label>
                    <input
                      type="text"
                      value={newInvoice.customerInfo?.postalCode || ''}
                      onChange={(e) => updateNewCustomerInfo('postalCode', e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                  <input
                    type="text"
                    value={newInvoice.customerInfo?.city || ''}
                    onChange={(e) => updateNewCustomerInfo('city', e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                    <input
                      type="email"
                      value={newInvoice.customerInfo?.email || ''}
                      onChange={(e) => updateNewCustomerInfo('email', e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <input
                      type="tel"
                      value={newInvoice.customerInfo?.phone || ''}
                      onChange={(e) => updateNewCustomerInfo('phone', e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Organization number (optional)</label>
                  <input
                    type="text"
                    value={newInvoice.customerInfo?.orgNumber || ''}
                    onChange={(e) => updateNewCustomerInfo('orgNumber', e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Line Items */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-lg font-medium text-gray-900">Services</h4>
                  <button
                    onClick={addLineItem}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Add service
                  </button>
                </div>

                {newInvoice.lineItems && newInvoice.lineItems.length > 0 ? (
                  <div className="space-y-3">
                    {newInvoice.lineItems.map((item, index) => (
                      <div key={item.id} className="border border-gray-200 rounded-md p-4">
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                            <input
                              type="text"
                              value={item.description}
                              onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="Service description"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => updateLineItem(index, 'quantity', parseInt(e.target.value) || 1)}
                              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Unit price (kr)</label>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.unitPrice}
                              onChange={(e) => updateLineItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex-1">
                              <label className="block text-sm font-medium text-gray-700 mb-1">VAT %</label>
                              <select
                                value={item.vatRate}
                                onChange={(e) => updateLineItem(index, 'vatRate', parseFloat(e.target.value))}
                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              >
                                <option value="0.00">0% (Embassy)</option>
                                <option value="0.25">25% (Standard)</option>
                              </select>
                            </div>
                            <button
                              onClick={() => removeLineItem(index)}
                              className="px-3 py-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md"
                              title="Remove service"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>
                        <div className="mt-2 text-sm text-gray-600">
                          Total: {item.totalPrice.toFixed(2)} kr (incl. {(item.vatAmount).toFixed(2)} kr VAT)
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p>No services added yet</p>
                    <p className="text-sm">Click "Add service" to get started</p>
                  </div>
                )}
              </div>

              {/* Invoice Summary */}
              {newInvoice.lineItems && newInvoice.lineItems.length > 0 && (
                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Invoice Summary</h4>
                  <div className="bg-gray-50 rounded-md p-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Number of services:</span>
                        <span>{newInvoice.lineItems.length}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Net amount:</span>
                        <span>{(newInvoice.lineItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0)).toFixed(2)} kr</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>VAT:</span>
                        <span>{(newInvoice.lineItems.reduce((sum, item) => sum + item.vatAmount, 0)).toFixed(2)} kr</span>
                      </div>
                      <div className="flex justify-between text-lg font-bold border-t pt-2">
                        <span>Total due:</span>
                        <span>{((newInvoice.lineItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0)) + (newInvoice.lineItems.reduce((sum, item) => sum + item.vatAmount, 0))).toFixed(2)} kr</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  onClick={closeCreateModal}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={createNewInvoice}
                  disabled={isCreatingInvoice}
                  className={`px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white ${
                    isCreatingInvoice
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {isCreatingInvoice ? (
                    <div className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Creating invoice...
                    </div>
                  ) : (
                    'Create invoice'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function ProtectedAdminInvoicesPage() {
  return (
    <ProtectedRoute>
      <AdminInvoicesPage />
    </ProtectedRoute>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  // Admin pages always use English
  const i18nConfig = {
    i18n: { defaultLocale: 'sv', locales: ['sv', 'en'], localeDetection: false as const },
  };
  return {
    props: {
      ...(await serverSideTranslations('en', ['common'], i18nConfig)),
    },
  };
}