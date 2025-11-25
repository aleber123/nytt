import React, { useState, useEffect } from 'react';
import { GetStaticProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import Head from 'next/head';
import Link from 'next/link';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { getAllOrders, updateOrder } from '@/firebase/orderService';
import type { Order } from '@/firebase/orderService';
import { ALL_COUNTRIES } from '@/components/order/data/countries';

interface ProcessingStep {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'skipped';
  completedAt?: any;
  completedBy?: string;
  notes?: string;
  submittedAt?: any;
  expectedCompletionDate?: any;
}

interface DriverTask {
  orderId: string;
  orderNumber: string;
  customerName: string;
  stepName: string;
  stepDescription: string;
  authority: string;
  date: string;
  type: 'pickup' | 'delivery';
  status: 'pending' | 'in_progress' | 'completed';
  address?: string;
  notes?: string;
  stepId: string; // Add stepId to track which processing step this corresponds to
}

function DriverDashboardPage() {
  const [tasks, setTasks] = useState<DriverTask[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [filterType, setFilterType] = useState<'all' | 'pickup' | 'delivery'>('all');

  console.log('🚗 DriverDashboardPage component mounted');

  const getCountryInfo = (codeOrName: string | undefined | null) => {
    const value = (codeOrName || '').trim();
    if (!value) return { code: '', name: '', flag: '🌍' };

    const upper = value.toUpperCase();

    let match = ALL_COUNTRIES.find((c) => c.code === upper);
    if (match) return { code: match.code, name: match.name, flag: match.flag };

    match = ALL_COUNTRIES.find((c) => c.name.toLowerCase() === value.toLowerCase());
    if (match) return { code: match.code, name: match.name, flag: match.flag };

    return { code: value, name: value, flag: '🌍' };
  };

  // Simplified version of initializeProcessingSteps for driver dashboard
  const initializeProcessingSteps = (orderData: Order): ProcessingStep[] => {
    const steps: ProcessingStep[] = [];

    // Document receipt - always needed for processing
    if (orderData.documentSource !== 'upload') {
      steps.push({
        id: 'document_receipt',
        name: '📄 Dokument mottagna',
        description: orderData.pickupService
          ? 'Originaldokument har hämtats och registrerats'
          : 'Originaldokument har mottagits och registrerats',
        status: 'completed', // Assume documents are received
        expectedCompletionDate: new Date() // Today
      });
    }

    // Pickup booking if customer requested pickup
    if (orderData.pickupService) {
      steps.push({
        id: 'pickup_booking',
        name: '📦 Upphämtning bokad',
        description: `Upphämtning bokad från ${orderData.pickupAddress?.street || 'kundadress'}`,
        status: 'pending',
        expectedCompletionDate: new Date() // Today - ready for pickup
      });
    }

    // Only create steps that involve external authorities
    if (Array.isArray(orderData.services)) {
      // Notarization - DELIVERY first, then PICKUP
      if (orderData.services.includes('notarization')) {
        steps.push({
          id: 'notarization_delivery',
          name: '📤 Notarisering - lämna in',
          description: 'Lämna in dokument för notarisering',
          status: 'pending',
          expectedCompletionDate: new Date() // Today - ready for delivery
        });
        steps.push({
          id: 'notarization_pickup',
          name: '📦 Notarisering - hämta',
          description: 'Hämta notarierbara dokument',
          status: 'pending',
          expectedCompletionDate: new Date() // Today - ready for pickup
        });
      }

      // Translation - DELIVERY first, then PICKUP
      if (orderData.services.includes('translation')) {
        steps.push({
          id: 'translation_delivery',
          name: '📤 Översättning - lämna in',
          description: 'Lämna in dokument för översättning',
          status: 'pending',
          expectedCompletionDate: new Date() // Today - ready for delivery
        });
        steps.push({
          id: 'translation_pickup',
          name: '📦 Översättning - hämta',
          description: 'Hämta översatta dokument',
          status: 'pending',
          expectedCompletionDate: new Date() // Today - ready for pickup
        });
      }

      // Chamber legalization - DELIVERY first, then PICKUP
      if (orderData.services.includes('chamber')) {
        steps.push({
          id: 'chamber_delivery',
          name: '📤 Handelskammaren - lämna in',
          description: 'Lämna in dokument för legalisering',
          status: 'pending',
          expectedCompletionDate: new Date() // Today - ready for delivery
        });
        steps.push({
          id: 'chamber_pickup',
          name: '📦 Handelskammaren - hämta',
          description: 'Hämta legaliserade dokument',
          status: 'pending',
          expectedCompletionDate: new Date() // Today - ready for pickup
        });
      }

      // UD processing - DELIVERY first, then PICKUP
      if (orderData.services.includes('ud')) {
        steps.push({
          id: 'ud_delivery',
          name: '📤 Utrikesdepartementet - lämna in',
          description: 'Lämna in dokument för legalisering',
          status: 'pending',
          expectedCompletionDate: new Date() // Today - ready for delivery
        });
        steps.push({
          id: 'ud_pickup',
          name: '📦 Utrikesdepartementet - hämta',
          description: 'Hämta legaliserade dokument',
          status: 'pending',
          expectedCompletionDate: new Date() // Today - ready for pickup
        });
      }

      // Apostille - DELIVERY first, then PICKUP
      if (orderData.services.includes('apostille')) {
        steps.push({
          id: 'apostille_delivery',
          name: '📤 Apostille - lämna in',
          description: 'Lämna in dokument för apostille',
          status: 'pending',
          expectedCompletionDate: new Date() // Today - ready for delivery
        });
        steps.push({
          id: 'apostille_pickup',
          name: '📦 Apostille - hämta',
          description: 'Hämta dokument med apostille',
          status: 'pending',
          expectedCompletionDate: new Date() // Today - ready for pickup
        });
      }

      // Embassy legalization - DELIVERY first, then PICKUP
      if (orderData.services.includes('embassy')) {
        steps.push({
          id: 'embassy_delivery',
          name: '📤 Ambassad - lämna in',
          description: `Lämna in dokument för konsulär legalisering`,
          status: 'pending',
          expectedCompletionDate: new Date() // Today - ready for delivery
        });
        steps.push({
          id: 'embassy_pickup',
          name: '📦 Ambassad - hämta',
          description: `Hämta konsulärt legaliserade dokument`,
          status: 'pending',
          expectedCompletionDate: new Date() // Today - ready for pickup
        });
      }
    }

    // Return shipping - for completed orders
    steps.push({
      id: 'return_shipping',
      name: '🚚 Retur skickad',
      description: 'Dokument returnerade till kund',
      status: 'pending',
      expectedCompletionDate: new Date() // Today when ready
    });

    return steps;
  };

  const fetchDriverTasks = async () => {
    try {
      setLoading(true);
      console.log('🔍 Starting to fetch driver tasks...');
      console.log('📅 Selected date:', selectedDate);

      const orders = await getAllOrders();
      console.log(`📊 Total orders fetched: ${orders.length}`);

      const driverTasks: DriverTask[] = [];
      const ordersToUpdate: Array<{orderId: string, processingSteps: ProcessingStep[]}> = [];

      orders.forEach((order: Order) => {
        console.log(`🏷️  Processing order ${order.id}: pickupService=${order.pickupService}, services=${JSON.stringify(order.services)}`);
        console.log(`   📋 Order number: ${order.orderNumber}`);
        console.log(`   📅 Order created: ${order.createdAt?.toDate().toISOString()}`);
        console.log(`   📋 Processing steps count: ${order.processingSteps?.length || 0}`);

        // Initialize processing steps if they don't exist
        let processingSteps = order.processingSteps;
        let needsUpdate = false;

        if (!processingSteps || !Array.isArray(processingSteps) || processingSteps.length === 0) {
          console.log(`   ⚠️  No processing steps found, creating new ones...`);
          processingSteps = initializeProcessingSteps(order);
          needsUpdate = true;
          console.log(`   ✅ Created ${processingSteps.length} processing steps for ${order.id}`);
        }

        if (needsUpdate) {
          ordersToUpdate.push({
            orderId: order.id || '',
            processingSteps: processingSteps
          });
        }

        if (processingSteps && Array.isArray(processingSteps)) {
          console.log(`   🔄 Processing ${processingSteps.length} steps...`);

          // Check if we need to add pickup steps for existing orders
          const hasDeliverySteps = processingSteps.some(step =>
            ['notarization', 'chamber_processing', 'apostille', 'ud_processing', 'embassy_processing'].includes(step.id)
          );
          console.log(`   📦 Has delivery steps: ${hasDeliverySteps}`);

          if (hasDeliverySteps) {
            // Add corresponding pickup steps for existing orders
            const pickupStepsToAdd: ProcessingStep[] = [];

            if (processingSteps.some(step => step.id === 'notarization' && step.status === 'completed') &&
                !processingSteps.some(step => step.id === 'notarization_pickup')) {
              console.log(`   ➕ Adding notarization pickup step...`);
              const notarizationStep = processingSteps.find(step => step.id === 'notarization');
              if (notarizationStep?.completedAt) {
                pickupStepsToAdd.push({
                  id: 'notarization_pickup',
                  name: '📦 Notarisering - hämta',
                  description: 'Hämta notarierbara dokument',
                  status: 'pending',
                  expectedCompletionDate: notarizationStep.expectedCompletionDate,
                  submittedAt: notarizationStep.expectedCompletionDate
                });
              }
            }

            if (processingSteps.some(step => step.id === 'chamber_processing' && step.status === 'completed') &&
                !processingSteps.some(step => step.id === 'chamber_pickup')) {
              console.log(`   ➕ Adding chamber pickup step...`);
              const chamberStep = processingSteps.find(step => step.id === 'chamber_processing');
              if (chamberStep?.completedAt) {
                pickupStepsToAdd.push({
                  id: 'chamber_pickup',
                  name: '📦 Handelskammaren - hämta',
                  description: 'Hämta legaliserade dokument',
                  status: 'pending',
                  expectedCompletionDate: chamberStep.expectedCompletionDate,
                  submittedAt: chamberStep.expectedCompletionDate
                });
              }
            }

            if (processingSteps.some(step => step.id === 'apostille' && step.status === 'completed') &&
                !processingSteps.some(step => step.id === 'apostille_pickup')) {
              console.log(`   ➕ Adding apostille pickup step...`);
              const apostilleStep = processingSteps.find(step => step.id === 'apostille');
              if (apostilleStep?.completedAt) {
                pickupStepsToAdd.push({
                  id: 'apostille_pickup',
                  name: '📦 Apostille - hämta',
                  description: 'Hämta dokument med apostille',
                  status: 'pending',
                  expectedCompletionDate: apostilleStep.expectedCompletionDate,
                  submittedAt: apostilleStep.expectedCompletionDate
                });
              }
            }

            if (processingSteps.some(step => step.id === 'ud_processing' && step.status === 'completed') &&
                !processingSteps.some(step => step.id === 'ud_pickup')) {
              console.log(`   ➕ Adding ud pickup step...`);
              const udStep = processingSteps.find(step => step.id === 'ud_processing');
              if (udStep?.completedAt) {
                pickupStepsToAdd.push({
                  id: 'ud_pickup',
                  name: '📦 Utrikesdepartementet - hämta',
                  description: 'Hämta legaliserade dokument',
                  status: 'pending',
                  expectedCompletionDate: udStep.expectedCompletionDate,
                  submittedAt: udStep.expectedCompletionDate
                });
              }
            }

            if (processingSteps.some(step => step.id === 'embassy_processing' && step.status === 'completed') &&
                !processingSteps.some(step => step.id === 'embassy_pickup')) {
              console.log(`   ➕ Adding embassy pickup step...`);
              const embassyStep = processingSteps.find(step => step.id === 'embassy_processing');
              if (embassyStep?.completedAt) {
                pickupStepsToAdd.push({
                  id: 'embassy_pickup',
                  name: '📦 Ambassad - hämta',
                  description: `Hämta konsulärt legaliserade dokument`,
                  status: 'pending',
                  expectedCompletionDate: embassyStep.expectedCompletionDate,
                  submittedAt: embassyStep.expectedCompletionDate
                });
              }
            }

            if (pickupStepsToAdd.length > 0) {
              processingSteps.push(...pickupStepsToAdd);
              needsUpdate = true;
              console.log(`   ✅ Added ${pickupStepsToAdd.length} pickup steps for ${order.id}`);
            }
          }

          processingSteps.forEach((step: ProcessingStep) => {
            console.log(`   📋 Step: ${step.id} (${step.status}) - ${step.name}`);
            console.log(`      📅 Expected: ${step.expectedCompletionDate ? new Date(step.expectedCompletionDate.toDate ? step.expectedCompletionDate.toDate() : step.expectedCompletionDate).toISOString().split('T')[0] : 'N/A'}`);
            console.log(`      📅 Submitted: ${step.submittedAt ? new Date(step.submittedAt.toDate ? step.submittedAt.toDate() : step.submittedAt).toISOString().split('T')[0] : 'N/A'}`);

            let taskType: 'pickup' | 'delivery' | null = null;
            let authority = '';
            let address = '';

            // Determine task type and authority based on step
            if (step.id === 'pickup_booking' && order.pickupService) {
              taskType = 'pickup';
              authority = 'Kundadress';
              address = `${order.pickupAddress?.street || ''}, ${order.pickupAddress?.postalCode || ''} ${order.pickupAddress?.city || ''}`;
            } else if (step.id === 'document_receipt') {
              taskType = 'pickup';
              authority = 'Kontoret';
              address = 'Huvudkontoret';
            } else if (step.id === 'notarization_delivery' || step.id === 'notarization') {
              taskType = 'delivery';
              authority = 'Notarius Publicus';
              address = 'Notarius Publicus kontor';
            } else if (step.id === 'notarization_pickup') {
              taskType = 'pickup';
              authority = 'Notarius Publicus';
              address = 'Notarius Publicus kontor';
            } else if (step.id === 'translation_delivery' || step.id === 'translation') {
              taskType = 'delivery';
              authority = 'Översättningsbyrå';
              address = 'Auktoriserad översättningsbyrå';
            } else if (step.id === 'translation_pickup') {
              taskType = 'pickup';
              authority = 'Översättningsbyrå';
              address = 'Auktoriserad översättningsbyrå';
            } else if (step.id === 'chamber_delivery' || step.id === 'chamber_processing') {
              taskType = 'delivery';
              authority = 'Handelskammaren';
              address = 'Handelskammarens kontor';
            } else if (step.id === 'chamber_pickup') {
              taskType = 'pickup';
              authority = 'Handelskammaren';
              address = 'Handelskammarens kontor';
            } else if (step.id === 'ud_delivery' || step.id === 'ud_processing') {
              taskType = 'delivery';
              authority = 'Utrikesdepartementet';
              address = 'Utrikesdepartementets kontor';
            } else if (step.id === 'ud_pickup') {
              taskType = 'pickup';
              authority = 'Utrikesdepartementet';
              address = 'Utrikesdepartementets kontor';
            } else if (step.id === 'apostille_delivery' || step.id === 'apostille') {
              taskType = 'delivery';
              authority = 'Utrikesdepartementet';
              address = 'Utrikesdepartementets kontor';
            } else if (step.id === 'apostille_pickup') {
              taskType = 'pickup';
              authority = 'Utrikesdepartementet';
              address = 'Utrikesdepartementets kontor';
            } else if (step.id === 'embassy_delivery' || step.id === 'embassy_processing') {
              taskType = 'delivery';
              const c = getCountryInfo(order.country);
              const embassyName = c.name || c.code || order.country || 'Okänt';
              authority = `${embassyName} ambassad`;
              address = `${embassyName} ambassad`;
            } else if (step.id === 'embassy_pickup') {
              taskType = 'pickup';
              const c = getCountryInfo(order.country);
              const embassyName = c.name || c.code || order.country || 'Okänt';
              authority = `${embassyName} ambassad`;
              address = `${embassyName} ambassad`;
            } else if (step.id === 'return_shipping') {
              taskType = 'pickup';
              authority = 'Fraktleverantör';
              address = 'Fraktleverantörens terminal';
            }

            console.log(`      -> Task type: ${taskType}, Authority: ${authority}`);

            // Only show tasks that have dates (submitted or expected) AND are relevant for today
            // Skip internal locations that driver doesn't deliver to
            if (taskType && (step.submittedAt || step.expectedCompletionDate) &&
                authority !== 'Kontoret' && authority !== 'Fraktleverantör') {
              try {
                const taskDate = step.submittedAt ?
                  new Date(step.submittedAt.toDate ? step.submittedAt.toDate() : step.submittedAt).toISOString().split('T')[0] :
                  new Date(step.expectedCompletionDate.toDate ? step.expectedCompletionDate.toDate() : step.expectedCompletionDate).toISOString().split('T')[0];

                console.log(`      📅 Task date calculated: ${taskDate}`);

                // Only show tasks for the selected date
                const selectedDateObj = new Date(selectedDate + 'T00:00:00');
                const taskDateObj = new Date(taskDate);
                const daysDiff = Math.floor((taskDateObj.getTime() - selectedDateObj.getTime()) / (1000 * 60 * 60 * 24));

                console.log(`      📊 Date comparison: selected=${selectedDate}, task=${taskDate}, diff=${daysDiff} days`);

                if (daysDiff === 0) { // Only show tasks for the exact selected date
                  console.log(`      ✅ Adding task to driverTasks: ${step.name} (${authority})`);
                  driverTasks.push({
                    orderId: order.id || '',
                    orderNumber: order.orderNumber || order.id || '',
                    customerName: `${order.customerInfo?.firstName || ''} ${order.customerInfo?.lastName || ''}`.trim() || 'Okänd kund',
                    stepName: step.name || 'Okänt steg',
                    stepDescription: step.description || 'Ingen beskrivning',
                    authority,
                    date: taskDate,
                    type: taskType,
                    status: step.status === 'completed' ? 'completed' : step.status === 'in_progress' ? 'in_progress' : 'pending',
                    address,
                    notes: step.notes,
                    stepId: step.id // Include the actual step ID from processingSteps
                  });
                } else {
                  console.log(`      ❌ Date out of range: ${daysDiff} days (${taskDate})`);
                }
              } catch (dateError) {
                console.error('Error processing date for step:', step.id, dateError);
              }
            } else {
              console.log(`      ❌ Filtered out: ${!taskType ? 'no taskType' : 'no dates or excluded authority'} (${authority})`);
            }
          });
        }
      });

      console.log('📊 Total driver tasks created:', driverTasks.length);

      // Group tasks by type for debugging
      const pickupTasks = driverTasks.filter(t => t.type === 'pickup');
      const deliveryTasks = driverTasks.filter(t => t.type === 'delivery');
      console.log(`📦 Pickups: ${pickupTasks.length}, 📤 Deliveries: ${deliveryTasks.length}`);

      // Log sample of tasks being created
      if (pickupTasks.length > 0) {
        console.log('🔍 Sample pickup tasks:', pickupTasks.slice(0, 2).map(t => ({
          orderId: t.orderId,
          stepId: t.stepId,
          stepName: t.stepName,
          status: t.status,
          date: t.date
        })));
      }
      if (deliveryTasks.length > 0) {
        console.log('🔍 Sample delivery tasks:', deliveryTasks.slice(0, 2).map(t => ({
          orderId: t.orderId,
          stepId: t.stepId,
          stepName: t.stepName,
          status: t.status,
          date: t.date
        })));
      }

      // Save newly created processingSteps back to Firebase
      if (ordersToUpdate.length > 0) {
        console.log(`💾 Saving processingSteps for ${ordersToUpdate.length} orders...`);
        for (const update of ordersToUpdate) {
          try {
            await updateOrder(update.orderId, { processingSteps: update.processingSteps });
            console.log(`   ✅ Saved processingSteps for order ${update.orderId}`);
          } catch (error) {
            console.error(`   ❌ Failed to save processingSteps for order ${update.orderId}:`, error);
          }
        }
      }

      setTasks(driverTasks);
    } catch (error) {
      console.error('❌ Error fetching driver tasks:', error);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredTasks = tasks.filter(task => {
    const dateMatch = task.date === selectedDate;
    const typeMatch = filterType === 'all' || task.type === filterType;
    const statusMatch = task.status === 'pending' || task.status === 'in_progress';
    return dateMatch && typeMatch && statusMatch;
  });

  const groupedTasks = filteredTasks.reduce((acc, task) => {
    if (!acc[task.authority]) {
      acc[task.authority] = [];
    }
    acc[task.authority].push(task);
    return acc;
  }, {} as Record<string, DriverTask[]>);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('sv-SE', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  useEffect(() => {
    console.log('🔄 useEffect triggered, calling fetchDriverTasks');
    fetchDriverTasks();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Klar';
      case 'in_progress':
        return 'Pågår';
      case 'pending':
        return 'Väntar';
      default:
        return status;
    }
  };

  return (
    <ProtectedRoute>
      <Head>
        <title>Chaufför Dashboard - Legaliseringstjänst</title>
        <style jsx global>{`
          @media print {
            /* Hide everything by default */
            * {
              display: none !important;
              visibility: hidden !important;
            }

            /* Only show the print-friendly driver content */
            .print\\:block,
            .print\\:block *,
            .print\\:block *::before,
            .print\\:block *::after {
              display: block !important;
              visibility: visible !important;
            }

            /* Reset specific elements for print */
            body {
              display: block !important;
              visibility: visible !important;
              font-size: 14pt !important;
              line-height: 1.6 !important;
              font-family: Arial, sans-serif !important;
              margin: 0 !important;
              padding: 20px !important;
              background: white !important;
            }

            .print\\:block {
              position: static !important;
              margin: 0 !important;
              padding: 0 !important;
              width: 100% !important;
              max-width: none !important;
            }

            /* Page settings */
            @page {
              margin: 1cm;
              size: A4;
            }

            /* Prevent page breaks inside authority sections */
            .page-break-inside-avoid {
              page-break-inside: avoid !important;
            }

            /* Ensure text is readable */
            h1, h2, h3, p, span, div {
              color: black !important;
              background: transparent !important;
              box-shadow: none !important;
              border: none !important;
            }

            /* Make sure emojis and icons display */
            .print\\:block span:before,
            .print\\:block span:after {
              display: inline !important;
            }
          }
        `}</style>
      </Head>

      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">🚗 Chaufför Dashboard</h1>
                <p className="text-gray-600 mt-2">Översikt över hämtningar och inlämningar - {formatDate(selectedDate)}</p>
              </div>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => {
                    const printWindow = window.open('', '_blank', 'width=800,height=600');
                    if (printWindow) {
                      const selectedDate = new Date().toISOString().split('T')[0];
                      const formatDate = (dateString: string) => {
                        return new Date(dateString).toLocaleDateString('sv-SE', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        });
                      };

                      printWindow.document.write(`
                        <!DOCTYPE html>
                        <html>
                        <head>
                          <title>Chaufförs Uppgifter</title>
                          <style>
                            body {
                              font-family: 'Inter', system-ui, -apple-system, sans-serif;
                              line-height: 1.5;
                              color: #1f2937;
                              margin: 0;
                              padding: 20px;
                              background-color: #f9fafb;
                            }
                            .driver-box {
                              max-width: 800px;
                              margin: auto;
                              padding: 30px;
                              background: white;
                              border: 1px solid #e5e7eb;
                              box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                              border-radius: 8px;
                            }
                            .driver-header {
                              background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
                              color: white;
                              padding: 30px;
                              margin: -30px -30px 30px -30px;
                              border-radius: 8px 8px 0 0;
                              display: flex;
                              justify-content: space-between;
                              align-items: center;
                            }
                            .driver-header h1 {
                              color: white;
                              margin: 0;
                              font-size: 28px;
                              font-weight: 700;
                            }
                            .company-info, .driver-info {
                              flex: 1;
                            }
                            .company-info {
                              padding-right: 20px;
                            }
                            .driver-info {
                              text-align: right;
                            }
                            .driver-info h2 {
                              color: #ffffff;
                              margin: 0 0 10px 0;
                            }
                            table {
                              width: 100%;
                              border-collapse: collapse;
                              margin: 25px 0;
                              border-radius: 8px;
                              overflow: hidden;
                              box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
                            }
                            th {
                              padding: 14px 12px;
                              text-align: left;
                              background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
                              color: white;
                              font-weight: 600;
                              font-size: 11px;
                              text-transform: uppercase;
                              letter-spacing: 0.5px;
                            }
                            td {
                              padding: 12px;
                              border-bottom: 1px solid #e5e7eb;
                              background-color: white;
                            }
                            tr:nth-child(even) td {
                              background-color: #f9fafb;
                            }
                            .text-right {
                              text-align: right;
                            }
                            .authority {
                              margin-bottom: 25px;
                              page-break-inside: avoid;
                            }
                            .authority-title {
                              font-size: 16pt;
                              font-weight: bold;
                              margin-bottom: 15px;
                              color: #0ea5e9;
                              border-bottom: 2px solid #0ea5e9;
                              padding-bottom: 5px;
                            }
                            .summary {
                              background: #f8f9fa;
                              padding: 15px;
                              margin-bottom: 20px;
                              border-radius: 6px;
                              border-left: 4px solid #0ea5e9;
                            }
                            .footer {
                              margin-top: 40px;
                              background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
                              color: white;
                              padding: 25px;
                              text-align: center;
                              border-radius: 0 0 8px 8px;
                            }
                            @media print {
                              body { margin: 0; padding: 10px; }
                              .authority { break-inside: avoid; }
                            }
                          </style>
                        </head>
                        <body>
                          <div class="driver-box">
                            <div class="driver-header">
                              <div class="company-info">
                                <h1>DOX Visumpartner AB</h1>
                                <p>
                                  Box 38<br>
                                  121 25 Stockholm-Globen<br>
                                  info@doxvisum.se<br>
                                  08-123 45 67<br>
                                  Org.nr: 559015-4521
                                </p>
                              </div>
                              <div class="driver-info">
                                <h2>CHAUFFÖR UPPGIFTER</h2>
                                <p>
                                  Datum: ${formatDate(selectedDate)}<br>
                                  Totalt: ${tasks.length} uppgifter
                                </p>
                              </div>
                            </div>

                            <div class="summary">
                              <strong>Dagens uppgifter</strong>
                            </div>

                          ${Object.entries(groupedTasks).map(([authority, authorityTasks]) => `
                            <div class="authority">
                              <div class="authority-title">📍 ${authority}</div>
                              <table>
                                <thead>
                                  <tr>
                                    <th>Order</th>
                                    <th>Kund</th>
                                    <th>Typ</th>
                                    <th>Adress/Uppgift</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  ${authorityTasks.map(task => `
                                    <tr>
                                      <td>${task.orderNumber}</td>
                                      <td>${task.customerName}</td>
                                      <td>${task.type === 'pickup' ? '📦 Hämta' : '📤 Lämna'}</td>
                                      <td>
                                        ${task.address || 'Ej specificerad'}<br>
                                        <small style="color: #6c757d;">${task.stepName}</small>
                                      </td>
                                    </tr>
                                  `).join('')}
                                </tbody>
                              </table>
                            </div>
                          `).join('')}

                          <div class="footer">
                            <p>DOX Visumpartner AB | Org.nr: 559015-4521</p>
                            <p>Chaufförs lista - ${new Date().toLocaleString('sv-SE')}</p>
                          </div>
                        </body>
                        </html>
                      `);
                      printWindow.document.close();
                      printWindow.focus();
                      setTimeout(() => {
                        printWindow.print();
                      }, 100);
                    }
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex items-center"
                  title="Skriv ut dagens lista"
                >
                  <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  Skriv ut lista
                </button>
                <Link
                  href="/admin"
                  className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                >
                  Tillbaka till Admin
                </Link>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Datum
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Typ av uppgift
                </label>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="all">Alla uppgifter</option>
                  <option value="pickup">Hämtningar</option>
                  <option value="delivery">Inlämningar</option>
                </select>
              </div>
              <div className="flex items-end">
                <button
                  onClick={fetchDriverTasks}
                  className="w-full px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 transition-colors"
                >
                  Uppdatera lista
                </button>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mb-4"></div>
              <p className="text-gray-600">Laddar uppgifter...</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Uppgifter för {formatDate(selectedDate)}
                </h2>

                {Object.keys(groupedTasks).length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <svg className="h-12 w-12 mx-auto mb-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2m9 5v-2a2 2 0 00-2-2H9a2 2 0 00-2 2v4m0-4h2m-2 4h2m-4-4h2m-2 4h-2m2-4H9a2 2 0 00-2 2m2-4h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m2-4h2m-4 4h2m-2 4h-2m2-4H5a2 2 0 00-2 2m2-4h6a2 2 0 012 2" />
                    </svg>
                    <p>Inga uppgifter planerade för detta datum</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Print-friendly layout - hidden on screen, shown on print */}
                    <div className="hidden print:block">
                      <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold mb-2">🚗 Chaufförs Uppgifter</h1>
                        <p className="text-xl">{formatDate(selectedDate)}</p>
                        <p className="text-sm text-gray-600 mt-2">Totalt: {tasks.length} uppgifter</p>
                      </div>

                      <div className="space-y-8">
                        {Object.entries(groupedTasks).map(([authority, authorityTasks]) => {
                          const deliveryTasks = authorityTasks.filter(task => task.type === 'delivery');
                          const pickupTasks = authorityTasks.filter(task => task.type === 'pickup');

                          return (
                            <div key={`print-${authority}`} className="page-break-inside-avoid">
                              <h2 className="text-2xl font-bold border-b-2 border-gray-800 pb-2 mb-4 text-center">
                                📍 {authority}
                              </h2>

                              {/* Delivery tasks */}
                              {deliveryTasks.length > 0 && (
                                <div className="mb-6">
                                  <h3 className="text-xl font-bold text-orange-700 mb-4 border-b border-orange-300 pb-1">
                                    📤 LÄMNAS IN ({deliveryTasks.length} uppgifter)
                                  </h3>
                                  <div className="space-y-4">
                                    {deliveryTasks.map((task, index) => (
                                      <div key={`print-delivery-${index}`} className="bg-gray-50 p-4 rounded border-l-4 border-orange-500">
                                        <div className="flex justify-between items-start mb-2">
                                          <span className="text-lg font-bold text-orange-700">
                                            📤 INLÄMNING
                                          </span>
                                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                            task.status === 'completed' ? 'bg-green-100 text-green-800' :
                                            task.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                                            'bg-yellow-100 text-yellow-800'
                                          }`}>
                                            {task.status === 'completed' ? 'KLAR' :
                                             task.status === 'in_progress' ? 'PÅGÅR' : 'VÄNTAR'}
                                          </span>
                                        </div>

                                        <div className="text-xl font-semibold text-gray-900 mb-2">
                                          {task.customerName}
                                        </div>

                                        <div className="text-base text-gray-700 mb-2">
                                          {task.stepName}
                                        </div>

                                        {task.address && (
                                          <div className="text-base font-medium text-gray-800 flex items-center">
                                            <span className="mr-2">📍</span>
                                            {task.address}
                                          </div>
                                        )}

                                        {task.notes && (
                                          <div className="mt-3 pt-2 border-t border-gray-300">
                                            <span className="text-sm font-medium">Notering: </span>
                                            <span className="text-sm italic">{task.notes}</span>
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Pickup tasks */}
                              {pickupTasks.length > 0 && (
                                <div>
                                  <h3 className="text-xl font-bold text-green-700 mb-4 border-b border-green-300 pb-1">
                                    📦 HÄMTAS ({pickupTasks.length} uppgifter)
                                  </h3>
                                  <div className="space-y-4">
                                    {pickupTasks.map((task, index) => (
                                      <div key={`print-pickup-${index}`} className="bg-gray-50 p-4 rounded border-l-4 border-green-500">
                                        <div className="flex justify-between items-start mb-2">
                                          <span className="text-lg font-bold text-green-700">
                                            📦 HÄMTNING
                                          </span>
                                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                            task.status === 'completed' ? 'bg-green-100 text-green-800' :
                                            task.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                                            'bg-yellow-100 text-yellow-800'
                                          }`}>
                                            {task.status === 'completed' ? 'KLAR' :
                                             task.status === 'in_progress' ? 'PÅGÅR' : 'VÄNTAR'}
                                          </span>
                                        </div>

                                        <div className="text-xl font-semibold text-gray-900 mb-2">
                                          {task.customerName}
                                        </div>

                                        <div className="text-base text-gray-700 mb-2">
                                          {task.stepName}
                                        </div>

                                        {task.address && (
                                          <div className="text-base font-medium text-gray-800 flex items-center">
                                            <span className="mr-2">📍</span>
                                            {task.address}
                                          </div>
                                        )}

                                        {task.notes && (
                                          <div className="mt-3 pt-2 border-t border-gray-300">
                                            <span className="text-sm font-medium">Notering: </span>
                                            <span className="text-sm italic">{task.notes}</span>
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      <div className="text-center mt-12 pt-8 border-t border-gray-300">
                        <p className="text-sm text-gray-500">Skrivet ut: {new Date().toLocaleString('sv-SE')}</p>
                      </div>
                    </div>

                    {/* Screen layout - hidden on print */}
                    <div className="print:hidden">
                    {Object.entries(groupedTasks).map(([authority, authorityTasks]) => {
                      const deliveryTasks = authorityTasks.filter(task => task.type === 'delivery');
                      const pickupTasks = authorityTasks.filter(task => task.type === 'pickup');

                      return (
                        <div key={authority} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                          <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                              <svg className="h-5 w-5 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                              </svg>
                              {authority}
                              <span className="ml-2 text-sm font-normal text-gray-600">({authorityTasks.length} uppgifter)</span>
                            </h3>
                          </div>

                          <div className="p-4">
                            {/* Delivery tasks */}
                            {deliveryTasks.length > 0 && (
                              <div className="mb-6">
                                <h4 className="text-md font-semibold text-orange-700 mb-3 flex items-center">
                                  Lämnas in ({deliveryTasks.length} uppgifter)
                                </h4>
                                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                                  {/* Header row */}
                                  <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 flex items-center font-medium text-sm text-gray-700">
                                    <div className="w-28">Order</div>
                                    <div className="flex-1 ml-4">Kund</div>
                                    <div className="w-40 hidden sm:block">Uppgift</div>
                                    <div className="w-20">Typ</div>
                                    <div className="w-24">Status</div>
                                    <div className="w-32 text-right">Åtgärder</div>
                                  </div>

                                  {/* Task rows */}
                                  <div className="divide-y divide-gray-100">
                                    {deliveryTasks.map((task, index) => (
                                      <div key={`delivery-${index}`} className={`px-4 py-2 flex items-center hover:bg-gray-50 transition-colors ${
                                        task.status === 'completed'
                                          ? 'bg-green-50 border-l-4 border-green-500'
                                          : ''
                                      }`}>
                                        {/* Order */}
                                        <div className="w-28">
                                          <span className={`text-sm font-medium text-gray-900 ${
                                            task.status === 'completed' ? 'text-green-800' : 'text-gray-900'
                                          }`}>
                                            #{task.orderNumber}
                                          </span>
                                        </div>

                                        {/* Customer */}
                                        <div className="flex-1 ml-4">
                                          <span className={`text-sm text-gray-700 ${
                                            task.status === 'completed' ? 'text-green-700' : 'text-gray-700'
                                          }`}>
                                            {task.customerName}
                                          </span>
                                        </div>

                                        {/* Task */}
                                        <div className="w-40 hidden sm:block">
                                          <div className="flex flex-wrap gap-1">
                                            <span className={`inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-medium ${
                                              task.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-indigo-100 text-indigo-800'
                                            }`}>
                                              {task.stepName.replace(/^[📦📤✍️🏛️🌐🇸🇪🏢🔍✅🚚🧾]+/, '').trim()}
                                            </span>
                                          </div>
                                        </div>

                                        {/* Type */}
                                        <div className="w-20">
                                          <span className={`text-xs font-medium ${
                                            task.status === 'completed'
                                              ? 'text-green-700'
                                              : task.type === 'pickup' ? 'text-green-700' : 'text-orange-700'
                                          }`}>
                                            {task.type === 'pickup' ? 'Hämtning' : 'Inlämning'}
                                          </span>
                                        </div>

                                        {/* Status */}
                                        <div className="w-24">
                                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${
                                            task.status === 'completed' ? 'bg-green-100 text-green-800' :
                                            task.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                                            'bg-gray-100 text-gray-800'
                                          }`}>
                                            {task.status === 'completed' ? 'Klar' :
                                             task.status === 'in_progress' ? 'Pågår' : 'Väntar'}
                                          </span>
                                        </div>

                                        {/* Actions */}
                                        <div className="w-32 text-right">
                                          <a
                                            href={`/admin/orders/${task.orderId}`}
                                            className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md text-xs font-medium text-blue-600 bg-white hover:bg-gray-50 hover:text-blue-800"
                                          >
                                            Visa
                                          </a>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Pickup tasks */}
                            {pickupTasks.length > 0 && (
                              <div>
                                <h4 className="text-md font-semibold text-green-700 mb-3 flex items-center">
                                  Hämtas ({pickupTasks.length} uppgifter)
                                </h4>
                                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                                  {/* Header row */}
                                  <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 flex items-center font-medium text-sm text-gray-700">
                                    <div className="w-28">Order</div>
                                    <div className="flex-1 ml-4">Kund</div>
                                    <div className="w-40 hidden sm:block">Uppgift</div>
                                    <div className="w-20">Typ</div>
                                    <div className="w-24">Status</div>
                                    <div className="w-32 text-right">Åtgärder</div>
                                  </div>

                                  {/* Task rows */}
                                  <div className="divide-y divide-gray-100">
                                    {pickupTasks.map((task, index) => (
                                      <div key={`pickup-${index}`} className={`px-4 py-2 flex items-center hover:bg-gray-50 transition-colors ${
                                        task.status === 'completed'
                                          ? 'bg-green-50 border-l-4 border-green-500'
                                          : ''
                                      }`}>
                                        {/* Order */}
                                        <div className="w-28">
                                          <span className={`text-sm font-medium text-gray-900 ${
                                            task.status === 'completed' ? 'text-green-800' : 'text-gray-900'
                                          }`}>
                                            #{task.orderNumber}
                                          </span>
                                        </div>

                                        {/* Customer */}
                                        <div className="flex-1 ml-4">
                                          <span className={`text-sm text-gray-700 ${
                                            task.status === 'completed' ? 'text-green-700' : 'text-gray-700'
                                          }`}>
                                            {task.customerName}
                                          </span>
                                        </div>

                                        {/* Task */}
                                        <div className="w-40 hidden sm:block">
                                          <div className="flex flex-wrap gap-1">
                                            <span className={`inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-medium ${
                                              task.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-indigo-100 text-indigo-800'
                                            }`}>
                                              {task.stepName.replace(/^[📦📤✍️🏛️🌐🇸🇪🏢🔍✅🚚🧾]+/, '').trim()}
                                            </span>
                                          </div>
                                        </div>

                                        {/* Type */}
                                        <div className="w-20">
                                          <span className={`text-xs font-medium ${
                                            task.status === 'completed'
                                              ? 'text-green-700'
                                              : task.type === 'pickup' ? 'text-green-700' : 'text-orange-700'
                                          }`}>
                                            {task.type === 'pickup' ? 'Hämtning' : 'Inlämning'}
                                          </span>
                                        </div>

                                        {/* Status */}
                                        <div className="w-24">
                                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${
                                            task.status === 'completed' ? 'bg-green-100 text-green-800' :
                                            task.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                                            'bg-gray-100 text-gray-800'
                                          }`}>
                                            {task.status === 'completed' ? 'Klar' :
                                             task.status === 'in_progress' ? 'Pågår' : 'Väntar'}
                                          </span>
                                        </div>

                                        {/* Actions */}
                                        <div className="w-32 text-right">
                                          <a
                                            href={`/admin/orders/${task.orderId}`}
                                            className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md text-xs font-medium text-blue-600 bg-white hover:bg-gray-50 hover:text-blue-800"
                                          >
                                            Visa
                                          </a>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Footer sections like order management */}
          <div className="mt-8 space-y-6">
            {/* Summary section */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium mb-4">Dagens sammanfattning</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <svg className="h-8 w-8 text-blue-600 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <div>
                      <p className="text-sm font-medium text-blue-800">Totalt uppgifter</p>
                      <p className="text-2xl font-bold text-blue-900">{tasks.length}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <svg className="h-8 w-8 text-green-600 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <div>
                      <p className="text-sm font-medium text-green-800">Klara</p>
                      <p className="text-2xl font-bold text-green-900">{tasks.filter(t => t.status === 'completed').length}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <svg className="h-8 w-8 text-orange-600 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <p className="text-sm font-medium text-orange-800">Pågår</p>
                      <p className="text-2xl font-bold text-orange-900">{tasks.filter(t => t.status === 'in_progress').length}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <svg className="h-8 w-8 text-gray-600 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <p className="text-sm font-medium text-gray-800">Väntar</p>
                      <p className="text-2xl font-bold text-gray-900">{tasks.filter(t => t.status === 'pending').length}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Driver notes section */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium mb-4">Chaufförens anteckningar</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Lägg till anteckning för dagen
                  </label>
                  <textarea
                    placeholder="Skriv dina anteckningar för dagen här..."
                    className="w-full border border-gray-300 rounded-lg p-3"
                    rows={3}
                  />
                </div>
                <div className="flex items-center space-x-3">
                  <button className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700">
                    Spara anteckning
                  </button>
                  <button className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
                    Rapportera klar dag
                  </button>
                </div>
              </div>
            </div>

            {/* Company info footer */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
              <div className="text-center">
                <h4 className="font-semibold text-gray-900 mb-2">DOX Visumpartner AB</h4>
                <p className="text-sm text-gray-600">
                  Box 38, 121 25 Stockholm-Globen<br />
                  info@doxvisum.se | 08-123 45 67 | Org.nr: 559015-4521
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  Chaufförs rapport genererad {new Date().toLocaleString('sv-SE')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}export const getStaticProps: GetStaticProps = async ({ locale }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale || 'sv', ['common'])),
    },
  };
};

export default DriverDashboardPage;
