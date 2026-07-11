export type ChallengeDayStatus = "complete" | "missed";

export type ChallengeDayRecord = {
  date: string;
  status: ChallengeDayStatus;
  updatedAt: number;
};

export type ChecklistItem = {
  id: string;
  text: string;
  completed: boolean;
  createdAt: number;
  updatedAt: number;
};

export type Checklist = {
  id: string;
  title: string;
  archived: boolean;
  startDate?: string;
  durationDays?: number;
  dayRecords?: ChallengeDayRecord[];
  items: ChecklistItem[];
  createdAt: number;
  updatedAt: number;
};
