import { useState, useEffect } from 'react';
import { GetServerSideProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { getOrderById, updateOrder } from '@/services/hybridOrderService';
import { Order } from '@/firebase/orderService';
import { Timestamp } from 'firebase/firestore';
import { toast } from 'react-hot-toast';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';

// Define Order interface locally to match the updated interface
interface ExtendedOrder extends Order {
  processingSteps?: ProcessingStep[];
  adminNotes?: AdminNote[];
  internalNotes?: string;
}

interface ProcessingStep {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'skipped';
  completedAt?: Date | Timestamp;
  completedBy?: string;
  notes?: string;
}

interface AdminNote {
  id: string;
  content: string;
  createdAt: Date;
  createdBy: string;
  type: 'general' | 'processing' | 'customer' | 'issue';
}

function AdminOrderDetailPage({ orderId }: { orderId: string }) {
  const { t } = useTranslation('common');
  const router = useRouter();
  const { signOut } = useAuth();
  const [order, setOrder] = useState<ExtendedOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [editedStatus, setEditedStatus] = useState<Order['status']>('pending');
  const [activeTab, setActiveTab] = useState<'overview' | 'processing' | 'files' | 'notes'>('overview');
  const [newNote, setNewNote] = useState('');
  const [noteType, setNoteType] = useState<'general' | 'processing' | 'customer' | 'issue'>('general');
  const [internalNotes, setInternalNotes] = useState('');
  const [processingSteps, setProcessingSteps] = useState<any[]>([]);

  useEffect(() => {
    if (orderId) {
      fetchOrder();
    }
  }, [orderId]);

  // Initialize processing steps based on order type
  const initializeProcessingSteps = (orderData: ExtendedOrder): ProcessingStep[] => {
    const steps: ProcessingStep[] = [];

    // Always include document receipt
    steps.push({
      id: 'document_receipt',
      name: 'Dokument mottagna',
      description: 'Originaldokument har mottagits och registrerats',
      status: orderData.documentSource === 'original' ? 'completed' : 'pending'
    });

    // Add service-specific steps
    if (Array.isArray(orderData.services)) {
      if (orderData.services.includes('chamber')) {
        steps.push({
          id: 'chamber_processing',
          name: 'Handelskammaren',
          description: 'Legaliserng hos Handelskammaren',
          status: 'pending'
        });
      }

      if (orderData.services.includes('notarization')) {
        steps.push({
          id: 'notarization',
          name: 'Notarisering',
          description: 'Notarisering av dokument',
          status: 'pending'
        });
      }

      if (orderData.services.includes('translation')) {
        steps.push({
          id: 'translation',
          name: 'Översättning',
          description: 'Auktoriserad översättning',
          status: 'pending'
        });
      }

      if (orderData.services.includes('ud')) {
        steps.push({
          id: 'ud_processing',
          name: 'Utrikesdepartementet',
          description: 'Legaliserng hos svenska UD',
          status: 'pending'
        });
      }

      if (orderData.services.includes('embassy')) {
        steps.push({
          id: 'embassy_processing',
          name: 'Ambassad',
          description: `Legaliserng på ${orderData.country} ambassad`,
          status: 'pending'
        });
      }

      if (orderData.services.includes('apostille')) {
        steps.push({
          id: 'apostille',
          name: 'Apostille',
          description: 'Apostille från svenska UD',
          status: 'pending'
        });
      }
    }

    // Add scanned copies if requested
    if (orderData.scannedCopies) {
      steps.push({
        id: 'scanning',
        name: 'Scannade kopior',
        description: 'Skapa digitala kopior av dokument',
        status: 'pending'
      });
    }

    // Add return shipping
    steps.push({
      id: 'return_shipping',
      name: 'Returfrakt',
      description: 'Skicka tillbaka legaliserade dokument',
      status: 'pending'
    });

    return steps;
  };

  const fetchOrder = async () => {
    setLoading(true);
    try {
      const orderData = await getOrderById(orderId);
      if (orderData) {
        const extendedOrder = orderData as ExtendedOrder;
        setOrder(extendedOrder);
        setEditedStatus(extendedOrder.status);
        setInternalNotes(extendedOrder.internalNotes || '');
        setProcessingSteps(extendedOrder.processingSteps || initializeProcessingSteps(extendedOrder));
      } else {
        setError('Order not found');
      }
    } catch (err) {
      console.error('Error fetching order:', err);
      setError('Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (!order) return;

    setIsUpdating(true);
    try {
      await updateOrder(orderId, { status: editedStatus });
      setOrder({ ...order, status: editedStatus });
      toast.success('Order status updated successfully');
    } catch (err) {
      console.error('Error updating order status:', err);
      toast.error('Failed to update order status');
    } finally {
      setIsUpdating(false);
    }
  };

  // Update processing step status
  const updateProcessingStep = async (stepId: string, status: ProcessingStep['status'], notes?: string) => {
    if (!order) return;

    const updatedSteps = processingSteps.map(step => {
      if (step.id === stepId) {
        // Create a clean object without undefined values
        const cleanStep: any = {
          id: step.id,
          name: step.name,
          description: step.description,
          status: status,
          notes: notes || step.notes || ''
        };

        // Only add completedAt and completedBy if status is completed
        if (status === 'completed') {
          cleanStep.completedAt = Timestamp.now();
          cleanStep.completedBy = 'Admin';
        }

        return cleanStep;
      }
      return step;
    });

    const updatedOrder = {
      ...order,
      processingSteps: updatedSteps
    };

    try {
      await updateOrder(orderId, { processingSteps: updatedSteps });
      setProcessingSteps(updatedSteps);
      setOrder(updatedOrder);
      toast.success('Bearbetningssteg uppdaterat');
    } catch (err) {
      console.error('Error updating processing step:', err);
      toast.error('Kunde inte uppdatera bearbetningssteg');
    }
  };

  // Save internal notes
  const saveInternalNotes = async () => {
    if (!order) return;

    try {
      await updateOrder(orderId, { internalNotes });
      setOrder({ ...order, internalNotes });
      toast.success('Interna anteckningar sparade');
    } catch (err) {
      console.error('Error saving internal notes:', err);
      toast.error('Kunde inte spara interna anteckningar');
    }
  };

  // Add a new note
  const addNote = async () => {
    if (!newNote.trim() || !order) return;

    const note: AdminNote = {
      id: Date.now().toString(),
      content: newNote.trim(),
      createdAt: new Date(),
      createdBy: 'Admin',
      type: noteType
    };

    const updatedOrder = {
      ...order,
      adminNotes: [...(order.adminNotes || []), note]
    };

    try {
      await updateOrder(orderId, { adminNotes: updatedOrder.adminNotes });
      setOrder(updatedOrder);
      setNewNote('');
      toast.success('Anteckning tillagd');
    } catch (err) {
      console.error('Error adding note:', err);
      toast.error('Kunde inte lägga till anteckning');
    }
  };

  // Function to get service name
  const getServiceName = (serviceId: string) => {
    switch (serviceId) {
      case 'apostille':
        return t('services.apostille.title');
      case 'notarisering':
        return t('services.notarization.title');
      case 'ambassad':
        return t('services.embassy.title');
      case 'oversattning':
        return t('services.translation.title');
      case 'utrikesdepartementet':
        return 'Utrikesdepartementet';
      default:
        return serviceId;
    }
  };

  // Format date
  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';

    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);

    return new Intl.DateTimeFormat('sv-SE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  // Get status badge color
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-blue-100 text-blue-800';
      case 'processing':
        return 'bg-yellow-100 text-yellow-800';
      case 'shipped':
        return 'bg-purple-100 text-purple-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <>
      <Head>
        <title>Order Details | Admin | Legaliseringstjänst</title>
        <meta name="description" content="Comprehensive order management system" />
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <div className="bg-gray-100 min-h-screen">
        {/* Header */}
        <div className="bg-white shadow">
          <div className="container mx-auto px-4 py-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <Link href="/admin/orders" className="text-gray-500 hover:text-gray-700 mr-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                  </svg>
                </Link>
                <h1 className="text-2xl font-bold text-gray-800">
                  {loading ? 'Loading...' : `Order ${order?.orderNumber || orderId}`}
                </h1>
              </div>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => signOut()}
                  className="text-gray-600 hover:text-gray-800"
                >
                  Sign Out
                </button>
                <Link href="/admin" className="text-primary-600 hover:text-primary-800">
                  Dashboard
                </Link>
                <Link href="/admin/orders" className="text-primary-600 hover:text-primary-800">
                  All Orders
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
              {error}
              <button
                onClick={fetchOrder}
                className="ml-4 underline text-red-700 hover:text-red-900"
              >
                Försök igen
              </button>
            </div>
          )}

          {loading ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mb-4"></div>
              <p className="text-gray-600">Laddar orderdetaljer...</p>
            </div>
          ) : order ? (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              {/* Quick Actions Bar */}
              <div className="p-4 border-b border-gray-200 bg-gray-50">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="flex items-center space-x-4">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeColor(order.status)}`}>
                      {order.status === 'pending' ? 'Väntar' :
                       order.status === 'processing' ? 'Bearbetas' :
                       order.status === 'shipped' ? 'Skickad' :
                       order.status === 'delivered' ? 'Levererad' :
                       order.status === 'cancelled' ? 'Avbruten' : order.status}
                    </span>
                    <span className="text-lg font-semibold text-gray-900">{order.totalPrice} kr</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <select
                      value={editedStatus}
                      onChange={(e) => setEditedStatus(e.target.value as Order['status'])}
                      className="border border-gray-300 rounded px-3 py-1 text-sm"
                      disabled={isUpdating}
                    >
                      <option value="pending">Väntar</option>
                      <option value="processing">Bearbetas</option>
                      <option value="shipped">Skickad</option>
                      <option value="delivered">Levererad</option>
                      <option value="cancelled">Avbruten</option>
                    </select>
                    <button
                      onClick={handleStatusUpdate}
                      disabled={isUpdating || order.status === editedStatus}
                      className="px-4 py-1 bg-primary-600 text-white rounded hover:bg-primary-700 disabled:opacity-50 text-sm"
                    >
                      {isUpdating ? 'Uppdaterar...' : 'Uppdatera'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Tab Navigation */}
              <div className="p-4 border-b border-gray-200 bg-gray-50">
                <nav className="flex">
                  {[
                    { id: 'overview', label: 'Översikt', icon: '📋' },
                    { id: 'processing', label: 'Bearbetning', icon: '⚙️' },
                    { id: 'files', label: 'Filer', icon: '📎' },
                    { id: 'notes', label: 'Anteckningar', icon: '📝' }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`flex items-center px-4 py-2 mr-2 rounded-md font-medium text-sm transition-colors ${
                        activeTab === tab.id
                          ? 'bg-primary-100 text-primary-700'
                          : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                      }`}
                    >
                      <span className="mr-2">{tab.icon}</span>
                      {tab.label}
                    </button>
                  ))}
                </nav>
              </div>

              <div className="p-6">
                {/* Overview Tab */}
                {activeTab === 'overview' && (
                  <div className="space-y-6">
                    {/* Order Summary Card */}
                    <div className="bg-white rounded-lg shadow overflow-hidden">
                      <div className="p-4 border-b border-gray-200 bg-gray-50">
                        <h3 className="text-lg font-medium text-gray-800">Orderöversikt</h3>
                      </div>
                      <div className="p-6">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                          {/* Order Details */}
                          <div className="lg:col-span-2 space-y-6">
                            {/* Basic Order Info */}
                            <div>
                              <h3 className="text-lg font-medium mb-4">Orderinformation</h3>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-gray-50 p-4 rounded-lg">
                                  <p className="text-sm text-gray-500 mb-1">Dokumenttyp</p>
                                  <p className="font-medium">
                                    {order.documentType === 'birthCertificate' ? 'Födelsebevis' :
                                     order.documentType === 'marriageCertificate' ? 'Vigselbevis' :
                                     order.documentType === 'diploma' ? 'Examensbevis' :
                                     order.documentType === 'commercial' ? 'Handelsdokument' :
                                     order.documentType === 'powerOfAttorney' ? 'Fullmakt' : 'Annat dokument'}
                                  </p>
                                </div>
                                <div className="bg-gray-50 p-4 rounded-lg">
                                  <p className="text-sm text-gray-500 mb-1">Land</p>
                                  <p className="font-medium">{order.country}</p>
                                </div>
                                <div className="bg-gray-50 p-4 rounded-lg">
                                  <p className="text-sm text-gray-500 mb-1">Antal dokument</p>
                                  <p className="font-medium">{order.quantity} st</p>
                                </div>
                                <div className="bg-gray-50 p-4 rounded-lg">
                                  <p className="text-sm text-gray-500 mb-1">Källa</p>
                                  <p className="font-medium">
                                    {order.documentSource === 'original' ? 'Originaldokument' : 'Uppladdade filer'}
                                  </p>
                                </div>
                              </div>
                            </div>

                            {/* Services */}
                            <div>
                              <h3 className="text-lg font-medium mb-4">Valda tjänster</h3>
                              <div className="space-y-3">
                                {Array.isArray(order.services) ? (
                                  order.services.map((service, index) => (
                                    <div key={index} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                                      <span className="font-medium">{getServiceName(service)}</span>
                                      <span className="text-sm text-gray-600">Aktiv</span>
                                    </div>
                                  ))
                                ) : (
                                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                                    <span className="font-medium">{getServiceName(order.services as unknown as string)}</span>
                                    <span className="text-sm text-gray-600">Aktiv</span>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Pricing Breakdown */}
                            {order.pricingBreakdown && order.pricingBreakdown.length > 0 && (
                              <div>
                                <h3 className="text-lg font-medium mb-4">Prisuppdelning</h3>
                                <div className="space-y-2">
                                  {order.pricingBreakdown.map((item: any, index: number) => (
                                    <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100">
                                      <span className="text-gray-600">
                                        {item.service === 'scanned_copies' ? 'Scannade kopior' :
                                         item.service === 'return_service' ? item.description || 'Returfrakt' :
                                         item.service === 'pickup_service' ? 'Dokumenthämtning' :
                                         getServiceName(item.service)}
                                        {item.quantity && item.quantity > 1 ? ` (${item.quantity}x)` : ''}
                                      </span>
                                      <span className="font-medium">
                                        {item.fee ? `${item.fee} kr` : item.basePrice ? `${item.basePrice} kr` : 'N/A'}
                                      </span>
                                    </div>
                                  ))}
                                  <div className="flex justify-between items-center pt-2 border-t border-gray-200 font-semibold">
                                    <span>Totalbelopp</span>
                                    <span>{order.totalPrice} kr</span>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Customer Info Sidebar */}
                          <div className="space-y-6">
                            <div className="bg-white border border-gray-200 rounded-lg p-6">
                              <h3 className="text-lg font-medium mb-4">Kundinformation</h3>
                              <div className="space-y-3">
                                <div>
                                  <p className="text-sm text-gray-500">Namn</p>
                                  <p className="font-medium">{order.customerInfo.firstName} {order.customerInfo.lastName}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-500">E-post</p>
                                  <p className="font-medium">{order.customerInfo.email}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-500">Telefon</p>
                                  <p className="font-medium">{order.customerInfo.phone}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-500">Adress</p>
                                  <p className="font-medium">
                                    {order.customerInfo.address}<br/>
                                    {order.customerInfo.postalCode} {order.customerInfo.city}
                                  </p>
                                </div>
                              </div>
                            </div>

                            {/* Quick Actions */}
                            <div className="bg-white border border-gray-200 rounded-lg p-6">
                              <h3 className="text-lg font-medium mb-4">Snabba åtgärder</h3>
                              <div className="space-y-2">
                                <Link
                                  href={`mailto:${order.customerInfo.email}?subject=Order ${orderId}`}
                                  className="w-full flex items-center justify-center py-2 px-4 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                  </svg>
                                  Skicka e-post
                                </Link>
                                <button
                                  onClick={() => window.print()}
                                  className="w-full flex items-center justify-center py-2 px-4 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                                  </svg>
                                  Skriv ut
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Processing Tab */}
                {activeTab === 'processing' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium mb-4">Bearbetningssteg</h3>
                      <div className="space-y-4">
                        {processingSteps.map((step, index) => (
                          <div key={step.id} className="border border-gray-200 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium mr-3 ${
                                  step.status === 'completed' ? 'bg-green-100 text-green-800' :
                                  step.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                                  step.status === 'pending' ? 'bg-gray-100 text-gray-600' :
                                  'bg-red-100 text-red-800'
                                }`}>
                                  {step.status === 'completed' ? '✓' :
                                   step.status === 'in_progress' ? '⟳' :
                                   step.status === 'pending' ? index + 1 : '✗'}
                                </div>
                                <div>
                                  <h4 className="font-medium">{step.name}</h4>
                                  <p className="text-sm text-gray-600">{step.description}</p>
                                </div>
                              </div>
                              <select
                                value={step.status}
                                onChange={(e) => updateProcessingStep(step.id, e.target.value as ProcessingStep['status'])}
                                className="border border-gray-300 rounded px-2 py-1 text-sm"
                              >
                                <option value="pending">Väntar</option>
                                <option value="in_progress">Pågår</option>
                                <option value="completed">Klar</option>
                                <option value="skipped">Hoppas över</option>
                              </select>
                            </div>
                            {step.status === 'completed' && step.completedAt && (
                              <div className="text-xs text-gray-500 mt-2">
                                Slutfört {formatDate(step.completedAt)} av {step.completedBy}
                              </div>
                            )}
                            {step.notes && (
                              <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                                {step.notes}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Internal Notes */}
                    <div>
                      <h3 className="text-lg font-medium mb-4">Interna anteckningar</h3>
                      <textarea
                        value={internalNotes}
                        onChange={(e) => setInternalNotes(e.target.value)}
                        placeholder="Lägg till interna anteckningar om denna order..."
                        className="w-full border border-gray-300 rounded-lg p-3"
                        rows={4}
                      />
                      <button
                        onClick={saveInternalNotes}
                        className="mt-2 px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700"
                      >
                        Spara anteckningar
                      </button>
                    </div>
                  </div>
                )}

                {/* Files Tab */}
                {activeTab === 'files' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium mb-4">Uppladdade filer</h3>
                      {order.uploadedFiles && order.uploadedFiles.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {order.uploadedFiles.map((file: any, index: number) => (
                            <div key={index} className="border border-gray-200 rounded-lg p-4">
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                  </svg>
                                  <div>
                                    <p className="font-medium text-gray-900">{file.originalName}</p>
                                    <p className="text-sm text-gray-500">
                                      {(file.size / 1024 / 1024).toFixed(2)} MB • {file.type}
                                    </p>
                                  </div>
                                </div>
                              </div>
                              <div className="flex space-x-2">
                                <a
                                  href={file.downloadURL}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex-1 text-center px-3 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 text-sm"
                                >
                                  Ladda ner
                                </a>
                                <button
                                  onClick={() => window.open(file.downloadURL, '_blank')}
                                  className="px-3 py-2 border border-gray-300 rounded hover:bg-gray-50 text-sm"
                                >
                                  Förhandsvisa
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <p>Inga filer uppladdade än</p>
                        </div>
                      )}
                    </div>

                    {/* Pickup Address */}
                    {order.pickupService && order.pickupAddress && (
                      <div>
                        <h3 className="text-lg font-medium mb-4">Hämtningsadress</h3>
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <div className="flex items-center mb-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span className="font-medium text-blue-800">Dokumenthämtning beställd</span>
                          </div>
                          <p className="text-blue-700">{order.pickupAddress.street}</p>
                          <p className="text-blue-700">{order.pickupAddress.postalCode} {order.pickupAddress.city}</p>
                          <p className="text-blue-600 text-sm mt-2">Vi kommer att kontakta kunden inom 24 timmar för att boka tid för hämtning.</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Notes Tab */}
                {activeTab === 'notes' && (
                  <div className="space-y-6">
                    {/* Add New Note */}
                    <div>
                      <h3 className="text-lg font-medium mb-4">Lägg till anteckning</h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Typ av anteckning</label>
                          <select
                            value={noteType}
                            onChange={(e) => setNoteType(e.target.value as AdminNote['type'])}
                            className="border border-gray-300 rounded px-3 py-2"
                          >
                            <option value="general">Allmänt</option>
                            <option value="processing">Bearbetning</option>
                            <option value="customer">Kundrelaterat</option>
                            <option value="issue">Problem</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Anteckning</label>
                          <textarea
                            value={newNote}
                            onChange={(e) => setNewNote(e.target.value)}
                            placeholder="Skriv din anteckning här..."
                            className="w-full border border-gray-300 rounded-lg p-3"
                            rows={3}
                          />
                        </div>
                        <button
                          onClick={addNote}
                          disabled={!newNote.trim()}
                          className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 disabled:opacity-50"
                        >
                          Lägg till anteckning
                        </button>
                      </div>
                    </div>

                    {/* Existing Notes */}
                    <div>
                      <h3 className="text-lg font-medium mb-4">Tidigare anteckningar</h3>
                      {order.adminNotes && order.adminNotes.length > 0 ? (
                        <div className="space-y-4">
                          {order.adminNotes.map((note: AdminNote, index: number) => (
                            <div key={note.id} className={`border rounded-lg p-4 ${
                              note.type === 'issue' ? 'border-red-200 bg-red-50' :
                              note.type === 'customer' ? 'border-blue-200 bg-blue-50' :
                              note.type === 'processing' ? 'border-yellow-200 bg-yellow-50' :
                              'border-gray-200 bg-gray-50'
                            }`}>
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center">
                                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mr-2 ${
                                    note.type === 'issue' ? 'bg-red-100 text-red-800' :
                                    note.type === 'customer' ? 'bg-blue-100 text-blue-800' :
                                    note.type === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-gray-100 text-gray-800'
                                  }`}>
                                    {note.type === 'general' ? 'Allmänt' :
                                     note.type === 'processing' ? 'Bearbetning' :
                                     note.type === 'customer' ? 'Kund' : 'Problem'}
                                  </span>
                                  <span className="text-sm text-gray-600">
                                    {formatDate(note.createdAt)} av {note.createdBy}
                                  </span>
                                </div>
                              </div>
                              <p className="text-gray-800 whitespace-pre-wrap">{note.content}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          <p>Inga anteckningar än</p>
                        </div>
                      )}
                    </div>

                    {/* Customer Information from Order */}
                    {(order.invoiceReference || order.additionalNotes) && (
                      <div>
                        <h3 className="text-lg font-medium mb-4">Kundens information</h3>
                        <div className="space-y-4">
                          {order.invoiceReference && (
                            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                              <h4 className="font-medium text-green-800 mb-2">Fakturareferens</h4>
                              <p className="text-green-700">{order.invoiceReference}</p>
                            </div>
                          )}
                          {order.additionalNotes && (
                            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                              <h4 className="font-medium text-purple-800 mb-2">Ytterligare information</h4>
                              <p className="text-purple-700 whitespace-pre-wrap">{order.additionalNotes}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <p className="text-gray-600">Ordern hittades inte</p>
              <Link href="/admin/orders" className="mt-4 inline-block text-primary-600 hover:text-primary-800">
                Tillbaka till alla ordrar
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default function ProtectedAdminOrderDetailPage({ orderId }: { orderId: string }) {
  return (
    <ProtectedRoute>
      <AdminOrderDetailPage orderId={orderId} />
    </ProtectedRoute>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ params, locale }) => {
  const orderId = params?.id as string;

  return {
    props: {
      ...(await serverSideTranslations(locale || 'sv', ['common'])),
      orderId,
    },
  };
};
