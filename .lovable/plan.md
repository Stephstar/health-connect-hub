# Health Connect Hub — Execution Plan

Goal: close the gaps identified in the analysis and ship a production-grade telemedicine SaaS without breaking any working flow. Work proceeds in small, verifiable chunks. Each chunk: schema → backend/context → UI → manual test. Nothing in later chunks touches code from earlier chunks except by additive changes.

---

## Guardrails (apply to every chunk)

- Never edit `src/integrations/supabase/{client,types}.ts` or `.env`.
- Every new `public` table ships with GRANTs, RLS enable, and policies in the same migration.
- All new colors/styling use semantic tokens in `index.css` / `tailwind.config.ts`.
- Each chunk ends with: build passes, target page loads, primary happy-path verified in preview.
- No rewrites of working components — additive edits only.

---

## Phase 1 — Core Booking Integrity (highest ROI, unblocks everything else)

### Chunk 1.1 — Doctor Availability Schema
- Migration: `doctor_availability(id, doctor_id, day_of_week 0-6, start_time, end_time, slot_duration_minutes default 30)` + GRANTs + RLS (doctors manage own; anyone can read for verified doctors).
- Migration: unique constraint on `(doctor_id, appointment_date, appointment_time)` for non-cancelled appointments via partial unique index — hard guarantee against double-booking.

### Chunk 1.2 — Doctor Availability Management UI
- New page section in `DoctorSettings.tsx`: weekly schedule editor (add/remove time blocks per weekday, slot length).
- Persist to `doctor_availability`.

### Chunk 1.3 — Slot-Aware Booking
- Extend `AppContext.checkSlotAvailability` to compute slots from `doctor_availability` for a chosen date, subtract already-booked `appointments`.
- `AppointmentBooking.tsx`: replace static time grid with dynamically generated, real-time slot list. Disable taken slots.
- Confirm reschedule dialog uses the same generator.

### Chunk 1.4 — Doctor Profile Enhancements
- Doctor detail card on booking page shows bio, languages, years of experience, average rating placeholder, credentials section (read from `doctors`).

---

## Phase 2 — Real Video Consultation (Jitsi)

### Chunk 2.1 — Jitsi Integration
- Add `@jitsi/react-sdk`.
- New component `JitsiRoom.tsx` with a deterministic room name `hch-<appointmentId>`, display name from `useAuth`, JWT-less public meet.jit.si default.
- Replace the mock video panel in `ConsultationPage.tsx` left side with `JitsiRoom`. Keep all existing right-side clinical sidebar code untouched.

### Chunk 2.2 — Consultation Lifecycle
- Auto-mark appointment `in_progress` on Jitsi `videoConferenceJoined`, prompt `Complete & Prescribe` on hangup.
- Persist call duration into `medical_records.data` when the consultation closes.

---

## Phase 3 — Payments

### Chunk 3.1 — Provider Decision & Setup
- Use Lovable's recommended payment connector (Stripe-first for cards; ask if user prefers Flutterwave for Mobile Money). Configure via payments tool.
- Edge function `create-checkout` returns a Stripe Checkout URL for an invoice.

### Chunk 3.2 — Patient Pay Flow
- `BillingDashboard.tsx`: "Pay now" button on pending invoices opens checkout in new tab.
- Edge function `stripe-webhook` (verify_jwt=false) marks `invoices.status='paid'`, sets `paid_at`, writes notification.
- Booking flow: after successful booking, push patient to pay immediately for video consults.

---

## Phase 4 — Trust & Clinical Extras

### Chunk 4.1 — Ratings & Reviews
- Migration: `ratings(doctor_id, patient_id, appointment_id, rating 1-5, comment)` + GRANTs + RLS (patient writes only if their appointment is `completed`; anyone reads).
- Trigger or app-side recompute of `doctors.rating` / `reviews_count` after insert.
- Post-consultation modal asks patient for rating; doctor profile shows reviews list.

### Chunk 4.2 — Lab Results Upload
- New Supabase Storage bucket `lab-results` (private, signed URLs).
- Migration: `lab_results(patient_id, doctor_id, file_url, file_name, test_type, test_date)`.
- UI in `MedicalRecords.tsx`: patient upload; doctor view via existing patient-records link.

### Chunk 4.3 — Follow-up Appointments
- In `PrescriptionDialog.tsx` add optional "Suggest follow-up" date.
- Stored on the medical record; patient dashboard surfaces a "Book follow-up" CTA that prefills booking.

---

## Phase 5 — Notifications

### Chunk 5.1 — Transactional Email (Resend)
- Add `RESEND_API_KEY` via secrets tool.
- Edge function `send-email` + DB triggers (or app-side calls) for: appointment confirmed, rescheduled, cancelled, prescription issued, invoice paid.
- Log to `notification_logs` table.

### Chunk 5.2 — Email Verification on Signup
- Turn off auto-confirm in auth config; ensure `SignupPage` shows "check your email" state and `LoginPage` handles unverified users gracefully.

### Chunk 5.3 — (Optional) SMS / Push
- Twilio SMS for 3h-before reminders (cron edge function), OneSignal web push for new messages. Behind opt-in toggles in `SettingsPage`.

---

## Phase 6 — Hardening

- Run `supabase--linter` and `security--run_security_scan`, resolve findings.
- E2E sanity passes for the three core journeys (patient book→pay→consult; doctor consult→prescribe; admin verify doctor).
- Enable HIBP password check.

---

## Technical Notes

- Phases 1-3 are the critical path; everything else is additive and safe to defer.
- Each chunk maps to one user message ideally; I'll ask before starting destructive or wide-reaching work (payments provider choice, auto-confirm change).
- No existing file gets rewritten — edits are minimal and located, preserving the current dashboards, contexts, and routing.

Start with Chunk 1.1?
