import { FormEvent, PointerEvent, useState } from "react";
import {
  createItem,
  withChecklistUpdate,
  withItemUpdate,
} from "@/src/lib/checklists";
import type { Checklist } from "@/src/types";

type ChecklistItemsProps = {
  checklist: Checklist;
  onReplace: (checklist: Checklist) => void;
};

export function ChecklistItems({ checklist, onReplace }: ChecklistItemsProps) {
  const [newItemText, setNewItemText] = useState("");
  const [draggingItemId, setDraggingItemId] = useState<string | null>(null);

  function replaceItems(items: Checklist["items"]) {
    onReplace(withChecklistUpdate({ ...checklist, items }));
  }

  function addItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!newItemText.trim()) {
      return;
    }

    replaceItems([...checklist.items, createItem(newItemText)]);
    setNewItemText("");
  }

  function updateItemText(itemId: string, text: string) {
    replaceItems(
      checklist.items.map((item) =>
        item.id === itemId ? withItemUpdate({ ...item, text }) : item,
      ),
    );
  }

  function toggleItem(itemId: string) {
    replaceItems(
      checklist.items.map((item) =>
        item.id === itemId ? withItemUpdate({ ...item, completed: !item.completed }) : item,
      ),
    );
  }

  function deleteItem(itemId: string) {
    replaceItems(checklist.items.filter((item) => item.id !== itemId));
  }

  function moveItem(itemId: string, direction: -1 | 1) {
    const fromIndex = checklist.items.findIndex((item) => item.id === itemId);
    const toIndex = fromIndex + direction;

    if (fromIndex < 0 || toIndex < 0 || toIndex >= checklist.items.length) {
      return;
    }

    replaceItems(reorder(checklist.items, fromIndex, toIndex));
  }

  function beginItemDrag(event: PointerEvent<HTMLButtonElement>, itemId: string) {
    event.currentTarget.setPointerCapture(event.pointerId);
    setDraggingItemId(itemId);
  }

  function dragItem(event: PointerEvent<HTMLButtonElement>) {
    if (!draggingItemId) {
      return;
    }

    const target = document.elementFromPoint(event.clientX, event.clientY);
    const row = target?.closest<HTMLElement>("[data-task-id]");
    const targetItemId = row?.dataset.taskId;

    if (!targetItemId || targetItemId === draggingItemId) {
      return;
    }

    const fromIndex = checklist.items.findIndex((item) => item.id === draggingItemId);
    const toIndex = checklist.items.findIndex((item) => item.id === targetItemId);

    if (fromIndex >= 0 && toIndex >= 0) {
      replaceItems(reorder(checklist.items, fromIndex, toIndex));
    }
  }

  return (
    <section className="tasks-panel" aria-labelledby="tasks-title">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Checklist</p>
          <h2 id="tasks-title">Supporting tasks</h2>
        </div>
      </div>

      <form className="task-form" onSubmit={addItem}>
        <input
          aria-label="New checklist item"
          placeholder="Add a small task"
          value={newItemText}
          onChange={(event) => setNewItemText(event.target.value)}
        />
        <button className="secondary-button" type="submit">
          Add
        </button>
      </form>

      {checklist.items.length === 0 ? (
        <p className="muted-message">No tasks yet. Add only what helps you finish the challenge.</p>
      ) : null}

      <div className="task-list">
        {checklist.items.map((item, index) => (
          <article
            className={`task-row ${item.completed ? "is-complete" : ""} ${
              draggingItemId === item.id ? "is-dragging" : ""
            }`}
            data-task-id={item.id}
            key={item.id}
          >
            <button
              aria-label="Drag to reorder"
              className="drag-handle"
              type="button"
              onPointerCancel={() => setDraggingItemId(null)}
              onPointerDown={(event) => beginItemDrag(event, item.id)}
              onPointerMove={dragItem}
              onPointerUp={() => setDraggingItemId(null)}
            >
              <span />
              <span />
              <span />
            </button>

            <label className="check-control">
              <input checked={item.completed} type="checkbox" onChange={() => toggleItem(item.id)} />
              <span />
            </label>

            <input
              aria-label="Checklist item text"
              className="task-input"
              value={item.text}
              onChange={(event) => updateItemText(item.id, event.target.value)}
            />

            <div className="task-actions">
              <button
                aria-label="Move item up"
                disabled={index === 0}
                type="button"
                onClick={() => moveItem(item.id, -1)}
              >
                ↑
              </button>
              <button
                aria-label="Move item down"
                disabled={index === checklist.items.length - 1}
                type="button"
                onClick={() => moveItem(item.id, 1)}
              >
                ↓
              </button>
              <button
                aria-label="Delete item"
                className="delete-icon-button"
                type="button"
                onClick={() => deleteItem(item.id)}
              >
                ×
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function reorder<T>(items: T[], fromIndex: number, toIndex: number) {
  const nextItems = [...items];
  const [movedItem] = nextItems.splice(fromIndex, 1);
  nextItems.splice(toIndex, 0, movedItem);
  return nextItems;
}
