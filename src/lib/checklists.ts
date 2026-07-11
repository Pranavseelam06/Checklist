import type { Checklist, ChecklistItem } from "@/src/types";

const challengeTemplates = [
  "No Sugar (30 Days)",
  "Internship Tasks",
  "Packing List",
  "Vacation Checklist",
];

export function createChecklist(title?: string): Checklist {
  const now = Date.now();

  return {
    id: crypto.randomUUID(),
    title: title?.trim() || nextTemplateTitle(),
    archived: false,
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
  const total = checklist.items.length;
  const completed = checklist.items.filter((item) => item.completed).length;
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100);

  return { completed, total, percent };
}

export function isChecklistComplete(checklist: Checklist) {
  return checklist.items.length > 0 && checklist.items.every((item) => item.completed);
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

function nextTemplateTitle() {
  return challengeTemplates[Math.floor(Math.random() * challengeTemplates.length)];
}
