-- SQL Migration: Create private_inquiries Table & Resend Email Integration Trigger
-- Description: Stores multi-section event planning questionnaires submitted from /private-inquiry

CREATE TABLE IF NOT EXISTS public.private_inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  date TEXT NOT NULL,
  type TEXT NOT NULL,
  child_name TEXT,
  child_age TEXT,
  gender TEXT,
  bride_groom TEXT,
  venue_name TEXT,
  venue_address TEXT,
  venue_setting TEXT,
  venue_booked TEXT,
  event_timing TEXT,
  setup_time TEXT,
  venue_contact TEXT,
  guests TEXT,
  adults_count TEXT,
  kids_0to3 TEXT,
  kids_4to8 TEXT,
  kids_9plus TEXT,
  theme TEXT,
  colours TEXT,
  inspiration_photo TEXT,
  decor_elements JSONB DEFAULT '[]',
  custom_name_logo TEXT,
  entertainment_options JSONB DEFAULT '[]',
  entertainment_other TEXT,
  meal_type TEXT,
  dietary_type TEXT,
  catering_count TEXT,
  catering_addons JSONB DEFAULT '[]',
  catering_other TEXT,
  cake_status TEXT,
  cake_flavour TEXT,
  cake_weight TEXT,
  cake_reference TEXT,
  media_options JSONB DEFAULT '[]',
  gifts_needed TEXT,
  gift_budget TEXT,
  budget TEXT,
  decision_maker TEXT,
  confirmation_timeline TEXT,
  spoken_other_planners TEXT,
  special_requests TEXT,
  full_summary TEXT,
  status TEXT NOT NULL DEFAULT 'new inquiry'
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.private_inquiries ENABLE ROW LEVEL SECURITY;

-- Allow anonymous visitors to submit private inquiry questionnaires
DROP POLICY IF EXISTS "Allow public insert to private_inquiries" ON public.private_inquiries;
CREATE POLICY "Allow public insert to private_inquiries"
  ON public.private_inquiries
  FOR INSERT
  WITH CHECK (true);

-- Allow authenticated admin users to view & update inquiries
DROP POLICY IF EXISTS "Allow authenticated read to private_inquiries" ON public.private_inquiries;
CREATE POLICY "Allow authenticated read to private_inquiries"
  ON public.private_inquiries
  FOR SELECT
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow authenticated update to private_inquiries" ON public.private_inquiries;
CREATE POLICY "Allow authenticated update to private_inquiries"
  ON public.private_inquiries
  FOR UPDATE
  USING (auth.role() = 'authenticated');
