/**
 * Admin Authentication Middleware
 * 
 * Verifies that API requests come from authenticated admin users.
 * Uses Firebase Admin SDK to verify ID tokens and check admin roles.
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { getAdminAuth, getAdminDb } from './firebaseAdmin';
import { getClientIp, rateLimiters } from './rateLimit';
import { ROLE_PERMISSIONS, type UserRole, type Permission } from '@/firebase/userService';

export interface AdminAuthResult {
  uid: string;
  email: string;
  role: string;
}

/**
 * Verify that the request comes from an authenticated admin user.
 * Extracts the Firebase ID token from the Authorization header,
 * verifies it, and checks that the user exists in the adminUsers collection.
 * 
 * Returns the admin user info if valid, or sends an error response and returns null.
 */
export async function verifyAdmin(
  req: NextApiRequest,
  res: NextApiResponse,
  rateLimiter: 'admin' | 'adminUpload' | 'adminEmail' | 'gdpr' = 'admin'
): Promise<AdminAuthResult | null> {
  // Rate limit check before auth (prevents brute-force token guessing)
  const ip = getClientIp(req);
  const rl = rateLimiters[rateLimiter](ip);
  if (!rl.success) {
    res.status(429).json({ error: 'Too many requests', retryAfter: rl.resetIn });
    return null;
  }

  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or invalid authorization header' });
    return null;
  }

  const token = authHeader.split('Bearer ')[1];

  try {
    // Verify the Firebase ID token
    const auth = getAdminAuth();
    const decodedToken = await auth.verifyIdToken(token);
    
    if (!decodedToken.email) {
      res.status(401).json({ error: 'Token does not contain an email' });
      return null;
    }

    // Check that the user exists in adminUsers collection and is active
    const db = getAdminDb();
    const adminUsersRef = db.collection('adminUsers');
    const snapshot = await adminUsersRef.where('email', '==', decodedToken.email.toLowerCase()).get();

    if (snapshot.empty) {
      res.status(403).json({ error: 'User is not an admin' });
      return null;
    }

    const adminUser = snapshot.docs[0].data();

    if (!adminUser.isActive) {
      res.status(403).json({ error: 'Admin account is deactivated' });
      return null;
    }

    return {
      uid: decodedToken.uid,
      email: decodedToken.email,
      role: adminUser.role || 'viewer'
    };
  } catch (error: any) {
    if (error.code === 'auth/id-token-expired') {
      res.status(401).json({ error: 'Token expired' });
    } else if (error.code === 'auth/argument-error') {
      res.status(401).json({ error: 'Invalid token' });
    } else {
      res.status(401).json({ error: 'Authentication failed' });
    }
    return null;
  }
}

/**
 * Check if an admin has a specific permission based on their role.
 * Returns true if permitted, or sends a 403 response and returns false.
 *
 * Usage in API routes:
 *   const admin = await verifyAdmin(req, res);
 *   if (!admin) return;
 *   if (!requirePermission(admin, res, 'canManagePricing')) return;
 */
export function requirePermission(
  admin: AdminAuthResult,
  res: NextApiResponse,
  permission: Permission
): boolean {
  const role = admin.role as UserRole;
  const perms = ROLE_PERMISSIONS[role];

  if (!perms || !perms[permission]) {
    res.status(403).json({
      error: 'Insufficient permissions',
      required: permission,
      role: admin.role,
    });
    return false;
  }

  return true;
}

/**
 * Check if an admin has ANY of the specified permissions.
 * Useful for read endpoints where multiple roles should have access.
 */
export function requireAnyPermission(
  admin: AdminAuthResult,
  res: NextApiResponse,
  permissions: Permission[]
): boolean {
  const role = admin.role as UserRole;
  const perms = ROLE_PERMISSIONS[role];

  if (!perms || !permissions.some(p => perms[p])) {
    res.status(403).json({
      error: 'Insufficient permissions',
      required: permissions,
      role: admin.role,
    });
    return false;
  }

  return true;
}
