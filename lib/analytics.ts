/**
 * Google Analytics 4 (GA4) Utilities
 * Tracks user behavior, checkout steps, and conversions
 */

// GA4 Tracking ID from environment
export const GA_TRACKING_ID = process.env.NEXT_PUBLIC_GA_ID || '';

// Check if GA is available
export const isGAEnabled = () => {
  return typeof window !== 'undefined' && typeof window.gtag !== 'undefined' && GA_TRACKING_ID;
};

/**
 * Track page views
 */
export const pageview = (url: string) => {
  if (!isGAEnabled()) return;
  
  window.gtag('config', GA_TRACKING_ID, {
    page_path: url,
  });
};

/**
 * Track custom events
 */
export const event = ({ 
  action, 
  category, 
  label, 
  value 
}: {
  action: string;
  category: string;
  label: string;
  value?: number;
}) => {
  if (!isGAEnabled()) return;
  
  window.gtag('event', action, {
    event_category: category,
    event_label: label,
    value: value,
  });
};

/**
 * Track checkout progress through steps
 */
export const trackCheckoutStep = (step: number, data: any) => {
  if (!isGAEnabled()) return;
  
  window.gtag('event', 'checkout_progress', {
    checkout_step: step,
    checkout_option: data.documentType || 'unknown',
    value: data.totalPrice || 0,
    currency: 'SEK',
    items: [{
      item_id: data.country || 'unknown',
      item_name: data.documentType || 'unknown',
      item_category: 'legalization',
      quantity: data.quantity || 1,
      price: data.totalPrice || 0,
    }]
  });
};

/**
 * Track when user starts checkout
 */
export const trackBeginCheckout = (data: any) => {
  if (!isGAEnabled()) return;
  
  window.gtag('event', 'begin_checkout', {
    currency: 'SEK',
    value: data.totalPrice || 0,
    items: [{
      item_id: data.country,
      item_name: data.documentType,
      quantity: data.quantity,
    }]
  });
};

/**
 * Track successful purchase
 */
export const trackPurchase = (orderId: string, data: any) => {
  if (!isGAEnabled()) return;
  
  window.gtag('event', 'purchase', {
    transaction_id: orderId,
    value: data.totalPrice,
    currency: 'SEK',
    tax: data.vat || 0,
    shipping: data.shippingCost || 0,
    items: [{
      item_id: data.country,
      item_name: data.documentType,
      item_category: 'legalization',
      quantity: data.quantity,
      price: data.totalPrice,
    }]
  });
};

/**
 * Track when user abandons checkout
 */
export const trackAbandonCheckout = (step: number, data: any) => {
  if (!isGAEnabled()) return;
  
  window.gtag('event', 'abandon_checkout', {
    checkout_step: step,
    value: data.totalPrice || 0,
    currency: 'SEK',
  });
};

/**
 * Track form errors
 */
export const trackFormError = (step: number, fieldName: string, errorMessage: string) => {
  if (!isGAEnabled()) return;
  
  window.gtag('event', 'form_error', {
    event_category: 'Form',
    event_label: `Step ${step} - ${fieldName}`,
    value: errorMessage,
  });
};

/**
 * Track time spent on each step
 */
export const trackTimeOnStep = (step: number, timeInSeconds: number) => {
  if (!isGAEnabled()) return;
  
  window.gtag('event', 'timing_complete', {
    name: `step_${step}`,
    value: timeInSeconds * 1000, // Convert to milliseconds
    event_category: 'Checkout Flow',
  });
};

// TypeScript declarations for gtag
declare global {
  interface Window {
    gtag: (
      command: string,
      targetId: string,
      config?: Record<string, any>
    ) => void;
  }
}
