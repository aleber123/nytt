# Admin User Setup Guide

## 🚨 IMPORTANT: Admin User Required

Your Firestore rules now require authentication and admin permissions. You **must** set up an admin user to access the admin panel.

## 📋 Step-by-Step Setup

### Step 1: Create Admin User in Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `legapp-2720a`
3. Go to **Authentication** → **Users**
4. Click **"Add user"**
5. Create an admin account:
   - **Email**: `admin@legaliseringstjanst.se` (or your preferred admin email)
   - **Password**: Choose a strong password
   - **Email verified**: ✅ Check this box
6. Click **"Add user"**
7. **Copy the User UID** from the users table (you'll need this)

### Step 2: Download Service Account Key

1. In Firebase Console, go to **Project Settings** → **Service accounts**
2. Click **"Generate new private key"**
3. Download the JSON file
4. Save it as `scripts/service-account-key.json` in your project

### Step 3: Set Admin Custom Claims

#### Option A: Use the Setup Script (Recommended)

```bash
cd scripts
node setup-admin-user.js
```

#### Option B: Manual Setup with Firebase CLI

```bash
# Install Firebase CLI if not already installed
npm install -g firebase-tools

# Login to Firebase
firebase login

# Set admin custom claims
firebase functions:shell
```

Then in the Firebase shell:
```javascript
admin.auth().setCustomUserClaims('YOUR_USER_UID_HERE', {isAdmin: true})
```

#### Option C: Direct UID Method

If you know the User UID:
```bash
node scripts/setup-admin-user.js by-uid YOUR_USER_UID_HERE
```

### Step 4: Verify Admin Setup

1. Go to your admin login page: `http://localhost:3001/admin/login`
2. Login with your admin credentials
3. You should now be able to access `http://localhost:3001/admin/orders`
4. The "Missing or insufficient permissions" error should be gone

## 🔍 Troubleshooting

### Still getting permission errors?

1. **Check if user is authenticated**: Make sure you're logged in
2. **Verify custom claims**: The user must have `isAdmin: true`
3. **Check Firestore rules**: Rules require `request.auth.token.isAdmin == true`

### Can't find User UID?

1. Go to Firebase Console → Authentication → Users
2. Find your admin user
3. Click on the user to see the UID

### Service account key issues?

- Make sure the JSON file is in `scripts/service-account-key.json`
- Verify the file has the correct permissions (readable)
- Check that the service account has admin privileges

## 🔐 Security Notes

- Admin users have full access to all orders
- Regular users can only access their own orders
- Anonymous users cannot create orders (requires authentication)
- All operations are logged in Firebase

## 📞 Support

If you continue having issues:
1. Check browser console for detailed error messages
2. Verify Firebase project configuration
3. Ensure Firestore rules are deployed correctly

---

**Once admin is set up, your order system will work perfectly!** 🎉