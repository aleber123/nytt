# 🧹 Cleanup Instructions for bestall.tsx

## Current Status

**File size:** 3,688 rader  
**With dead code:** ~837 rader av gamla render-funktioner som inte används

## What to Delete

Delete these OLD render functions (they're replaced by components):

### 1. renderQuestion1 (lines ~1086-1225)
**Replaced by:** `Step1CountrySelection` component  
**Status:** ✅ Component working

### 2. renderQuestion2 (lines ~1227-1269)
**Replaced by:** `Step2DocumentType` component  
**Status:** ✅ Component working

### 3. renderQuestion3 (lines ~1271-1443)
**Replaced by:** `Step3ServicesSelection` component  
**Status:** ✅ Component working

### 4. renderQuestion4 (lines ~1445-1493)
**Replaced by:** `Step4Quantity` component  
**Status:** ✅ Component working

### 5. renderQuestion5 (lines ~1495-1579)
**Replaced by:** `Step5DocumentSource` component  
**Status:** ✅ Component working

### 6. renderQuestion6 (lines ~1581-1676)
**Replaced by:** `Step6PickupService` component  
**Status:** ✅ Component working

### 7. renderQuestion8 (lines ~1940-2031)
**Replaced by:** `Step8ScannedCopies` component  
**Status:** ✅ Component working

### 8. renderQuestion9 (lines ~2034-2192)
**Replaced by:** `Step9ReturnService` component  
**Status:** ✅ Component working

## ⚠️ KEEP These Functions

### ✅ renderQuestion7
**Why:** Complex conditional logic, kept inline  
**Lines:** ~1678-1937

### ✅ renderQuestion10  
**Why:** Very complex (~1000 lines), kept inline  
**Lines:** ~2195-end

## Expected Result

**After cleanup:**
- **Current:** 3,688 lines
- **After:** ~2,850 lines
- **Reduction:** ~838 lines (23% smaller)

## How to Delete Safely

### Option 1: Manual (Safest)
1. Test application first
2. Verify all steps 1-6, 8-9 work
3. Then manually delete each function
4. Test again after deletion

### Option 2: Automated (Faster but risky)
```bash
# Backup first!
cp src/pages/bestall.tsx src/pages/bestall.tsx.backup

# Use sed or similar to remove lines
# (specific commands depend on exact line numbers)
```

### Option 3: Wait
- Keep old functions as backup
- Delete after more testing
- No harm in keeping them (just extra code)

## Recommendation

**Test first, then delete!**

1. ✅ Test Steps 1-9 thoroughly
2. ✅ Verify all functionality works
3. ✅ Then delete old functions
4. ✅ Test again
5. ✅ Commit

---

**Created:** November 18, 2025  
**Status:** Ready for cleanup after testing
