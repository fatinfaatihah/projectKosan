import {
  isOwnerLoggedIn as checkLoggedIn,
  getOwnerSession,
  loginOwnerLocal,
  logoutOwnerLocal,
} from '../lib/storage.js';
import { toast } from './toast.js';

let authListeners = [];

export function onAuthStateChanged(callback) {
  authListeners.push(callback);
}

function notifyAuthState(user, profile) {
  authListeners.forEach((fn) => {
    try {
      fn(user, profile);
    } catch (e) {
      console.error('Error in auth state listener:', e);
    }
  });
}

/**
 * Login Pemilik Kos Sederhana (Lokal tanpa backend)
 */
export async function loginOwner(email, password) {
  const cleanEmail = email ? email.trim() : 'owner@kostputriwinda.com';
  const session = loginOwnerLocal(cleanEmail, 'Pemilik KostPutriWinda');
  notifyAuthState(session.user, { role: 'owner' });
  return session;
}

/**
 * Tombol Cepat: Masuk Mode Demo Langsung
 */
export function loginDemoOwner() {
  const session = loginOwnerLocal('demo.owner@kostputriwinda.com', 'Pemilik Kos (Mode Demo)');
  notifyAuthState(session.user, { role: 'owner' });
  return session;
}

/**
 * Registrasi Pemilik Lokal
 */
export async function registerOwner(fullName, email, password) {
  const cleanEmail = email ? email.trim() : 'owner@kostputriwinda.com';
  const cleanName = fullName ? fullName.trim() : 'Pemilik Kos';
  const session = loginOwnerLocal(cleanEmail, cleanName);
  notifyAuthState(session.user, { role: 'owner' });
  return {
    user: session.user,
    role: 'owner',
    needsEmailConfirmation: false,
  };
}

/**
 * Logout Pemilik
 */
export async function logoutOwner() {
  logoutOwnerLocal();
  notifyAuthState(null, null);
  toast.info('Anda telah keluar dari Dashboard Pemilik.');
}

/**
 * Inisialisasi status sesi saat halaman dimuat
 */
export async function initAuth() {
  if (checkLoggedIn()) {
    const session = getOwnerSession();
    if (session && session.user) {
      notifyAuthState(session.user, { role: 'owner' });
    } else {
      notifyAuthState(null, null);
    }
  } else {
    notifyAuthState(null, null);
  }
}

export function getCurrentUser() {
  const session = getOwnerSession();
  return session ? session.user : null;
}

export function getCurrentProfile() {
  return isOwnerLoggedIn() ? { role: 'owner' } : null;
}

export function isOwnerLoggedIn() {
  return checkLoggedIn();
}
