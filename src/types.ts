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
  items: ChecklistItem[];
  createdAt: number;
  updatedAt: number;
};
