import type { ChallengeDayRecord, ChallengeDayStatus, Checklist, ChecklistItem } from "@/src/types";

const challengeTemplates = [
  "No Sugar (30 Days)",
  "Internship Tasks",
  "Packing List",
  "Vacation Checklist",
];

const DAY_IN_MS = 86_400_000;

export function createChecklist(title?: string, startDate = getTodayKey(), durationDays = 30): Checklist {
  const now = Date.now();

  return {
    id: crypto.randomUUID(),
    title: title?.trim() || nextTemplateTitle(),
    archived: false,
    startDate,
    durationDays: Math.max(1, Math.round(durationDays)),
    dayRecords: [],
    items: [],
    createdAt: now,
    updatedAt: now,
  };
}

export function createItem(text: string): ChecklistItem {
  const now = Date.now();

  return {
    id: crypto.randomUUID(),
    text: text.trim(),
    completed: false,
    createdAt: now,
    updatedAt: now,
  };
}

export function getProgress(checklist: Checklist) {
  const total = getDurationDays(checklist);
  const completed = getDayRecords(checklist).filter((record) => record.status === "complete").length;
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100);

  return { completed, total, percent };
}

export function isChecklistComplete(checklist: Checklist) {
  const durationDays = getDurationDays(checklist);
  return getDayRecords(checklist).filter((record) => record.status === "complete").length >= durationDays;
}

export function withChecklistUpdate(checklist: Checklist): Checklist {
  return {
    ...checklist,
    updatedAt: Date.now(),
  };
}

export function withItemUpdate(item: ChecklistItem): ChecklistItem {
  return {
    ...item,
    updatedAt: Date.now(),
  };
}

export function normalizeChecklist(checklist: Checklist): Checklist {
  const durationDays = getDurationDays(checklist);

  return {
    ...checklist,
    startDate: checklist.startDate ?? toDateKey(new Date(checklist.createdAt)),
    durationDays,
    dayRecords: getDayRecords(checklist).slice(0, durationDays),
  };
}

export function markChallengeDay(
  checklist: Checklist,
  date: string,
  status: ChallengeDayStatus,
): Checklist {
  const dayRecords = getDayRecords(checklist);

  if (dayRecords.some((record) => record.date === date)) {
    return checklist;
  }

  return withChecklistUpdate({
    ...normalizeChecklist(checklist),
    dayRecords: [...dayRecords, createDayRecord(date, status)],
  });
}

export function setChallengeDay(
  checklist: Checklist,
  date: string,
  status: ChallengeDayStatus,
): Checklist {
  const dayRecords = getDayRecords(checklist);
  const nextRecord = createDayRecord(date, status);
  const hasRecord = dayRecords.some((record) => record.date === date);

  return withChecklistUpdate({
    ...normalizeChecklist(checklist),
    dayRecords: hasRecord
      ? dayRecords.map((record) => (record.date === date ? nextRecord : record))
      : [...dayRecords, nextRecord],
  });
}

export function getChallengeStats(checklist: Checklist, todayKey = getTodayKey()) {
  const normalized = normalizeChecklist(checklist);
  const startDate = normalized.startDate ?? todayKey;
  const durationDays = getDurationDays(normalized);
  const endDate = toDateKey(addDays(parseDateKey(startDate), durationDays - 1));
  const todayIndex = diffInDays(startDate, todayKey);
  const currentDay =
    todayIndex < 0 ? 0 : todayIndex >= durationDays ? durationDays : todayIndex + 1;
  const records = getDayRecords(normalized);
  const completed = records.filter((record) => record.status === "complete").length;
  const missed = records.filter((record) => record.status === "missed").length;
  const percent = Math.round((completed / durationDays) * 100);
  const status = getChallengeStatus(normalized, todayKey);
  const daysRemaining = Math.max(0, durationDays - Math.max(currentDay, completed + missed));
  const successRate = completed + missed === 0 ? 0 : Math.round((completed / (completed + missed)) * 100);
  const currentStreak = getCurrentStreak(records, startDate, todayKey, durationDays);

  return {
    completed,
    currentDay,
    currentStreak,
    daysRemaining,
    durationDays,
    endDate,
    missed,
    percent,
    startDate,
    status,
    successRate,
  };
}

export function getDayRecord(checklist: Checklist, date: string) {
  return getDayRecords(checklist).find((record) => record.date === date);
}

export function getDayRecords(checklist: Checklist): ChallengeDayRecord[] {
  return checklist.dayRecords ?? legacyRecordsFromItems(checklist);
}

export function getDurationDays(checklist: Checklist) {
  return Math.max(1, checklist.durationDays ?? (checklist.items.length || 30));
}

export function matchesQuery(checklist: Checklist, query: string) {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return true;
  }

  return (
    checklist.title.toLowerCase().includes(normalizedQuery) ||
    checklist.items.some((item) => item.text.toLowerCase().includes(normalizedQuery))
  );
}

export function getTodayKey() {
  return toDateKey(new Date());
}

export function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function parseDateKey(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function addDays(date: Date, days: number) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
}

export function diffInDays(fromDateKey: string, toDateKeyValue: string) {
  return Math.round((parseDateKey(toDateKeyValue).getTime() - parseDateKey(fromDateKey).getTime()) / DAY_IN_MS);
}

export function formatDisplayDate(dateKey: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(parseDateKey(dateKey));
}

export function formatMonthLabel(date: Date) {
  return new Intl.DateTimeFormat("en", {
    month: "long",
    year: "numeric",
  }).format(date);
}

export function getCalendarMonthDays(monthDate: Date) {
  const firstOfMonth = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const firstVisibleDate = addDays(firstOfMonth, -firstOfMonth.getDay());

  return Array.from({ length: 42 }, (_, index) => addDays(firstVisibleDate, index));
}

function nextTemplateTitle() {
  return challengeTemplates[Math.floor(Math.random() * challengeTemplates.length)];
}

function createDayRecord(date: string, status: ChallengeDayStatus): ChallengeDayRecord {
  return {
    date,
    status,
    updatedAt: Date.now(),
  };
}

function getChallengeStatus(checklist: Checklist, todayKey: string) {
  if (checklist.archived || isChecklistComplete(checklist)) {
    return "Finished";
  }

  const startDate = checklist.startDate ?? toDateKey(new Date(checklist.createdAt));

  if (diffInDays(todayKey, startDate) > 0) {
    return "Upcoming";
  }

  return "Active";
}

function getCurrentStreak(
  records: ChallengeDayRecord[],
  startDate: string,
  todayKey: string,
  durationDays: number,
) {
  const latestIndex = Math.min(Math.max(diffInDays(startDate, todayKey), 0), durationDays - 1);
  let streak = 0;

  for (let index = latestIndex; index >= 0; index -= 1) {
    const date = toDateKey(addDays(parseDateKey(startDate), index));
    const record = records.find((dayRecord) => dayRecord.date === date);

    if (record?.status !== "complete") {
      break;
    }

    streak += 1;
  }

  return streak;
}

function legacyRecordsFromItems(checklist: Checklist): ChallengeDayRecord[] {
  const startDate = checklist.startDate ?? toDateKey(new Date(checklist.createdAt));

  return checklist.items
    .map((item, index): ChallengeDayRecord | null => {
      if (!item.completed) {
        return null;
      }

      return {
        date: toDateKey(addDays(parseDateKey(startDate), index)),
        status: "complete",
        updatedAt: item.updatedAt,
      };
    })
    .filter((record): record is ChallengeDayRecord => record !== null);
}
