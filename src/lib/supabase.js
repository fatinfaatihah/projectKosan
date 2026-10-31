/**
 * SHIM KOMPATIBILITAS
 * Mengarahkan seluruh utilitas ke penyimpanan Browser LocalStorage murni.
 * Tidak ada lagi ketergantungan pada backend atau Supabase.
 */
export * from './storage.js';

export const isSupabaseConfigured = () => true;
export const OWNER_WHATSAPP = '6281234567890';
