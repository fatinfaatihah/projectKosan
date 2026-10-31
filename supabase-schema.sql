-- ==============================================================================
-- DATABASE SCHEMA & ROW LEVEL SECURITY (RLS) FOR KOSTPUTRIWINDA
-- ==============================================================================
-- Jalankan skrip SQL ini di Supabase SQL Editor:
-- 1. Masuk ke https://supabase.com -> Buka Project Anda -> Pilih menu "SQL Editor"
-- 2. Buat "New Query", paste skrip ini, lalu klik "RUN".
-- ==============================================================================

-- 1. TABEL PROFILES
-- Role yang didukung:
-- - 'owner'         : Pemilik aktif (sudah disetujui admin, memiliki akses penuh ke dashboard)
-- - 'owner_pending' : Pendaftar pemilik baru (menunggu persetujuan admin, BELUM boleh akses data)
-- - 'tenant'        : Calon penyewa / pengguna umum
-- - 'admin'         : Administrator sistem
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'owner_pending' CHECK (role IN ('owner', 'owner_pending', 'tenant', 'admin')),
  full_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. TABEL ROOMS (Katalog Kamar Kos)
CREATE TABLE IF NOT EXISTS public.rooms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  price_per_month NUMERIC NOT NULL CHECK (price_per_month >= 0),
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'occupied', 'maintenance')),
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. TABEL BOOKINGS (Pengajuan Pemesanan Calon Penyewa)
CREATE TABLE IF NOT EXISTS public.bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID REFERENCES public.rooms(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  whatsapp_number TEXT NOT NULL,
  check_in_date DATE NOT NULL,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indeks performa query
CREATE INDEX IF NOT EXISTS idx_rooms_status ON public.rooms(status);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_room_id ON public.bookings(room_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- ==============================================================================
-- 4. AKTIFKAN ROW LEVEL SECURITY (RLS)
-- ==============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Helper function: Cek apakah pengguna saat ini berstatus owner AKTIF
CREATE OR REPLACE FUNCTION public.is_owner()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'owner'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper function: Cek apakah pengguna saat ini berstatus admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ------------------------------------------------------------------------------
-- PENCEGAHAN PRIVILEGE ESCALATION (Mencegah Pengguna Mengubah Role Sendiri)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.protect_profile_role()
RETURNS TRIGGER AS $$
BEGIN
  -- Jika ada percobaan mengubah kolom 'role'
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    -- Hanya PostgreSQL superuser/service_role atau user dengan role 'admin' yang berhak mengubah role
    IF auth.role() = 'authenticated' AND NOT public.is_admin() THEN
      RAISE EXCEPTION 'Akses ditolak: Anda tidak memiliki izin untuk mengubah role akun Anda sendiri.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_protect_profile_role ON public.profiles;
CREATE TRIGGER trg_protect_profile_role
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_profile_role();

-- ------------------------------------------------------------------------------
-- KEBIJAKAN KEAMANAN (RLS POLICIES) TABEL PROFILES
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Pengguna dapat membaca profil sendiri" ON public.profiles;
CREATE POLICY "Pengguna dapat membaca profil sendiri"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Owner dan Admin dapat membaca seluruh profil" ON public.profiles;
CREATE POLICY "Owner dan Admin dapat membaca seluruh profil"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (public.is_owner() OR public.is_admin());

DROP POLICY IF EXISTS "Pengguna dapat mengupdate profil sendiri" ON public.profiles;
CREATE POLICY "Pengguna dapat mengupdate profil sendiri"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ------------------------------------------------------------------------------
-- KEBIJAKAN KEAMANAN (RLS POLICIES) TABEL ROOMS
-- ------------------------------------------------------------------------------
-- Calon penyewa & publik boleh melihat kamar
DROP POLICY IF EXISTS "Publik dapat melihat kamar" ON public.rooms;
CREATE POLICY "Publik dapat melihat kamar"
  ON public.rooms FOR SELECT
  TO public
  USING (true);

-- Hanya pemilik AKTIF (role = 'owner') yang boleh menambah, mengedit, dan menghapus kamar
-- (Akun 'owner_pending' atau 'tenant' DITOLAK oleh RLS)
DROP POLICY IF EXISTS "Owner dapat menambah kamar" ON public.rooms;
CREATE POLICY "Owner dapat menambah kamar"
  ON public.rooms FOR INSERT
  TO authenticated
  WITH CHECK (public.is_owner());

DROP POLICY IF EXISTS "Owner dapat mengedit kamar" ON public.rooms;
CREATE POLICY "Owner dapat mengedit kamar"
  ON public.rooms FOR UPDATE
  TO authenticated
  USING (public.is_owner())
  WITH CHECK (public.is_owner());

DROP POLICY IF EXISTS "Owner dapat menghapus kamar" ON public.rooms;
CREATE POLICY "Owner dapat menghapus kamar"
  ON public.rooms FOR DELETE
  TO authenticated
  USING (public.is_owner());

-- ------------------------------------------------------------------------------
-- KEBIJAKAN KEAMANAN (RLS POLICIES) TABEL BOOKINGS
-- ------------------------------------------------------------------------------
-- Publik dapat mengirim formulir pemesanan
DROP POLICY IF EXISTS "Publik dapat membuat pemesanan" ON public.bookings;
CREATE POLICY "Publik dapat membuat pemesanan"
  ON public.bookings FOR INSERT
  TO public
  WITH CHECK (true);

-- Hanya pemilik AKTIF (role = 'owner') yang boleh melihat, mengedit status, atau menghapus pemesanan
-- (Akun 'owner_pending' atau 'tenant' DITOLAK oleh RLS)
DROP POLICY IF EXISTS "Owner dapat melihat seluruh pemesanan" ON public.bookings;
CREATE POLICY "Owner dapat melihat seluruh pemesanan"
  ON public.bookings FOR SELECT
  TO authenticated
  USING (public.is_owner());

DROP POLICY IF EXISTS "Owner dapat mengupdate status pemesanan" ON public.bookings;
CREATE POLICY "Owner dapat mengupdate status pemesanan"
  ON public.bookings FOR UPDATE
  TO authenticated
  USING (public.is_owner())
  WITH CHECK (public.is_owner());

DROP POLICY IF EXISTS "Owner dapat menghapus pemesanan" ON public.bookings;
CREATE POLICY "Owner dapat menghapus pemesanan"
  ON public.bookings FOR DELETE
  TO authenticated
  USING (public.is_owner());

-- ==============================================================================
-- 5. TRIGGER PENDAFTARAN USER BARU (AUTH.USERS -> PUBLIC.PROFILES)
-- ==============================================================================
-- Setiap pendaftar baru dari web secara default berstatus 'owner_pending'
-- TIDAK PERNAH langsung menjadi 'owner' aktif tanpa persetujuan admin.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_requested_role TEXT;
  v_assigned_role TEXT;
BEGIN
  v_requested_role := LOWER(COALESCE(new.raw_user_meta_data->>'requested_role', 'owner'));

  -- Tentukan role awal yang aman
  IF v_requested_role = 'tenant' THEN
    v_assigned_role := 'tenant';
  ELSE
    -- Semua pendaftaran pemilik masuk sebagai 'owner_pending'
    v_assigned_role := 'owner_pending';
  END IF;

  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    v_assigned_role
  )
  ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email,
      full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
      updated_at = timezone('utc'::text, now());

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- 6. PROSEDUR PERSETUJUAN ADMIN UNTUK MENGAKTIFKAN PEMILIK (APPROVAL)
-- ==============================================================================

-- Fungsi SQL untuk menyetujui akun pemilik baru:
CREATE OR REPLACE FUNCTION public.approve_owner(target_email TEXT)
RETURNS TEXT AS $$
DECLARE
  v_count INT;
BEGIN
  UPDATE public.profiles
  SET role = 'owner', updated_at = timezone('utc'::text, now())
  WHERE email = LOWER(TRIM(target_email)) AND role = 'owner_pending';

  GET DIAGNOSTICS v_count = ROW_COUNT;

  IF v_count = 0 THEN
    RETURN 'Tidak ada akun dengan email ' || target_email || ' yang berstatus owner_pending.';
  END IF;

  RETURN 'Sukses! Akun ' || target_email || ' berhasil disetujui menjadi pemilik aktif (owner).';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================================================
-- PANDUAN ADMINISTRATOR: CARA MENYETUJUI PEMILIK BARU DI SUPABASE
-- ==============================================================================
-- 
-- 1. Melihat daftar calon pemilik yang menunggu persetujuan:
--    SELECT id, email, full_name, role, created_at 
--    FROM public.profiles 
--    WHERE role = 'owner_pending'
--    ORDER BY created_at DESC;
--
-- 2. Menyetujui calon pemilik menggunakan fungsi aman:
--    SELECT public.approve_owner('email_pemilik@example.com');
--
--    Atau menggunakan query update langsung:
--    UPDATE public.profiles
--    SET role = 'owner', updated_at = now()
--    WHERE email = 'email_pemilik@example.com' AND role = 'owner_pending';
--
-- 3. Menolak / Mengembalikan calon pemilik ke role tenant:
--    UPDATE public.profiles
--    SET role = 'tenant', updated_at = now()
--    WHERE email = 'email_pemilik@example.com';
-- ==============================================================================
