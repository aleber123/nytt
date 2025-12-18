import React, { useState, useEffect } from 'react';
import { GetStaticProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import Head from 'next/head';
import Link from 'next/link';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { getAllOrders, updateOrder } from '@/firebase/orderService';
import type { Order } from '@/firebase/orderService';
import { ALL_COUNTRIES } from '@/components/order/data/countries';
import { saveDriverDailyReport, getDriverMonthlySummary, type DriverMonthlySummary } from '@/firebase/driverReportService';
import { jsPDF } from 'jspdf';

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

  // Simple daily report state for hours & expenses
  const [hoursWorked, setHoursWorked] = useState('');
  const [parkingCost, setParkingCost] = useState('');
  const [embassyCost, setEmbassyCost] = useState('');
  const [otherCost, setOtherCost] = useState('');
  const [driverNotes, setDriverNotes] = useState('');
  const [isSavingDailyReport, setIsSavingDailyReport] = useState(false);
  const [saveDailyMessage, setSaveDailyMessage] = useState<string | null>(null);
  const [isOpeningMonthlyEmail, setIsOpeningMonthlyEmail] = useState(false);
  const [monthlyMessage, setMonthlyMessage] = useState<string | null>(null);
  const [monthlySummary, setMonthlySummary] = useState<DriverMonthlySummary | null>(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);

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

  const handleSaveDailyReport = async () => {
    try {
      setIsSavingDailyReport(true);
      setSaveDailyMessage(null);

      await saveDriverDailyReport({
        driverId: 'default-driver',
        date: selectedDate,
        hoursWorked,
        parkingCost,
        embassyCost,
        otherCost,
        notes: driverNotes,
      });

      setSaveDailyMessage('Daily report saved.');
      await loadMonthlySummaryForSelectedDate();
    } catch (error) {
      setSaveDailyMessage('Could not save daily report. Try again or contact the office.');
    } finally {
      setIsSavingDailyReport(false);
    }
  };

  const loadMonthlySummaryForSelectedDate = async () => {
    try {
      setIsLoadingSummary(true);

      const dateObj = new Date(selectedDate + 'T00:00:00');
      if (Number.isNaN(dateObj.getTime())) {
        console.error('❌ Invalid date for monthly summary', { selectedDate });
        setMonthlySummary(null);
        return;
      }

      const year = dateObj.getFullYear();
      const month = dateObj.getMonth() + 1;

      const summary = await getDriverMonthlySummary('default-driver', year, month);
      setMonthlySummary(summary);
    } catch (error) {
      console.error('❌ Failed to load monthly driver summary', error);
      setMonthlySummary(null);
    } finally {
      setIsLoadingSummary(false);
    }
  };

  const handleOpenReportEmail = () => {
    const to = 'info@doxvl.se,info@visumpartner.se';
    const subject = `Driver Report ${selectedDate}`;

    const bodyLines = [
      `Date: ${formatDate(selectedDate)} (${selectedDate})`,
      `Hours worked: ${hoursWorked || '-'}`,
      `Parking: ${parkingCost || '0'} kr`,
      `Embassy expenses: ${embassyCost || '0'} kr`,
      `Other expenses: ${otherCost || '0'} kr`,
      '',
      'Comment:',
      driverNotes || '-',
      '',
      '---',
      'Sent from DOX driver page'
    ];

    const mailto = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyLines.join('\n'))}`;

    if (typeof window !== 'undefined') {
      window.location.href = mailto;
    }
  };

  const handleOpenMonthlyReportEmail = async () => {
    try {
      console.log('📅 handleOpenMonthlyReportEmail called', { selectedDate });
      setIsOpeningMonthlyEmail(true);
      setMonthlyMessage(null);

      const dateObj = new Date(selectedDate + 'T00:00:00');
      if (Number.isNaN(dateObj.getTime())) {
        setMonthlyMessage('The date is invalid.');
        return;
      }

      const year = dateObj.getFullYear();
      const month = dateObj.getMonth() + 1;

      console.log('📆 Monthly report parameters', { year, month });

      const summary = await getDriverMonthlySummary('default-driver', year, month);

      console.log('📊 Monthly driver summary loaded', summary);

      const monthFormatter = new Intl.DateTimeFormat('sv-SE', {
        year: 'numeric',
        month: 'long',
      });
      const someDateInMonth = new Date(year, month - 1, 1);
      const monthLabel = monthFormatter.format(someDateInMonth);

      const to = 'info@doxvl.se,info@visumpartner.se';
      const subject = `Monthly Driver Report – ${monthLabel}`;

      const headerLines = [
        `Month: ${monthLabel} (${year}-${String(month).padStart(2, '0')})`,
        '',
        `Total hours: ${summary.totalHours.toLocaleString('en-GB')}`,
        `Parking: ${summary.totalParking} kr`,
        `Embassy expenses: ${summary.totalEmbassy} kr`,
        `Other expenses: ${summary.totalOther} kr`,
        '',
        'Details per day:',
      ];

      const detailLines = summary.reports.length
        ? summary.reports.map((report) => {
            const notePart = report.notes ? ` – ${report.notes}` : '';
            return `- ${report.date}: ${report.hoursWorked} h, parking ${report.parkingCost} kr, embassy ${report.embassyCost} kr, other ${report.otherCost} kr${notePart}`;
          })
        : ['(No saved daily reports for this month.)'];

      const bodyLines = [
        ...headerLines,
        ...detailLines,
        '',
        '---',
        'Sent from DOX driver page',
      ];

      if (typeof window !== 'undefined') {
        const mailto = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyLines.join('\n'))}`;
        window.location.href = mailto;
      }
    } catch (error) {
      setMonthlyMessage('Could not fetch monthly report. Try again or contact the office.');
    } finally {
      setIsOpeningMonthlyEmail(false);
    }
  };

  // Simplified version of initializeProcessingSteps for driver dashboard
  const initializeProcessingSteps = (orderData: Order): ProcessingStep[] => {
    const steps: ProcessingStep[] = [];

    const toDateOrUndefined = (ymd?: string) => {
      if (!ymd) return undefined;
      const d = new Date(ymd + 'T00:00:00');
      return Number.isNaN(d.getTime()) ? undefined : d;
    };

    // Document receipt - always needed for processing
    if (orderData.documentSource !== 'upload') {
      steps.push({
        id: 'document_receipt',
        name: '📄 Documents received',
        description: orderData.pickupService
          ? 'Original documents have been picked up and registered'
          : 'Original documents have been received and registered',
        status: 'completed', // Assume documents are received
        expectedCompletionDate: new Date() // Today
      });
    }

    // Pickup booking if customer requested pickup
    if (orderData.pickupService) {
      steps.push({
        id: 'pickup_booking',
        name: '📦 Pickup booked',
        description: `Pickup booked from ${orderData.pickupAddress?.street || 'customer address'}`,
        status: 'pending',
        expectedCompletionDate: new Date() // Today - ready for pickup
      });
    }

    // Stockholm City Courier pickup (special task for own driver)
    if (orderData.pickupService && orderData.pickupMethod === 'stockholm-city') {
      const premium = orderData.premiumPickup || '';
      const level = premium === 'stockholm-sameday' ? 'Urgent (2h)' : premium === 'stockholm-express' ? 'Express (4h)' : 'End of day';
      steps.push({
        id: 'stockholm_courier_pickup',
        name: '🚚 Stockholm Courier - pickup',
        description: `Pick up from customer (${level})`,
        status: 'pending',
        expectedCompletionDate: toDateOrUndefined(orderData.pickupDate) || new Date(),
        submittedAt: toDateOrUndefined(orderData.pickupDate) || new Date(),
      });
    }

    // Only create steps that involve external authorities
    if (Array.isArray(orderData.services)) {
      // Notarization - DELIVERY first, then PICKUP
      if (orderData.services.includes('notarization')) {
        steps.push({
          id: 'notarization_delivery',
          name: '📤 Notarization - drop off',
          description: 'Drop off documents for notarization',
          status: 'pending',
          expectedCompletionDate: undefined // Today - ready for delivery
        });
        steps.push({
          id: 'notarization_pickup',
          name: '📦 Notarization - pick up',
          description: 'Pick up notarized documents',
          status: 'pending',
          expectedCompletionDate: undefined // Today - ready for pickup
        });
      }

      // Translation - DELIVERY first, then PICKUP
      if (orderData.services.includes('translation')) {
        steps.push({
          id: 'translation_delivery',
          name: '📤 Translation - drop off',
          description: 'Drop off documents for translation',
          status: 'pending',
          expectedCompletionDate: undefined // Today - ready for delivery
        });
        steps.push({
          id: 'translation_pickup',
          name: '📦 Translation - pick up',
          description: 'Pick up translated documents',
          status: 'pending',
          expectedCompletionDate: undefined // Today - ready for pickup
        });
      }

      // Chamber legalization - DELIVERY first, then PICKUP
      if (orderData.services.includes('chamber')) {
        steps.push({
          id: 'chamber_delivery',
          name: '📤 Chamber of Commerce - drop off',
          description: 'Drop off documents for legalization',
          status: 'pending',
          expectedCompletionDate: undefined // Today - ready for delivery
        });
        steps.push({
          id: 'chamber_pickup',
          name: '📦 Chamber of Commerce - pick up',
          description: 'Pick up legalized documents',
          status: 'pending',
          expectedCompletionDate: undefined // Today - ready for pickup
        });
      }

      // UD processing - DELIVERY first, then PICKUP
      if (orderData.services.includes('ud')) {
        steps.push({
          id: 'ud_delivery',
          name: '📤 Ministry of Foreign Affairs - drop off',
          description: 'Drop off documents for legalization',
          status: 'pending',
          expectedCompletionDate: undefined // Today - ready for delivery
        });
        steps.push({
          id: 'ud_pickup',
          name: '📦 Ministry of Foreign Affairs - pick up',
          description: 'Pick up legalized documents',
          status: 'pending',
          expectedCompletionDate: undefined // Today - ready for pickup
        });
      }

      // Apostille - DELIVERY first, then PICKUP
      if (orderData.services.includes('apostille')) {
        steps.push({
          id: 'apostille_delivery',
          name: '📤 Apostille - drop off',
          description: 'Drop off documents for apostille',
          status: 'pending',
          expectedCompletionDate: undefined // Today - ready for delivery
        });
        steps.push({
          id: 'apostille_pickup',
          name: '📦 Apostille - pick up',
          description: 'Pick up apostilled documents',
          status: 'pending',
          expectedCompletionDate: undefined // Today - ready for pickup
        });
      }

      // Embassy legalization - DELIVERY first, then PICKUP
      if (orderData.services.includes('embassy')) {
        steps.push({
          id: 'embassy_delivery',
          name: '📤 Embassy - drop off',
          description: `Drop off documents for consular legalization`,
          status: 'pending',
          expectedCompletionDate: undefined // Today - ready for delivery
        });
        steps.push({
          id: 'embassy_pickup',
          name: '📦 Embassy - pick up',
          description: `Pick up consular legalized documents`,
          status: 'pending',
          expectedCompletionDate: undefined // Today - ready for pickup
        });
      }
    }

    // Return shipping - for completed orders
    steps.push({
      id: 'return_shipping',
      name: '🚚 Return shipped',
      description: 'Documents returned to customer',
      status: 'pending',
      expectedCompletionDate: new Date() // Today when ready
    });

    // Stockholm City Courier return delivery (special task for own driver)
    if (orderData.returnService === 'stockholm-city') {
      const premium = orderData.premiumDelivery || '';
      const level = premium === 'stockholm-sameday' ? 'Urgent (2h)' : premium === 'stockholm-express' ? 'Express (4h)' : 'End of day';
      steps.push({
        id: 'stockholm_courier_delivery',
        name: '🚚 Stockholm Courier - deliver',
        description: `Deliver to customer (${level})`,
        status: 'pending',
        expectedCompletionDate: toDateOrUndefined(orderData.returnDeliveryDate) || new Date(),
        submittedAt: toDateOrUndefined(orderData.returnDeliveryDate) || new Date(),
      });
    }

    return steps;
  };

  const fetchDriverTasks = async () => {
    try {
      setLoading(true);

      const orders = (await getAllOrders()).filter(
        (order) => order.status === 'pending' || order.status === 'processing'
      );

      const driverTasks: DriverTask[] = [];
      const ordersToUpdate: Array<{orderId: string, processingSteps: ProcessingStep[]}> = [];

      orders.forEach((order: Order) => {
        // Initialize processing steps if they don't exist
        let processingSteps = order.processingSteps;
        let needsUpdate = false;

        if (!processingSteps || !Array.isArray(processingSteps) || processingSteps.length === 0) {
          processingSteps = initializeProcessingSteps(order);
          needsUpdate = true;
        }

        if (needsUpdate) {
          ordersToUpdate.push({
            orderId: order.id || '',
            processingSteps: processingSteps
          });
        }

        if (processingSteps && Array.isArray(processingSteps)) {
          // Check if we need to add pickup steps for existing orders
          const hasDeliverySteps = processingSteps.some(step =>
            ['notarization', 'chamber_processing', 'apostille', 'ud_processing', 'embassy_processing'].includes(step.id)
          );

          if (hasDeliverySteps) {
            // Add corresponding pickup steps for existing orders
            const pickupStepsToAdd: ProcessingStep[] = [];

            if (processingSteps.some(step => step.id === 'notarization' && step.status === 'completed') &&
                !processingSteps.some(step => step.id === 'notarization_pickup')) {
              const notarizationStep = processingSteps.find(step => step.id === 'notarization');
              if (notarizationStep?.completedAt) {
                pickupStepsToAdd.push({
                  id: 'notarization_pickup',
                  name: '📦 Notarization - pick up',
                  description: 'Pick up notarized documents',
                  status: 'pending',
                  expectedCompletionDate: notarizationStep.expectedCompletionDate,
                  submittedAt: notarizationStep.expectedCompletionDate
                });
              }
            }

            if (processingSteps.some(step => step.id === 'chamber_processing' && step.status === 'completed') &&
                !processingSteps.some(step => step.id === 'chamber_pickup')) {
              const chamberStep = processingSteps.find(step => step.id === 'chamber_processing');
              if (chamberStep?.completedAt) {
                pickupStepsToAdd.push({
                  id: 'chamber_pickup',
                  name: '📦 Chamber of Commerce - pick up',
                  description: 'Pick up legalized documents',
                  status: 'pending',
                  expectedCompletionDate: chamberStep.expectedCompletionDate,
                  submittedAt: chamberStep.expectedCompletionDate
                });
              }
            }

            if (processingSteps.some(step => step.id === 'apostille' && step.status === 'completed') &&
                !processingSteps.some(step => step.id === 'apostille_pickup')) {
              const apostilleStep = processingSteps.find(step => step.id === 'apostille');
              if (apostilleStep?.completedAt) {
                pickupStepsToAdd.push({
                  id: 'apostille_pickup',
                  name: '📦 Apostille - pick up',
                  description: 'Pick up apostilled documents',
                  status: 'pending',
                  expectedCompletionDate: apostilleStep.expectedCompletionDate,
                  submittedAt: apostilleStep.expectedCompletionDate
                });
              }
            }

            if (processingSteps.some(step => step.id === 'ud_processing' && step.status === 'completed') &&
                !processingSteps.some(step => step.id === 'ud_pickup')) {
              const udStep = processingSteps.find(step => step.id === 'ud_processing');
              if (udStep?.completedAt) {
                pickupStepsToAdd.push({
                  id: 'ud_pickup',
                  name: '📦 Ministry of Foreign Affairs - pick up',
                  description: 'Pick up legalized documents',
                  status: 'pending',
                  expectedCompletionDate: udStep.expectedCompletionDate,
                  submittedAt: udStep.expectedCompletionDate
                });
              }
            }

            if (processingSteps.some(step => step.id === 'embassy_processing' && step.status === 'completed') &&
                !processingSteps.some(step => step.id === 'embassy_pickup')) {
              const embassyStep = processingSteps.find(step => step.id === 'embassy_processing');
              if (embassyStep?.completedAt) {
                pickupStepsToAdd.push({
                  id: 'embassy_pickup',
                  name: '📦 Embassy - pick up',
                  description: `Pick up consular legalized documents`,
                  status: 'pending',
                  expectedCompletionDate: embassyStep.expectedCompletionDate,
                  submittedAt: embassyStep.expectedCompletionDate
                });
              }
            }

            if (pickupStepsToAdd.length > 0) {
              processingSteps.push(...pickupStepsToAdd);
              needsUpdate = true;
            }
          }

          processingSteps.forEach((step: ProcessingStep) => {
            let taskType: 'pickup' | 'delivery' | null = null;
            let authority = '';
            let address = '';

            // Determine task type and authority based on step
            if (step.id === 'pickup_booking' && order.pickupService) {
              taskType = 'pickup';
              authority = 'Kundadress';
              address = `${order.pickupAddress?.street || ''}, ${order.pickupAddress?.postalCode || ''} ${order.pickupAddress?.city || ''}`;
            } else if (step.id === 'stockholm_courier_pickup') {
              taskType = 'pickup';
              authority = 'Stockholm City Courier';
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
              authority = 'Translation Agency';
              address = 'Authorized translation agency';
            } else if (step.id === 'translation_pickup') {
              taskType = 'pickup';
              authority = 'Translation Agency';
              address = 'Authorized translation agency';
            } else if (step.id === 'chamber_delivery' || step.id === 'chamber_processing') {
              taskType = 'delivery';
              authority = 'Chamber of Commerce';
              address = 'Chamber of Commerce office';
            } else if (step.id === 'chamber_pickup') {
              taskType = 'pickup';
              authority = 'Chamber of Commerce';
              address = 'Chamber of Commerce office';
            } else if (step.id === 'ud_delivery' || step.id === 'ud_processing') {
              taskType = 'delivery';
              authority = 'Ministry of Foreign Affairs';
              address = 'Ministry of Foreign Affairs office';
            } else if (step.id === 'ud_pickup') {
              taskType = 'pickup';
              authority = 'Ministry of Foreign Affairs';
              address = 'Ministry of Foreign Affairs office';
            } else if (step.id === 'apostille_delivery' || step.id === 'apostille') {
              taskType = 'delivery';
              authority = 'Ministry of Foreign Affairs';
              address = 'Ministry of Foreign Affairs office';
            } else if (step.id === 'apostille_pickup') {
              taskType = 'pickup';
              authority = 'Ministry of Foreign Affairs';
              address = 'Ministry of Foreign Affairs office';
            } else if (step.id === 'embassy_delivery' || step.id === 'embassy_processing') {
              taskType = 'delivery';
              const c = getCountryInfo(order.country);
              const embassyName = c.name || c.code || order.country || 'Unknown';
              authority = `${embassyName} Embassy`;
              address = `${embassyName} Embassy`;
            } else if (step.id === 'embassy_pickup') {
              taskType = 'pickup';
              const c = getCountryInfo(order.country);
              const embassyName = c.name || c.code || order.country || 'Unknown';
              authority = `${embassyName} Embassy`;
              address = `${embassyName} Embassy`;
            } else if (step.id === 'return_shipping') {
              taskType = 'pickup';
              authority = 'Shipping Provider';
              address = 'Shipping provider terminal';
            } else if (step.id === 'stockholm_courier_delivery') {
              taskType = 'delivery';
              authority = 'Stockholm City Courier';
              const a = (order as any).returnAddress || {};
              const line1 = [a.firstName, a.lastName].filter(Boolean).join(' ').trim();
              const line2 = [a.companyName].filter(Boolean).join(' ').trim();
              const line3 = [a.street, a.addressLine2].filter(Boolean).join(', ').trim();
              const line4 = [a.postalCode, a.city].filter(Boolean).join(' ').trim();
              address = [line1, line2, line3, line4].filter(Boolean).join(' | ');
            }

            // Only show tasks that have dates (submitted or expected) AND are relevant for today
            // Skip internal locations that driver doesn't deliver to
            if (taskType && (step.submittedAt || step.expectedCompletionDate) &&
                authority !== 'Office' && authority !== 'Shipping Provider') {
              try {
                const taskDate = step.submittedAt ?
                  new Date(step.submittedAt.toDate ? step.submittedAt.toDate() : step.submittedAt).toISOString().split('T')[0] :
                  new Date(step.expectedCompletionDate.toDate ? step.expectedCompletionDate.toDate() : step.expectedCompletionDate).toISOString().split('T')[0];

                // Only show tasks for the selected date
                const selectedDateObj = new Date(selectedDate + 'T00:00:00');
                const taskDateObj = new Date(taskDate);
                const daysDiff = Math.floor((taskDateObj.getTime() - selectedDateObj.getTime()) / (1000 * 60 * 60 * 24));

                if (daysDiff === 0) { // Only show tasks for the exact selected date
                  driverTasks.push({
                    orderId: order.id || '',
                    orderNumber: order.orderNumber || order.id || '',
                    customerName: `${order.customerInfo?.firstName || ''} ${order.customerInfo?.lastName || ''}`.trim() || 'Unknown customer',
                    stepName: step.name || 'Unknown step',
                    stepDescription: step.description || 'No description',
                    authority,
                    date: taskDate,
                    type: taskType,
                    status: step.status === 'completed' ? 'completed' : step.status === 'in_progress' ? 'in_progress' : 'pending',
                    address,
                    notes: step.notes,
                    stepId: step.id // Include the actual step ID from processingSteps
                  });
                }
              } catch (dateError) {
              }
            }
          });
        }
      });

      // Save newly created processingSteps back to Firebase
      if (ordersToUpdate.length > 0) {
        for (const update of ordersToUpdate) {
          try {
            await updateOrder(update.orderId, { processingSteps: update.processingSteps });
          } catch (error) {
          }
        }
      }

      setTasks(driverTasks);
    } catch (error) {
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
    return new Date(dateString).toLocaleDateString('en-GB', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  useEffect(() => {
    fetchDriverTasks();
  }, []);

  useEffect(() => {
    loadMonthlySummaryForSelectedDate();
  }, [selectedDate]);

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
        return 'Completed';
      case 'in_progress':
        return 'In Progress';
      case 'pending':
        return 'Pending';
      default:
        return status;
    }
  };

  // Generate PDF for driver task list - simple black & white design
  const generatePDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    let y = 20;

    // Header - simple black text
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Driver Task List', margin, y);
    y += 8;
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(selectedDate + ' | Total: ' + tasks.length + ' tasks', margin, y);
    y += 5;
    
    // Line separator
    doc.setDrawColor(0, 0, 0);
    doc.line(margin, y, pageWidth - margin, y);
    y += 10;

    // Group tasks by authority
    Object.entries(groupedTasks).forEach(([authority, authorityTasks]) => {
      const deliveryTasks = (authorityTasks as DriverTask[]).filter(t => t.type === 'delivery');
      const pickupTasks = (authorityTasks as DriverTask[]).filter(t => t.type === 'pickup');

      // Check if we need a new page
      if (y > 250) {
        doc.addPage();
        y = 20;
      }

      // Authority header
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(authority, margin, y);
      y += 7;

      // Delivery tasks
      if (deliveryTasks.length > 0) {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('DROP OFF (' + deliveryTasks.length + ')', margin + 2, y);
        y += 6;

        doc.setFont('helvetica', 'normal');
        deliveryTasks.forEach((task) => {
          if (y > 275) {
            doc.addPage();
            y = 20;
          }

          // Checkbox
          doc.setDrawColor(0, 0, 0);
          doc.rect(margin, y - 3, 4, 4);
          
          // Task info
          doc.setFontSize(9);
          const stepText = task.stepName.replace(/^[📦📤✍️🏛️🌐🇸🇪🏢🔍✅🚚🧾]+/, '').trim();
          doc.text('#' + task.orderNumber + '  ' + task.customerName + '  -  ' + stepText.substring(0, 40), margin + 7, y);
          
          y += 6;
        });
        y += 3;
      }

      // Pickup tasks
      if (pickupTasks.length > 0) {
        if (y > 265) {
          doc.addPage();
          y = 20;
        }

        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('PICK UP (' + pickupTasks.length + ')', margin + 2, y);
        y += 6;

        doc.setFont('helvetica', 'normal');
        pickupTasks.forEach((task) => {
          if (y > 275) {
            doc.addPage();
            y = 20;
          }

          // Checkbox
          doc.setDrawColor(0, 0, 0);
          doc.rect(margin, y - 3, 4, 4);
          
          // Task info
          doc.setFontSize(9);
          const stepText = task.stepName.replace(/^[📦📤✍️🏛️🌐🇸🇪🏢🔍✅🚚🧾]+/, '').trim();
          doc.text('#' + task.orderNumber + '  ' + task.customerName + '  -  ' + stepText.substring(0, 40), margin + 7, y);
          
          y += 6;
        });
        y += 3;
      }

      y += 5;
    });

    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text(
        'DOX Visumpartner AB | Generated: ' + new Date().toLocaleString('en-GB') + ' | Page ' + i + '/' + pageCount,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: 'center' }
      );
    }

    // Save PDF
    const fileName = 'driver-tasks-' + selectedDate + '.pdf';
    doc.save(fileName);
  };

  return (
    <ProtectedRoute>
      <Head>
        <title>Driver Dashboard - DOX</title>
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
                <h1 className="text-3xl font-bold text-gray-900">🚗 Driver Dashboard</h1>
                <p className="text-gray-600 mt-2">Overview of pickups and deliveries - {formatDate(selectedDate)}</p>
              </div>
              <div className="flex items-center space-x-4">
                <button
                  onClick={generatePDF}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors flex items-center"
                  title="Download PDF"
                >
                  <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Download PDF
                </button>
                <Link
                  href="/admin"
                  className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                >
                  Back to Admin
                </Link>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date
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
                  Task Type
                </label>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="all">All tasks</option>
                  <option value="pickup">Pickups</option>
                  <option value="delivery">Deliveries</option>
                </select>
              </div>
              <div className="flex items-end">
                <button
                  onClick={fetchDriverTasks}
                  className="w-full px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 transition-colors"
                >
                  Refresh List
                </button>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mb-4"></div>
              <p className="text-gray-600">Loading tasks...</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Tasks for {formatDate(selectedDate)}
                </h2>

                {Object.keys(groupedTasks).length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <svg className="h-12 w-12 mx-auto mb-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2m9 5v-2a2 2 0 00-2-2H9a2 2 0 00-2 2v4m0-4h2m-2 4h2m-4-4h2m-2 4h-2m2-4H9a2 2 0 00-2 2m2-4h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m2-4h2m-4 4h2m-2 4h-2m2-4H5a2 2 0 00-2 2m2-4h6a2 2 0 012 2" />
                    </svg>
                    <p>No tasks scheduled for this date</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Print-friendly layout - hidden on screen, shown on print */}
                    <div className="hidden print:block">
                      <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold mb-2">🚗 Driver Tasks</h1>
                        <p className="text-xl">{formatDate(selectedDate)}</p>
                        <p className="text-sm text-gray-600 mt-2">Total: {tasks.length} tasks</p>
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
                                    📤 DROP OFF ({deliveryTasks.length} tasks)
                                  </h3>
                                  <div className="space-y-4">
                                    {deliveryTasks.map((task, index) => (
                                      <div key={`print-delivery-${index}`} className="bg-gray-50 p-4 rounded border-l-4 border-orange-500">
                                        <div className="flex justify-between items-start mb-2">
                                          <span className="text-lg font-bold text-orange-700">
                                            📤 DROP OFF
                                          </span>
                                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                            task.status === 'completed' ? 'bg-green-100 text-green-800' :
                                            task.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                                            'bg-yellow-100 text-yellow-800'
                                          }`}>
                                            {task.status === 'completed' ? 'DONE' :
                                             task.status === 'in_progress' ? 'IN PROGRESS' : 'PENDING'}
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
                                    📦 PICK UP ({pickupTasks.length} tasks)
                                  </h3>
                                  <div className="space-y-4">
                                    {pickupTasks.map((task, index) => (
                                      <div key={`print-pickup-${index}`} className="bg-gray-50 p-4 rounded border-l-4 border-green-500">
                                        <div className="flex justify-between items-start mb-2">
                                          <span className="text-lg font-bold text-green-700">
                                            📦 PICK UP
                                          </span>
                                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                            task.status === 'completed' ? 'bg-green-100 text-green-800' :
                                            task.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                                            'bg-yellow-100 text-yellow-800'
                                          }`}>
                                            {task.status === 'completed' ? 'DONE' :
                                             task.status === 'in_progress' ? 'IN PROGRESS' : 'PENDING'}
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
                              <span className="ml-2 text-sm font-normal text-gray-600">({authorityTasks.length} tasks)</span>
                            </h3>
                          </div>

                          <div className="p-4">
                            {/* Delivery tasks */}
                            {deliveryTasks.length > 0 && (
                              <div className="mb-6">
                                <h4 className="text-md font-semibold text-orange-700 mb-3 flex items-center">
                                  Drop off ({deliveryTasks.length} tasks)
                                </h4>
                                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                                  {/* Header row */}
                                  <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 flex items-center font-medium text-sm text-gray-700">
                                    <div className="w-28">Order</div>
                                    <div className="flex-1 ml-4">Customer</div>
                                    <div className="w-40 hidden sm:block">Task</div>
                                    <div className="w-20">Type</div>
                                    <div className="w-24">Status</div>
                                    <div className="w-32 text-right">Actions</div>
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
                                            {task.type === 'pickup' ? 'Pickup' : 'Drop off'}
                                          </span>
                                        </div>

                                        {/* Status */}
                                        <div className="w-24">
                                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${
                                            task.status === 'completed' ? 'bg-green-100 text-green-800' :
                                            task.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                                            'bg-gray-100 text-gray-800'
                                          }`}>
                                            {getStatusText(task.status)}
                                          </span>
                                        </div>

                                        {/* Actions */}
                                        <div className="w-32 text-right">
                                          <a
                                            href={`/admin/orders/${task.orderId}`}
                                            className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md text-xs font-medium text-blue-600 bg-white hover:bg-gray-50 hover:text-blue-800"
                                          >
                                            View
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
                                  Pick up ({pickupTasks.length} tasks)
                                </h4>
                                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                                  {/* Header row */}
                                  <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 flex items-center font-medium text-sm text-gray-700">
                                    <div className="w-28">Order</div>
                                    <div className="flex-1 ml-4">Customer</div>
                                    <div className="w-40 hidden sm:block">Task</div>
                                    <div className="w-20">Type</div>
                                    <div className="w-24">Status</div>
                                    <div className="w-32 text-right">Actions</div>
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
                                            {task.type === 'pickup' ? 'Pickup' : 'Drop off'}
                                          </span>
                                        </div>

                                        {/* Status */}
                                        <div className="w-24">
                                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${
                                            task.status === 'completed' ? 'bg-green-100 text-green-800' :
                                            task.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                                            'bg-gray-100 text-gray-800'
                                          }`}>
                                            {getStatusText(task.status)}
                                          </span>
                                        </div>

                                        {/* Actions */}
                                        <div className="w-32 text-right">
                                          <a
                                            href={`/admin/orders/${task.orderId}`}
                                            className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md text-xs font-medium text-blue-600 bg-white hover:bg-gray-50 hover:text-blue-800"
                                          >
                                            View
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

          {/* Daily report: hours & expenses (mobile-friendly) - moved below tasks */}
          <div className="bg-white rounded-lg shadow p-6 mt-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">
              Daily Report – Hours & Expenses
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Enter your hours and expenses for <span className="font-medium">{formatDate(selectedDate)}</span>. 
              Save the daily report each workday, and at the end of the month you can open a monthly summary as a ready email to the office.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hours Worked
                </label>
                <input
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="0.25"
                  value={hoursWorked}
                  onChange={(e) => setHoursWorked(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="e.g. 7.5"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Parking (SEK)
                </label>
                <input
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="1"
                  value={parkingCost}
                  onChange={(e) => setParkingCost(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="e.g. 120"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Embassy Expenses (SEK)
                </label>
                <input
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="1"
                  value={embassyCost}
                  onChange={(e) => setEmbassyCost(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="e.g. 300"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Other Expenses (SEK)
                </label>
                <input
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="1"
                  value={otherCost}
                  onChange={(e) => setOtherCost(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="e.g. 0"
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes (optional)
              </label>
              <textarea
                rows={3}
                value={driverNotes}
                onChange={(e) => setDriverNotes(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="E.g. which embassy, extra info about parking or trips..."
              />
            </div>

            <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center">
              <button
                type="button"
                onClick={handleSaveDailyReport}
                disabled={isSavingDailyReport}
                className="w-full md:w-auto inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSavingDailyReport ? 'Saving report...' : 'Save Daily Report'}
              </button>
              <button
                type="button"
                onClick={handleOpenMonthlyReportEmail}
                disabled={isOpeningMonthlyEmail}
                className="w-full md:w-auto inline-flex items-center justify-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isOpeningMonthlyEmail ? 'Opening monthly summary...' : 'Open Monthly Summary'}
              </button>
            </div>
            {saveDailyMessage && (
              <p className="mt-3 text-sm text-gray-600">{saveDailyMessage}</p>
            )}
            {monthlyMessage && (
              <p className="mt-1 text-sm text-gray-600">{monthlyMessage}</p>
            )}

            {monthlySummary && (
              <div className="mt-6 border-t border-gray-200 pt-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">
                  {`Saved daily reports – ${new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric' }).format(new Date(monthlySummary.year, monthlySummary.month - 1, 1))}`}
                </h3>

                {isLoadingSummary ? (
                  <p className="text-sm text-gray-500">Loading saved reports...</p>
                ) : monthlySummary.reports.length === 0 ? (
                  <p className="text-sm text-gray-500">No saved daily reports for this month.</p>
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-200 bg-gray-50">
                            <th className="px-2 py-1 text-left font-medium text-gray-700">Date</th>
                            <th className="px-2 py-1 text-right font-medium text-gray-700">Hours</th>
                            <th className="px-2 py-1 text-right font-medium text-gray-700">Parking</th>
                            <th className="px-2 py-1 text-right font-medium text-gray-700">Embassy</th>
                            <th className="px-2 py-1 text-right font-medium text-gray-700">Other</th>
                            <th className="px-2 py-1 text-left font-medium text-gray-700">Notes</th>
                            <th className="px-2 py-1 text-center font-medium text-gray-700">Edit</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {monthlySummary.reports.map((report) => (
                            <tr
                              key={report.id || report.date}
                              className="hover:bg-blue-50 cursor-pointer transition-colors"
                              onClick={() => {
                                setSelectedDate(report.date);
                                setHoursWorked(report.hoursWorked.toString());
                                setParkingCost(report.parkingCost.toString());
                                setEmbassyCost(report.embassyCost.toString());
                                setOtherCost(report.otherCost.toString());
                                setDriverNotes(report.notes || '');
                                // Scroll to form
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                              }}
                            >
                              <td className="px-2 py-1 whitespace-nowrap">{report.date}</td>
                              <td className="px-2 py-1 text-right whitespace-nowrap">{report.hoursWorked.toLocaleString('sv-SE')}</td>
                              <td className="px-2 py-1 text-right whitespace-nowrap">{report.parkingCost} kr</td>
                              <td className="px-2 py-1 text-right whitespace-nowrap">{report.embassyCost} kr</td>
                              <td className="px-2 py-1 text-right whitespace-nowrap">{report.otherCost} kr</td>
                              <td className="px-2 py-1 text-left max-w-xs truncate" title={report.notes || ''}>{report.notes || '-'}</td>
                              <td className="px-2 py-1 text-center">
                                <span className="inline-flex items-center text-blue-600 hover:text-blue-800">
                                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                  </svg>
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center">
                      <svg className="h-5 w-5 text-blue-600 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-sm text-blue-800">
                        <strong>Click on any row to edit</strong> – the values will be loaded into the form above. Make your changes and click "Save Daily Report" to update.
                      </span>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Footer sections like order management */}
          <div className="mt-8 space-y-6">
            {/* Summary section */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium mb-4">Today's Summary</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <svg className="h-8 w-8 text-blue-600 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <div>
                      <p className="text-sm font-medium text-blue-800">Total Tasks</p>
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
                      <p className="text-sm font-medium text-green-800">Completed</p>
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
                      <p className="text-sm font-medium text-orange-800">In Progress</p>
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
                      <p className="text-sm font-medium text-gray-800">Pending</p>
                      <p className="text-2xl font-bold text-gray-900">{tasks.filter(t => t.status === 'pending').length}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Driver notes section */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium mb-4">Driver Notes</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Add note for the day
                  </label>
                  <textarea
                    placeholder="Write your notes for the day here..."
                    className="w-full border border-gray-300 rounded-lg p-3"
                    rows={3}
                  />
                </div>
                <div className="flex items-center space-x-3">
                  <button className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700">
                    Save Note
                  </button>
                  <button className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
                    Report Day Complete
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  // Admin pages always use English
  return {
    props: {
      ...(await serverSideTranslations('en', ['common'])),
    },
  };
};

export default DriverDashboardPage;
