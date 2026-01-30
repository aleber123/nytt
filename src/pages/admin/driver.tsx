import React, { useState, useEffect } from 'react';
import { GetStaticProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import Head from 'next/head';
import Link from 'next/link';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { getAllOrders, updateOrder } from '@/firebase/orderService';
import type { Order } from '@/firebase/orderService';
import { getAllVisaOrders, updateVisaOrder } from '@/firebase/visaOrderService';
import type { VisaOrder } from '@/firebase/visaOrderService';
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
  orderType: 'legalization' | 'visa'; // Track order type for linking
}

function DriverDashboardPage() {
  const [tasks, setTasks] = useState<DriverTask[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [filterType, setFilterType] = useState<'all' | 'pickup' | 'delivery'>('all');

  // Simple daily report state for hours & expenses
  const [hoursWorked, setHoursWorked] = useState('');
  const [parkingCosts, setParkingCosts] = useState<string[]>(['']);
  const [embassyCosts, setEmbassyCosts] = useState<string[]>(['']);
  const [otherCosts, setOtherCosts] = useState<string[]>(['']);
  const [driverNotes, setDriverNotes] = useState('');

  // Helper functions for multi-expense fields
  const addParkingField = () => setParkingCosts([...parkingCosts, '']);
  const removeParkingField = (index: number) => {
    if (parkingCosts.length > 1) {
      setParkingCosts(parkingCosts.filter((_, i) => i !== index));
    }
  };
  const updateParkingCost = (index: number, value: string) => {
    const updated = [...parkingCosts];
    updated[index] = value;
    setParkingCosts(updated);
  };

  const addEmbassyField = () => setEmbassyCosts([...embassyCosts, '']);
  const removeEmbassyField = (index: number) => {
    if (embassyCosts.length > 1) {
      setEmbassyCosts(embassyCosts.filter((_, i) => i !== index));
    }
  };
  const updateEmbassyCost = (index: number, value: string) => {
    const updated = [...embassyCosts];
    updated[index] = value;
    setEmbassyCosts(updated);
  };

  const addOtherField = () => setOtherCosts([...otherCosts, '']);
  const removeOtherField = (index: number) => {
    if (otherCosts.length > 1) {
      setOtherCosts(otherCosts.filter((_, i) => i !== index));
    }
  };
  const updateOtherCost = (index: number, value: string) => {
    const updated = [...otherCosts];
    updated[index] = value;
    setOtherCosts(updated);
  };

  // Calculate totals from arrays
  const totalParking = parkingCosts.reduce((sum, cost) => sum + (parseInt(cost, 10) || 0), 0);
  const totalEmbassy = embassyCosts.reduce((sum, cost) => sum + (parseInt(cost, 10) || 0), 0);
  const totalOther = otherCosts.reduce((sum, cost) => sum + (parseInt(cost, 10) || 0), 0);
  const [isSavingDailyReport, setIsSavingDailyReport] = useState(false);
  const [saveDailyMessage, setSaveDailyMessage] = useState<string | null>(null);
  const [isOpeningMonthlyEmail, setIsOpeningMonthlyEmail] = useState(false);
  const [monthlyMessage, setMonthlyMessage] = useState<string | null>(null);
  const [monthlySummary, setMonthlySummary] = useState<DriverMonthlySummary | null>(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  
  // Edit modal state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingReport, setEditingReport] = useState<{
    date: string;
    hoursWorked: string;
    parkingCost: string;
    embassyCost: string;
    otherCost: string;
    notes: string;
  } | null>(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

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
        parkingCost: totalParking.toString(),
        embassyCost: totalEmbassy.toString(),
        otherCost: totalOther.toString(),
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

  // Handle saving edit from modal
  const handleSaveEditReport = async () => {
    if (!editingReport) return;
    
    try {
      setIsSavingEdit(true);

      await saveDriverDailyReport({
        driverId: 'default-driver',
        date: editingReport.date,
        hoursWorked: editingReport.hoursWorked,
        parkingCost: editingReport.parkingCost,
        embassyCost: editingReport.embassyCost,
        otherCost: editingReport.otherCost,
        notes: editingReport.notes,
      });

      setEditModalOpen(false);
      setEditingReport(null);
      await loadMonthlySummaryForSelectedDate();
    } catch (error) {
      // Error handling - keep modal open
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Open edit modal with report data
  const openEditModal = (report: any) => {
    setEditingReport({
      date: report.date,
      hoursWorked: report.hoursWorked.toString(),
      parkingCost: report.parkingCost.toString(),
      embassyCost: report.embassyCost.toString(),
      otherCost: report.otherCost.toString(),
      notes: report.notes || '',
    });
    setEditModalOpen(true);
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
      `Parking: ${totalParking} kr${parkingCosts.filter(c => c).length > 1 ? ` (${parkingCosts.filter(c => c).join(' + ')})` : ''}`,
      `Embassy expenses: ${totalEmbassy} kr${embassyCosts.filter(c => c).length > 1 ? ` (${embassyCosts.filter(c => c).join(' + ')})` : ''}`,
      `Other expenses: ${totalOther} kr${otherCosts.filter(c => c).length > 1 ? ` (${otherCosts.filter(c => c).join(' + ')})` : ''}`,
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
      setIsOpeningMonthlyEmail(true);
      setMonthlyMessage(null);

      const dateObj = new Date(selectedDate + 'T00:00:00');
      if (Number.isNaN(dateObj.getTime())) {
        setMonthlyMessage('The date is invalid.');
        return;
      }

      const year = dateObj.getFullYear();
      const month = dateObj.getMonth() + 1;

      const summary = await getDriverMonthlySummary('default-driver', year, month);

      const monthFormatter = new Intl.DateTimeFormat('sv-SE', {
        year: 'numeric',
        month: 'long',
      });
      const someDateInMonth = new Date(year, month - 1, 1);
      const monthLabel = monthFormatter.format(someDateInMonth);

      const to = 'info@doxvl.se,info@visumpartner.se';
      const subject = `Monthly Driver Report – ${monthLabel}`;

      // Calculate total expenses
      const totalExpenses = summary.totalParking + summary.totalEmbassy + summary.totalOther;
      const workingDays = summary.reports.length;

      // Format reports sorted by date
      const sortedReports = [...summary.reports].sort((a, b) => a.date.localeCompare(b.date));

      const headerLines = [
        '═══════════════════════════════════════════',
        `       MONTHLY DRIVER REPORT`,
        `       ${monthLabel.toUpperCase()}`,
        '═══════════════════════════════════════════',
        '',
        '📊 SUMMARY',
        '───────────────────────────────────────────',
        `   Working days:     ${workingDays} days`,
        `   Total hours:      ${summary.totalHours.toLocaleString('en-GB')} hours`,
        '',
        '💰 EXPENSES',
        '───────────────────────────────────────────',
        `   🅿️ Parking:       ${summary.totalParking.toLocaleString('en-GB')} SEK`,
        `   🏛️ Embassy:       ${summary.totalEmbassy.toLocaleString('en-GB')} SEK`,
        `   📋 Other:         ${summary.totalOther.toLocaleString('en-GB')} SEK`,
        '───────────────────────────────────────────',
        `   💵 TOTAL:         ${totalExpenses.toLocaleString('en-GB')} SEK`,
        '',
        '',
        '📅 DAILY BREAKDOWN',
        '═══════════════════════════════════════════',
      ];

      const detailLines = sortedReports.length
        ? sortedReports.map((report) => {
            const dateFormatted = new Date(report.date + 'T00:00:00').toLocaleDateString('en-GB', { 
              weekday: 'short', 
              day: 'numeric', 
              month: 'short' 
            });
            const dayExpenses = report.parkingCost + report.embassyCost + report.otherCost;
            const lines = [
              ``,
              `📆 ${dateFormatted}`,
              `   Hours: ${report.hoursWorked}h`,
            ];
            if (report.parkingCost > 0) lines.push(`   Parking: ${report.parkingCost} SEK`);
            if (report.embassyCost > 0) lines.push(`   Embassy: ${report.embassyCost} SEK`);
            if (report.otherCost > 0) lines.push(`   Other: ${report.otherCost} SEK`);
            if (dayExpenses > 0) lines.push(`   Day total: ${dayExpenses} SEK`);
            if (report.notes) lines.push(`   📝 ${report.notes}`);
            return lines.join('\n');
          })
        : ['', '(No saved daily reports for this month.)'];

      const bodyLines = [
        ...headerLines,
        ...detailLines,
        '',
        '',
        '═══════════════════════════════════════════',
        'Generated from DOX Driver Dashboard',
        `Report date: ${new Date().toLocaleDateString('en-GB')}`,
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
                    stepId: step.id,
                    orderType: 'legalization'
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

      // ========== VISA ORDERS ==========
      // Fetch visa orders and create driver tasks for embassy visits
      const visaOrders = (await getAllVisaOrders()).filter(
        (order) => order.status === 'pending' || order.status === 'received' || order.status === 'processing' || order.status === 'submitted-to-embassy'
      );

      visaOrders.forEach((visaOrder: VisaOrder) => {
        const processingSteps = visaOrder.processingSteps;
        if (!processingSteps || !Array.isArray(processingSteps)) return;

        // Get destination country info for embassy name
        const destCountry = ALL_COUNTRIES.find(c => 
          c.code === visaOrder.destinationCountryCode?.toUpperCase() ||
          c.name.toLowerCase() === visaOrder.destinationCountry?.toLowerCase()
        );
        const embassyName = destCountry?.name || visaOrder.destinationCountry || 'Unknown';

        processingSteps.forEach((step: ProcessingStep) => {
          let taskType: 'pickup' | 'delivery' | null = null;
          let authority = '';
          let address = '';

          // Embassy delivery (drop off passport)
          if (step.id === 'embassy_delivery') {
            taskType = 'delivery';
            authority = `${embassyName} Embassy (Visa)`;
            address = `${embassyName} Embassy`;
          }
          // Embassy pickup (pick up passport with visa)
          else if (step.id === 'embassy_pickup') {
            taskType = 'pickup';
            authority = `${embassyName} Embassy (Visa)`;
            address = `${embassyName} Embassy`;
          }
          // Stockholm courier pickup for visa
          else if (step.id === 'pickup_booking' && visaOrder.pickupService) {
            taskType = 'pickup';
            authority = 'Kundadress (Visa)';
            const pickupAddr = (visaOrder as any).pickupAddress || {};
            address = [pickupAddr.street, pickupAddr.postalCode, pickupAddr.city].filter(Boolean).join(', ');
          }

          // Only add tasks that have dates and are not completed
          if (taskType && step.status !== 'completed' && step.status !== 'skipped') {
            try {
              // Use expectedCompletionDate or submittedAt if available, otherwise use today
              let taskDate = selectedDate; // Default to selected date
              if (step.submittedAt) {
                taskDate = new Date(step.submittedAt.toDate ? step.submittedAt.toDate() : step.submittedAt).toISOString().split('T')[0];
              } else if (step.expectedCompletionDate) {
                taskDate = new Date(step.expectedCompletionDate.toDate ? step.expectedCompletionDate.toDate() : step.expectedCompletionDate).toISOString().split('T')[0];
              }

              // Only show tasks for the selected date
              if (taskDate === selectedDate) {
                // Get customer name from visa order
                const extVisaOrder = visaOrder as any;
                const travelerName = extVisaOrder.travelers?.[0] 
                  ? `${extVisaOrder.travelers[0].firstName || ''} ${extVisaOrder.travelers[0].lastName || ''}`.trim()
                  : '';
                const customerName = travelerName || 
                  `${visaOrder.customerInfo?.firstName || ''} ${visaOrder.customerInfo?.lastName || ''}`.trim() || 
                  'Unknown customer';

                driverTasks.push({
                  orderId: visaOrder.id || '',
                  orderNumber: visaOrder.orderNumber || visaOrder.id || '',
                  customerName,
                  stepName: `🛂 ${step.name || 'Visa task'}`,
                  stepDescription: step.description || 'No description',
                  authority,
                  date: taskDate,
                  type: taskType,
                  status: step.status === 'in_progress' ? 'in_progress' : 'pending',
                  address,
                  notes: step.notes,
                  stepId: step.id,
                  orderType: 'visa'
                });
              }
            } catch (dateError) {
              // Skip tasks with invalid dates
            }
          }
        });
      });

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

      {/* Edit Report Modal - WCAG optimized */}
      {editModalOpen && editingReport && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-modal-title"
          onClick={() => setEditModalOpen(false)}
        >
          <div 
            className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="sticky top-0 bg-blue-600 text-white p-5 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <h2 id="edit-modal-title" className="text-2xl font-bold">
                  ✏️ Edit Report
                </h2>
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="p-2 hover:bg-blue-700 rounded-xl transition-colors"
                  aria-label="Close modal"
                >
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <p className="text-xl text-blue-100 mt-2">
                📆 {new Date(editingReport.date + 'T00:00:00').toLocaleDateString('en-GB', { 
                  weekday: 'long', 
                  day: 'numeric', 
                  month: 'long',
                  year: 'numeric'
                })}
              </p>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-5">
              {/* Hours */}
              <div>
                <label htmlFor="edit-hours" className="block text-xl font-bold text-gray-900 mb-2">
                  ⏱️ Hours Worked
                </label>
                <input
                  id="edit-hours"
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="0.25"
                  value={editingReport.hoursWorked}
                  onChange={(e) => setEditingReport({...editingReport, hoursWorked: e.target.value})}
                  className="w-full px-4 py-4 text-2xl border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-300 focus:border-blue-500"
                  placeholder="0"
                />
              </div>

              {/* Parking */}
              <div>
                <label htmlFor="edit-parking" className="block text-xl font-bold text-gray-900 mb-2">
                  🅿️ Parking (SEK)
                </label>
                <input
                  id="edit-parking"
                  type="number"
                  inputMode="numeric"
                  min="0"
                  value={editingReport.parkingCost}
                  onChange={(e) => setEditingReport({...editingReport, parkingCost: e.target.value})}
                  className="w-full px-4 py-4 text-2xl border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-300 focus:border-blue-500"
                  placeholder="0"
                />
              </div>

              {/* Embassy */}
              <div>
                <label htmlFor="edit-embassy" className="block text-xl font-bold text-gray-900 mb-2">
                  🏛️ Embassy (SEK)
                </label>
                <input
                  id="edit-embassy"
                  type="number"
                  inputMode="numeric"
                  min="0"
                  value={editingReport.embassyCost}
                  onChange={(e) => setEditingReport({...editingReport, embassyCost: e.target.value})}
                  className="w-full px-4 py-4 text-2xl border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-300 focus:border-blue-500"
                  placeholder="0"
                />
              </div>

              {/* Other */}
              <div>
                <label htmlFor="edit-other" className="block text-xl font-bold text-gray-900 mb-2">
                  📋 Other (SEK)
                </label>
                <input
                  id="edit-other"
                  type="number"
                  inputMode="numeric"
                  min="0"
                  value={editingReport.otherCost}
                  onChange={(e) => setEditingReport({...editingReport, otherCost: e.target.value})}
                  className="w-full px-4 py-4 text-2xl border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-300 focus:border-blue-500"
                  placeholder="0"
                />
              </div>

              {/* Notes */}
              <div>
                <label htmlFor="edit-notes" className="block text-xl font-bold text-gray-900 mb-2">
                  📝 Notes
                </label>
                <textarea
                  id="edit-notes"
                  rows={3}
                  value={editingReport.notes}
                  onChange={(e) => setEditingReport({...editingReport, notes: e.target.value})}
                  className="w-full px-4 py-4 text-xl border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-300 focus:border-blue-500"
                  placeholder="Optional notes..."
                />
              </div>

              {/* Total display */}
              <div className="p-4 bg-green-100 rounded-xl">
                <div className="flex justify-between items-center">
                  <span className="text-xl font-bold text-green-800">💰 Total Expenses</span>
                  <span className="text-3xl font-black text-green-800">
                    {(parseInt(editingReport.parkingCost) || 0) + (parseInt(editingReport.embassyCost) || 0) + (parseInt(editingReport.otherCost) || 0)} SEK
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-gray-100 p-5 rounded-b-2xl space-y-3">
              <button
                type="button"
                onClick={handleSaveEditReport}
                disabled={isSavingEdit}
                className="w-full py-5 bg-green-600 text-white rounded-xl hover:bg-green-700 active:bg-green-800 transition-colors text-2xl font-bold disabled:opacity-50 flex items-center justify-center gap-3"
              >
                {isSavingEdit ? (
                  <>
                    <svg className="animate-spin w-7 h-7" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </>
                ) : (
                  <>✅ SAVE CHANGES</>
                )}
              </button>
              <button
                type="button"
                onClick={() => setEditModalOpen(false)}
                className="w-full py-4 bg-gray-300 text-gray-700 rounded-xl hover:bg-gray-400 active:bg-gray-500 transition-colors text-xl font-bold"
              >
                ❌ Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header - Mobile optimized */}
          <div className="mb-6">
            <div className="text-center mb-4">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900">🚗 Driver</h1>
              <p className="text-lg text-gray-600 mt-1">{formatDate(selectedDate)}</p>
            </div>
            <div className="flex justify-center gap-3">
              <button
                onClick={generatePDF}
                className="flex-1 max-w-[150px] py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 active:bg-green-800 transition-colors flex items-center justify-center gap-2 text-base font-semibold"
                title="Download PDF"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                PDF
              </button>
              <Link
                href="/admin"
                className="flex-1 max-w-[150px] py-3 bg-gray-600 text-white rounded-xl hover:bg-gray-700 active:bg-gray-800 transition-colors flex items-center justify-center text-base font-semibold"
              >
                ← Admin
              </Link>
            </div>
          </div>

          {/* Filters - Mobile optimized with large touch targets */}
          <div className="bg-white rounded-xl shadow p-4 mb-6">
            <div className="space-y-4">
              {/* Date picker - Large and prominent */}
              <div>
                <label htmlFor="date-picker" className="block text-lg font-bold text-gray-900 mb-2">
                  📅 Date
                </label>
                <input
                  id="date-picker"
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full px-4 py-4 text-xl border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-300 focus:border-blue-500"
                />
              </div>
              
              {/* Task type filter */}
              <div>
                <label htmlFor="task-filter" className="block text-lg font-bold text-gray-900 mb-2">
                  📋 Task Type
                </label>
                <select
                  id="task-filter"
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as any)}
                  className="w-full px-4 py-4 text-xl border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-300 focus:border-blue-500 bg-white"
                >
                  <option value="all">All tasks</option>
                  <option value="pickup">📥 Pickups only</option>
                  <option value="delivery">📤 Deliveries only</option>
                </select>
              </div>
              
              {/* Refresh button */}
              <button
                onClick={fetchDriverTasks}
                className="w-full py-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 active:bg-blue-800 transition-colors text-xl font-bold flex items-center justify-center gap-2"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh Tasks
              </button>
            </div>
          </div>

          {loading ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mb-4"></div>
              <p className="text-gray-600">Loading tasks...</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow p-4">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 text-center">
                  📋 Tasks for {formatDate(selectedDate)}
                </h2>

                {Object.keys(groupedTasks).length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">✅</div>
                    <p className="text-2xl font-bold text-gray-700 mb-2">No tasks today!</p>
                    <p className="text-lg text-gray-500">Check another date or refresh the list</p>
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

            <div className="space-y-6 mb-6">
              {/* HOURS - Mobile & WCAG friendly */}
              <div>
                <label htmlFor="hours-input" className="block text-lg font-bold text-gray-900 mb-2">
                  ⏱️ Hours Worked
                </label>
                <input
                  id="hours-input"
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="0.25"
                  value={hoursWorked}
                  onChange={(e) => setHoursWorked(e.target.value)}
                  className="w-full px-4 py-4 text-xl border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-300 focus:border-blue-500"
                  placeholder="e.g. 7.5"
                  aria-label="Hours worked"
                />
              </div>
              {/* PARKING - Mobile & WCAG friendly */}
              <div className="col-span-full">
                <div className="flex items-center justify-between mb-2">
                  <label id="parking-label" className="block text-lg font-bold text-gray-900">
                    🅿️ Parking (SEK)
                  </label>
                  {totalParking > 0 && (
                    <span className="text-xl font-bold text-green-700 bg-green-100 px-3 py-1 rounded-lg">
                      Total: {totalParking} SEK
                    </span>
                  )}
                </div>
                <div className="space-y-3" role="group" aria-labelledby="parking-label">
                  {parkingCosts.map((cost, index) => (
                    <div key={`parking-${index}`} className="flex items-center gap-3">
                      <input
                        type="number"
                        inputMode="numeric"
                        min="0"
                        step="1"
                        value={cost}
                        onChange={(e) => updateParkingCost(index, e.target.value)}
                        className="flex-1 px-4 py-4 text-xl border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-300 focus:border-blue-500"
                        placeholder="0"
                        aria-label={`Parking ${index + 1}`}
                      />
                      {parkingCosts.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeParkingField(index)}
                          className="min-w-[56px] min-h-[56px] flex items-center justify-center bg-red-100 text-red-700 rounded-xl hover:bg-red-200 active:bg-red-300 transition-colors"
                          aria-label={`Remove parking ${index + 1}`}
                        >
                          <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={addParkingField}
                  className="mt-3 w-full py-4 flex items-center justify-center gap-2 bg-blue-50 text-blue-700 font-bold text-lg rounded-xl border-2 border-dashed border-blue-300 hover:bg-blue-100 active:bg-blue-200 transition-colors"
                  aria-label="Add more parking"
                >
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                  Add Parking
                </button>
              </div>

              {/* EMBASSY - Mobile & WCAG friendly */}
              <div className="col-span-full">
                <div className="flex items-center justify-between mb-2">
                  <label id="embassy-label" className="block text-lg font-bold text-gray-900">
                    🏛️ Embassy (SEK)
                  </label>
                  {totalEmbassy > 0 && (
                    <span className="text-xl font-bold text-green-700 bg-green-100 px-3 py-1 rounded-lg">
                      Total: {totalEmbassy} SEK
                    </span>
                  )}
                </div>
                <div className="space-y-3" role="group" aria-labelledby="embassy-label">
                  {embassyCosts.map((cost, index) => (
                    <div key={`embassy-${index}`} className="flex items-center gap-3">
                      <input
                        type="number"
                        inputMode="numeric"
                        min="0"
                        step="1"
                        value={cost}
                        onChange={(e) => updateEmbassyCost(index, e.target.value)}
                        className="flex-1 px-4 py-4 text-xl border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-300 focus:border-blue-500"
                        placeholder="0"
                        aria-label={`Embassy expense ${index + 1}`}
                      />
                      {embassyCosts.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeEmbassyField(index)}
                          className="min-w-[56px] min-h-[56px] flex items-center justify-center bg-red-100 text-red-700 rounded-xl hover:bg-red-200 active:bg-red-300 transition-colors"
                          aria-label={`Remove embassy expense ${index + 1}`}
                        >
                          <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={addEmbassyField}
                  className="mt-3 w-full py-4 flex items-center justify-center gap-2 bg-blue-50 text-blue-700 font-bold text-lg rounded-xl border-2 border-dashed border-blue-300 hover:bg-blue-100 active:bg-blue-200 transition-colors"
                  aria-label="Add more embassy expenses"
                >
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                  Add Embassy
                </button>
              </div>

              {/* OTHER EXPENSES - Mobile & WCAG friendly */}
              <div className="col-span-full">
                <div className="flex items-center justify-between mb-2">
                  <label id="other-label" className="block text-lg font-bold text-gray-900">
                    📋 Other (SEK)
                  </label>
                  {totalOther > 0 && (
                    <span className="text-xl font-bold text-green-700 bg-green-100 px-3 py-1 rounded-lg">
                      Total: {totalOther} SEK
                    </span>
                  )}
                </div>
                <div className="space-y-3" role="group" aria-labelledby="other-label">
                  {otherCosts.map((cost, index) => (
                    <div key={`other-${index}`} className="flex items-center gap-3">
                      <input
                        type="number"
                        inputMode="numeric"
                        min="0"
                        step="1"
                        value={cost}
                        onChange={(e) => updateOtherCost(index, e.target.value)}
                        className="flex-1 px-4 py-4 text-xl border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-300 focus:border-blue-500"
                        placeholder="0"
                        aria-label={`Other expense ${index + 1}`}
                      />
                      {otherCosts.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeOtherField(index)}
                          className="min-w-[56px] min-h-[56px] flex items-center justify-center bg-red-100 text-red-700 rounded-xl hover:bg-red-200 active:bg-red-300 transition-colors"
                          aria-label={`Remove other expense ${index + 1}`}
                        >
                          <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={addOtherField}
                  className="mt-3 w-full py-4 flex items-center justify-center gap-2 bg-blue-50 text-blue-700 font-bold text-lg rounded-xl border-2 border-dashed border-blue-300 hover:bg-blue-100 active:bg-blue-200 transition-colors"
                  aria-label="Add more other expenses"
                >
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                  Add Other
                </button>
              </div>
            </div>

            {/* NOTES - Mobile & WCAG friendly */}
            <div className="mb-6">
              <label htmlFor="notes-input" className="block text-lg font-bold text-gray-900 mb-2">
                📝 Notes (optional)
              </label>
              <textarea
                id="notes-input"
                rows={4}
                value={driverNotes}
                onChange={(e) => setDriverNotes(e.target.value)}
                className="w-full px-4 py-4 text-lg border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-300 focus:border-blue-500"
                placeholder="E.g. which embassy, extra info about parking..."
                aria-label="Notes"
              />
            </div>

            {/* ACTION BUTTONS - Large touch targets for mobile */}
            <div className="space-y-4">
              <button
                type="button"
                onClick={handleSaveDailyReport}
                disabled={isSavingDailyReport}
                className="w-full py-5 flex items-center justify-center gap-3 bg-green-600 text-white rounded-xl hover:bg-green-700 active:bg-green-800 transition-colors text-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                aria-label="Save daily report"
              >
                {isSavingDailyReport ? (
                  <>
                    <svg className="animate-spin w-7 h-7" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </>
                ) : (
                  <>
                    <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    💾 SAVE REPORT
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={handleOpenMonthlyReportEmail}
                disabled={isOpeningMonthlyEmail}
                className="w-full py-4 flex items-center justify-center gap-3 bg-indigo-100 text-indigo-800 rounded-xl hover:bg-indigo-200 active:bg-indigo-300 transition-colors text-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed border-2 border-indigo-300"
                aria-label="Open monthly summary"
              >
                {isOpeningMonthlyEmail ? 'Opening...' : '📧 Send Monthly Report'}
              </button>
            </div>
            {saveDailyMessage && (
              <p className="mt-4 text-lg font-medium text-green-700 bg-green-50 p-3 rounded-lg text-center" role="status">
                ✅ {saveDailyMessage}
              </p>
            )}
            {monthlyMessage && (
              <p className="mt-2 text-base text-gray-700 bg-gray-50 p-3 rounded-lg text-center" role="status">
                {monthlyMessage}
              </p>
            )}

            {monthlySummary && (
              <div className="mt-8 pt-6 border-t-2 border-gray-200">
                <h3 className="text-xl font-bold text-gray-900 mb-4 text-center">
                  📊 Saved Reports – {new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric' }).format(new Date(monthlySummary.year, monthlySummary.month - 1, 1))}
                </h3>

                {isLoadingSummary ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                    <p className="text-lg text-gray-500">Loading...</p>
                  </div>
                ) : monthlySummary.reports.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-xl">
                    <div className="text-4xl mb-2">📭</div>
                    <p className="text-lg text-gray-500">No saved reports this month</p>
                  </div>
                ) : (
                  <>
                    {/* Mobile-friendly card layout - WCAG optimized */}
                    <div className="space-y-4" role="list" aria-label="Saved daily reports">
                      {monthlySummary.reports
                        .sort((a, b) => b.date.localeCompare(a.date))
                        .map((report) => {
                          const dayTotal = report.parkingCost + report.embassyCost + report.otherCost;
                          const dateFormatted = new Date(report.date + 'T00:00:00').toLocaleDateString('en-GB', { 
                            weekday: 'long', 
                            day: 'numeric', 
                            month: 'long' 
                          });
                          return (
                            <button
                              key={report.id || report.date}
                              type="button"
                              role="listitem"
                              aria-label={`Edit report for ${dateFormatted}. Hours: ${report.hoursWorked}, Parking: ${report.parkingCost} SEK, Embassy: ${report.embassyCost} SEK, Other: ${report.otherCost} SEK${report.notes ? `, Notes: ${report.notes}` : ''}`}
                              className="w-full text-left bg-white hover:bg-blue-50 active:bg-blue-100 rounded-2xl p-5 border-3 border-gray-300 hover:border-blue-400 focus:outline-none focus:ring-4 focus:ring-blue-400 focus:border-blue-500 transition-all shadow-sm hover:shadow-md"
                              onClick={() => openEditModal(report)}
                            >
                              {/* Header with date and edit indicator */}
                              <div className="flex items-center justify-between mb-3 pb-3 border-b-2 border-gray-200">
                                <span className="text-xl font-black text-gray-900">📆 {dateFormatted}</span>
                                <span className="px-4 py-2 bg-blue-600 text-white rounded-lg text-lg font-bold">
                                  ✏️ EDIT
                                </span>
                              </div>
                              
                              {/* Data grid - larger text for visibility */}
                              <div className="space-y-3">
                                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                  <span className="text-xl text-gray-700 font-medium">⏱️ Hours</span>
                                  <span className="text-2xl font-black text-gray-900">{report.hoursWorked}h</span>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                  <span className="text-xl text-gray-700 font-medium">🅿️ Parking</span>
                                  <span className="text-2xl font-black text-gray-900">{report.parkingCost} SEK</span>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                  <span className="text-xl text-gray-700 font-medium">🏛️ Embassy</span>
                                  <span className="text-2xl font-black text-gray-900">{report.embassyCost} SEK</span>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                  <span className="text-xl text-gray-700 font-medium">📋 Other</span>
                                  <span className="text-2xl font-black text-gray-900">{report.otherCost} SEK</span>
                                </div>
                              </div>
                              
                              {/* Day total - prominent display */}
                              {dayTotal > 0 && (
                                <div className="mt-4 p-4 bg-green-100 rounded-xl flex justify-between items-center">
                                  <span className="text-xl font-bold text-green-800">💰 DAY TOTAL</span>
                                  <span className="text-3xl font-black text-green-800">{dayTotal} SEK</span>
                                </div>
                              )}
                              
                              {/* Notes section */}
                              {report.notes && (
                                <div className="mt-4 p-4 bg-yellow-50 rounded-xl border-2 border-yellow-200">
                                  <span className="text-xl text-yellow-800 font-medium">📝 Notes:</span>
                                  <p className="text-xl text-yellow-900 mt-1">{report.notes}</p>
                                </div>
                              )}
                            </button>
                          );
                        })}
                    </div>
                    
                    {/* Instructions - high contrast */}
                    <div className="mt-6 p-5 bg-blue-600 rounded-2xl text-center">
                      <p className="text-xl text-white font-bold">
                        👆 TAP ANY CARD TO EDIT
                      </p>
                      <p className="text-lg text-blue-100 mt-1">
                        Values will load in the form above
                      </p>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Monthly Summary Section - Mobile & WCAG friendly */}
          {monthlySummary && (
          <div className="mt-8 space-y-6">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-4 text-center">
                📊 Monthly Summary – {new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric' }).format(new Date(monthlySummary.year, monthlySummary.month - 1, 1))}
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {/* Working Days */}
                <div className="bg-blue-100 border-2 border-blue-300 rounded-xl p-4">
                  <div className="text-center">
                    <p className="text-lg font-bold text-blue-800">📅 Days</p>
                    <p className="text-4xl font-black text-blue-900">{monthlySummary.reports.length}</p>
                  </div>
                </div>

                {/* Total Hours */}
                <div className="bg-purple-100 border-2 border-purple-300 rounded-xl p-4">
                  <div className="text-center">
                    <p className="text-lg font-bold text-purple-800">⏱️ Hours</p>
                    <p className="text-4xl font-black text-purple-900">{monthlySummary.totalHours}</p>
                  </div>
                </div>

                {/* Parking */}
                <div className="bg-cyan-100 border-2 border-cyan-300 rounded-xl p-4">
                  <div className="text-center">
                    <p className="text-lg font-bold text-cyan-800">🅿️ Parking</p>
                    <p className="text-3xl font-black text-cyan-900">{monthlySummary.totalParking} <span className="text-xl">SEK</span></p>
                  </div>
                </div>

                {/* Embassy */}
                <div className="bg-amber-100 border-2 border-amber-300 rounded-xl p-4">
                  <div className="text-center">
                    <p className="text-lg font-bold text-amber-800">🏛️ Embassy</p>
                    <p className="text-3xl font-black text-amber-900">{monthlySummary.totalEmbassy} <span className="text-xl">SEK</span></p>
                  </div>
                </div>

                {/* Other */}
                <div className="bg-gray-100 border-2 border-gray-300 rounded-xl p-4">
                  <div className="text-center">
                    <p className="text-lg font-bold text-gray-800">📋 Other</p>
                    <p className="text-3xl font-black text-gray-900">{monthlySummary.totalOther} <span className="text-xl">SEK</span></p>
                  </div>
                </div>

                {/* Total Expenses */}
                <div className="bg-green-100 border-2 border-green-400 rounded-xl p-4">
                  <div className="text-center">
                    <p className="text-lg font-bold text-green-800">💰 TOTAL</p>
                    <p className="text-3xl font-black text-green-900">{monthlySummary.totalParking + monthlySummary.totalEmbassy + monthlySummary.totalOther} <span className="text-xl">SEK</span></p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          )}

        </div>
      </div>
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
};

export default DriverDashboardPage;
