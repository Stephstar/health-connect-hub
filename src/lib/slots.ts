import { supabase } from '@/integrations/supabase/client';

export function formatSlot12h(h: number, m: number): string {
  const period = h >= 12 ? 'PM' : 'AM';
  const hh = h % 12 === 0 ? 12 : h % 12;
  return `${hh}:${m.toString().padStart(2, '0')} ${period}`;
}

function parseHHMM(t: string): [number, number] {
  const [h, m] = t.split(':').map(Number);
  return [h, m];
}

/** Returns slot strings (e.g. "9:00 AM") available for doctor on a given ISO date. */
export async function getAvailableSlots(doctorId: string, isoDate: string, excludeAppointmentId?: string): Promise<string[]> {
  const dow = new Date(isoDate + 'T00:00:00').getDay();

  const { data: blocks } = await supabase
    .from('doctor_availability')
    .select('start_time, end_time, slot_duration_minutes')
    .eq('doctor_id', doctorId)
    .eq('day_of_week', dow);

  if (!blocks || blocks.length === 0) return [];

  let q = supabase
    .from('appointments')
    .select('id, appointment_time')
    .eq('doctor_id', doctorId)
    .eq('appointment_date', isoDate)
    .in('status', ['upcoming', 'pending']);
  if (excludeAppointmentId) q = q.neq('id', excludeAppointmentId);
  const { data: booked } = await q;
  const takenSet = new Set((booked || []).map(b => b.appointment_time));

  const all: string[] = [];
  for (const b of blocks) {
    const [sh, sm] = parseHHMM(b.start_time);
    const [eh, em] = parseHHMM(b.end_time);
    let cur = sh * 60 + sm;
    const end = eh * 60 + em;
    const dur = b.slot_duration_minutes || 30;
    while (cur + dur <= end) {
      const h = Math.floor(cur / 60);
      const m = cur % 60;
      const label = formatSlot12h(h, m);
      if (!takenSet.has(label)) all.push(label);
      cur += dur;
    }
  }
  // De-dupe (overlapping blocks)
  return Array.from(new Set(all));
}
