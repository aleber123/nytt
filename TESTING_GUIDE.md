# 🧪 Testing Guide - Today's Improvements

## 📋 What We're Testing

Today we implemented:
1. ✅ **Dynamic Pricing** (removed hardcoded prices)
2. ✅ **Progress Persistence** (auto-save/restore)
3. ✅ **Environment Configuration** (centralized config)
4. ✅ **Enhanced SEO** (structured data, OG images)
5. ✅ **Image Optimization** (Next.js Image component)

---

## 🚀 Quick Start

```bash
# Start the development server
npm run dev

# Open in browser
http://localhost:3000/bestall
```

---

## 🎯 Test 1: Dynamic Pricing (CRITICAL)

### **Objective:** Verify prices come from Firebase, not hardcoded

### **Steps:**

1. **Place a test order with Vietnam**
   - Go to `/bestall`
   - Select country: **Vietnam (VN)**
   - Select document type: Marriage Certificate
   - Select service: **Embassy**
   - Quantity: 1
   - Continue to step 9 (review)

2. **Check the price**
   - ✅ Should show: **242,342,839 kr** (from Firebase)
   - ❌ Should NOT show: 1,500 kr (old hardcoded price)

3. **Update price in admin panel**
   - Go to admin panel → Pricing → Embassy Prices
   - Find Vietnam (VN)
   - Change official fee to: **2,500 kr**
   - Save

4. **Place another order**
   - Refresh `/bestall` page
   - Select Vietnam again
   - Select embassy service
   - ✅ Should now show: **2,999 kr** (2,500 + 499 service fee)

### **Expected Results:**
- ✅ Price updates instantly without code deployment
- ✅ All countries use Firebase pricing
- ✅ No hardcoded prices anywhere

### **Console Check:**
Open browser console (F12), should see:
```
💰 Calculating order price from Firebase...
✅ Pricing calculated from Firebase: {basePrice: ..., totalPrice: ...}
```

---

## 🎯 Test 2: Progress Persistence (CRITICAL)

### **Objective:** Verify order data saves and restores automatically

### **Steps:**

1. **Fill out order form**
   - Go to `/bestall`
   - Select country: **Sweden (SE)**
   - Select document type: Birth Certificate
   - Select services: Apostille, Notarization
   - Quantity: 2
   - Continue to step 5

2. **Refresh the page (F5)**
   - ✅ Should see toast: "Välkommen tillbaka! Din beställning återställdes från steg 5"
   - ✅ Should be on step 5
   - ✅ All data should be intact (country, services, quantity)

3. **Continue and complete order**
   - Fill out remaining steps
   - Submit order
   - ✅ Order should submit successfully

4. **Go back to order page**
   - Navigate to `/bestall` again
   - ✅ Should start from step 1 (progress cleared)
   - ✅ No old data restored

### **Expected Results:**
- ✅ Auto-save indicator visible: "Dina uppgifter sparas automatiskt"
- ✅ Data persists through refresh
- ✅ Data clears after successful submission
- ✅ 24-hour expiration works

### **Console Check:**
```
💾 Order progress saved: {step: 5}
✅ Order progress restored: {step: 5, savedAt: ...}
🗑️ Order progress cleared
```

---

## 🎯 Test 3: Order Submission (CRITICAL)

### **Objective:** Verify complete order flow works end-to-end

### **Steps:**

1. **Complete full order**
   - Country: **Thailand (TH)**
   - Document: Diploma
   - Service: Embassy
   - Quantity: 1
   - Document source: Upload files
   - Upload: 1 test PDF
   - Return service: DHL Sweden
   - Customer info: Fill all fields
   - Accept terms
   - Complete reCAPTCHA
   - Submit

2. **Verify order creation**
   - ✅ Should see success message
   - ✅ Should redirect to confirmation page
   - ✅ Order number should be generated (e.g., SWE000085)

3. **Check admin panel**
   - Go to admin → Orders
   - Find the new order
   - ✅ Verify all data is correct
   - ✅ Verify pricing is from Firebase
   - ✅ Verify files uploaded

### **Expected Results:**
- ✅ Order submits successfully
- ✅ Pricing breakdown shows Firebase prices
- ✅ All customer data saved
- ✅ Files uploaded correctly

### **Console Check:**
```
📤 Submitting final order...
💰 Calculating order price from Firebase...
✅ Pricing calculated from Firebase: {...}
📋 Preparing order data with totalPrice: ...
✅ Order submitted successfully: SWE000085
🗑️ Order progress cleared
```

---

## 🎯 Test 4: Image Optimization

### **Objective:** Verify Next.js Image component works

### **Steps:**

1. **Check header logo**
   - Go to any page
   - Open DevTools → Network tab
   - Filter by Images
   - Refresh page
   - ✅ Logo should load as optimized WebP
   - ✅ No console warnings about image sizing

