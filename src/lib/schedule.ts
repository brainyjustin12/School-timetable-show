// School schedule generator: 8:10 → 17:00, 40-min slots, with breaks.

export type Slot = {
  index: number; // 1-based, only for teaching slots
  start: string; // "HH:MM"
  end: string;   // "HH:MM"
  type: "session" | "break";
  label?: string;
};

const BREAKS: { start: string; end: string; label: string }[] = [
  { start: "10:10", end: "10:25", label: "Morning Break" },
  { start: "12:25", end: "13:30", label: "Lunch Break" },
  { start: "15:30", end: "15:40", label: "Short Break" },
];

const DAY_START = "08:10";
const DAY_END = "17:00";
const SESSION_MIN = 40;

const toMin = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};
const toHHMM = (m: number) => {
  const h = Math.floor(m / 60).toString().padStart(2, "0");
  const mm = (m % 60).toString().padStart(2, "0");
  return `${h}:${mm}`;
};

export function buildDaySlots(): Slot[] {
  const out: Slot[] = [];
  let cur = toMin(DAY_START);
  const end = toMin(DAY_END);
  let sessionIdx = 0;

  while (cur < end) {
    // Check if a break starts at or before cur
    const brk = BREAKS.find((b) => toMin(b.start) <= cur && toMin(b.end) > cur);
    if (brk) {
      out.push({ index: 0, start: toHHMM(cur), end: brk.end, type: "break", label: brk.label });
      cur = toMin(brk.end);
      continue;
    }
    // Find next break
    const nextBreak = BREAKS
      .map((b) => toMin(b.start))
      .filter((s) => s > cur)
      .sort((a, b) => a - b)[0] ?? end;
    const slotEnd = Math.min(cur + SESSION_MIN, nextBreak, end);
    if (slotEnd - cur < SESSION_MIN) {
      // Not enough room before next break — skip filler
      cur = slotEnd;
      continue;
    }
    sessionIdx += 1;
    out.push({ index: sessionIdx, start: toHHMM(cur), end: toHHMM(slotEnd), type: "session" });
    cur = slotEnd;
  }
  return out;
}

export function getCurrentSlot(now: Date = new Date()): Slot | null {
  const slots = buildDaySlots();
  const m = now.getHours() * 60 + now.getMinutes();
  return slots.find((s) => toMin(s.start) <= m && m < toMin(s.end)) ?? null;
}

export function getDayOfWeek(now: Date = new Date()): number {
  // 1 = Monday … 7 = Sunday
  const d = now.getDay();
  return d === 0 ? 7 : d;
}

export const DAY_NAMES = ["", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
