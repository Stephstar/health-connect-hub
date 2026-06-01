-- Doctor weekly availability schedule
CREATE TABLE public.doctor_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID NOT NULL,
  day_of_week SMALLINT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  slot_duration_minutes INT NOT NULL DEFAULT 30 CHECK (slot_duration_minutes BETWEEN 5 AND 240),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (end_time > start_time)
);

GRANT SELECT ON public.doctor_availability TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.doctor_availability TO authenticated;
GRANT ALL ON public.doctor_availability TO service_role;

ALTER TABLE public.doctor_availability ENABLE ROW LEVEL SECURITY;

-- Anyone can read availability for verified doctors (public booking pages)
CREATE POLICY "Anyone view availability of verified doctors"
ON public.doctor_availability FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.doctors d
    WHERE d.id = doctor_availability.doctor_id
      AND (d.status = 'verified' OR d.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  )
);

-- Doctors manage their own availability
CREATE POLICY "Doctors insert own availability"
ON public.doctor_availability FOR INSERT
WITH CHECK (
  EXISTS (SELECT 1 FROM public.doctors d WHERE d.id = doctor_availability.doctor_id AND d.user_id = auth.uid())
);

CREATE POLICY "Doctors update own availability"
ON public.doctor_availability FOR UPDATE
USING (
  EXISTS (SELECT 1 FROM public.doctors d WHERE d.id = doctor_availability.doctor_id AND d.user_id = auth.uid())
);

CREATE POLICY "Doctors delete own availability"
ON public.doctor_availability FOR DELETE
USING (
  EXISTS (SELECT 1 FROM public.doctors d WHERE d.id = doctor_availability.doctor_id AND d.user_id = auth.uid())
);

-- Admins manage all
CREATE POLICY "Admins manage availability"
ON public.doctor_availability FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_doctor_availability_updated_at
BEFORE UPDATE ON public.doctor_availability
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_doctor_availability_doctor ON public.doctor_availability(doctor_id, day_of_week);

-- Hard guarantee against double-booking the same doctor/date/time for active appointments
CREATE UNIQUE INDEX uniq_appointment_slot_active
ON public.appointments(doctor_id, appointment_date, appointment_time)
WHERE status IN ('upcoming', 'pending');