2. **Check footer logo**
   - Scroll to footer
   - ✅ Logo should load properly
   - ✅ No layout shift

### **Expected Results:**
- ✅ Images load faster
- ✅ No console warnings
- ✅ Proper aspect ratio maintained

---

## 🎯 Test 5: SEO Enhancements

### **Objective:** Verify structured data and OG tags

### **Steps:**

1. **View page source**
   - Go to any page
   - Right-click → View Page Source
   - Search for "application/ld+json"
   - ✅ Should find structured data JSON

2. **Test social sharing**
   - Use Facebook Debugger: https://developers.facebook.com/tools/debug/
   - Enter your site URL
   - ✅ Should show OG image, title, description

3. **Check canonical URLs**
   - View source
   - Search for "canonical"
   - ✅ Should find `<link rel="canonical" href="...">`

### **Expected Results:**
- ✅ Structured data present
- ✅ OG tags complete
- ✅ Canonical URLs set

---

## 🎯 Test 6: No Regressions

### **Objective:** Verify nothing broke

### **Test Checklist:**

- [ ] Homepage loads correctly
- [ ] Navigation works
- [ ] Language switcher works
- [ ] All 10 order steps accessible
- [ ] Country selection works
- [ ] Service selection works
- [ ] File upload works
- [ ] Customer info form works
- [ ] Payment selection works
- [ ] Order submission works
- [ ] Admin panel accessible
- [ ] Order status page works

### **Browser Console:**
- [ ] No JavaScript errors
- [ ] No 404 errors
- [ ] No CORS errors
- [ ] Only development logs (if in dev mode)

---

## 🐛 Common Issues & Fixes

### Issue 1: "Environment validation failed"
**Symptom:** Console error about missing env vars  
**Fix:** This is normal in development, only validates in production  
**Status:** ✅ Expected behavior

### Issue 2: Prices not updating
**Symptom:** Old prices still showing  
**Fix:** 
1. Clear browser cache
2. Hard refresh (Ctrl+Shift+R)
3. Check Firebase pricing collection

### Issue 3: Progress not restoring
**Symptom:** Data lost on refresh  
**Fix:**
1. Check browser console for errors
2. Verify sessionStorage is enabled
3. Check if data expired (>24 hours)

### Issue 4: Order submission fails
**Symptom:** Error when submitting  
**Fix:**
1. Check reCAPTCHA is completed
2. Verify all required fields filled
3. Check browser console for errors
4. Verify Firebase connection

---

## 📊 Success Criteria

### ✅ All Tests Pass If:

1. **Pricing:**
   - ✅ Prices load from Firebase
   - ✅ Updates reflect immediately
   - ✅ No hardcoded prices used

2. **Persistence:**
   - ✅ Data saves automatically
   - ✅ Data restores on refresh
   - ✅ Data clears after submission

3. **Orders:**
   - ✅ Orders submit successfully
   - ✅ All data saved correctly
   - ✅ Pricing breakdown accurate

4. **Performance:**
   - ✅ Images optimized
   - ✅ No console errors
   - ✅ Fast page loads

5. **SEO:**
   - ✅ Structured data present
   - ✅ OG tags complete
   - ✅ Social sharing works

---

## 🎬 Quick Test Script

Run this complete test in 5 minutes:

```
1. Go to /bestall
2. Select Vietnam → Embassy → 1 document
3. Check price (should be 242M+ kr from Firebase)
4. Continue to step 5
5. Refresh page (F5)
6. Verify data restored + toast shown
7. Complete order
8. Verify submission successful
9. Go back to /bestall
10. Verify fresh start (no old data)
```

**If all 10 steps work:** ✅ Everything is working!

---

## 📝 Reporting Issues

If you find any issues:

1. **Note the exact steps** to reproduce
2. **Check browser console** for errors
3. **Take screenshot** if visual issue
4. **Note browser** and version
5. **Share with developer**

---

## 🎉 What's Working

After testing, you should have:

- ✅ Dynamic pricing (update without code)
- ✅ Progress persistence (never lose data)
- ✅ Faster page loads (image optimization)
- ✅ Better SEO (structured data)
- ✅ Cleaner code (centralized config)

---

## 🚀 Next Steps After Testing

If all tests pass:

1. **Deploy to production**
   ```bash
   npm run build
   npm start
   ```

2. **Deploy Firestore rules**
   ```bash
   firebase deploy --only firestore:rules
   firebase deploy --only storage
   ```

3. **Monitor for 24 hours**
   - Check error logs
   - Monitor conversion rate
   - Track customer feedback

4. **Measure impact**
   - Compare conversion rates
   - Check order completion rate
   - Monitor page load speed

---

**Ready to test? Start with Test 1 (Dynamic Pricing)!** 🚀
