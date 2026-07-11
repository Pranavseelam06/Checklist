"use client";

import { FormEvent, PointerEvent, useEffect, useMemo, useState } from "react";
import {
  createChecklist,
  createItem,
  getProgress,
  isChecklistComplete,
  matchesQuery,
  withChecklistUpdate,
  withItemUpdate,
} from "@/src/lib/checklists";
import { getChecklists, removeChecklist, saveChecklist } from "@/src/lib/indexed-db";
import { registerServiceWorker } from "@/src/lib/service-worker";
import type { Checklist } from "@/src/types";

type ListView = "active" | "archived";

export function ChecklistApp() {
  const [checklists, setChecklists] = useState<Checklist[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [view, setView] = useState<ListView>("active");
  const [newChecklistTitle, setNewChecklistTitle] = useState("");
  const [newItemText, setNewItemText] = useState("");
  const [draggingItemId, setDraggingItemId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [storageError, setStorageError] = useState<string | null>(null);

  useEffect(() => {
    registerServiceWorker();

    getChecklists()
      .then((storedChecklists) => {
        const sorted = sortChecklists(storedChecklists);
        setChecklists(sorted);
        setSelectedId(sorted.find((checklist) => !checklist.archived)?.id ?? sorted[0]?.id ?? null);
      })
      .catch(() => setStorageError("Could not open local storage. Your browser may be blocking IndexedDB."))
      .finally(() => setIsLoading(false));
  }, []);

  const visibleChecklists = useMemo(() => {
    return sortChecklists(
      checklists.filter((checklist) => checklist.archived === (view === "archived")),
    ).filter((checklist) => matchesQuery(checklist, query));
  }, [checklists, query, view]);

  const selectedChecklist =
    checklists.find(
      (checklist) =>
        checklist.id ===
        (visibleChecklists.some((visibleChecklist) => visibleChecklist.id === selectedId)
          ? selectedId
          : visibleChecklists[0]?.id),
    ) ?? null;

  async function persist(nextChecklist: Checklist) {
    setStorageError(null);
    await saveChecklist(nextChecklist).catch(() => {
      setStorageError("Changes could not be saved locally. Please check browser storage permissions.");
    });
  }

  function replaceChecklist(nextChecklist: Checklist) {
    setChecklists((current) =>
      sortChecklists(
        current.map((checklist) => (checklist.id === nextChecklist.id ? nextChecklist : checklist)),
      ),
    );
    void persist(nextChecklist);
  }

  function createNewChecklist(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const checklist = createChecklist(newChecklistTitle);

    setChecklists((current) => sortChecklists([checklist, ...current]));
    setSelectedId(checklist.id);
    setView("active");
    setNewChecklistTitle("");
    void persist(checklist);
  }

  function renameChecklist(checklist: Checklist, title: string) {
    const cleanTitle = title.trimStart();
    replaceChecklist(withChecklistUpdate({
      ...checklist,
      title: cleanTitle || "Untitled Checklist",
    }));
  }

  function deleteChecklist(checklist: Checklist) {
    const confirmed = window.confirm(`Delete "${checklist.title}"? This cannot be undone.`);

    if (!confirmed) {
      return;
    }

    setChecklists((current) => current.filter((item) => item.id !== checklist.id));
    setSelectedId(null);
    void removeChecklist(checklist.id).catch(() => {
      setStorageError("The checklist was removed from this view, but local storage did not confirm deletion.");
    });
  }

  function toggleArchive(checklist: Checklist) {
    replaceChecklist(withChecklistUpdate({
      ...checklist,
      archived: !checklist.archived,
    }));
    setView(checklist.archived ? "active" : "archived");
  }

  function addItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedChecklist || !newItemText.trim()) {
      return;
    }

    replaceChecklist(withChecklistUpdate({
      ...selectedChecklist,
      items: [...selectedChecklist.items, createItem(newItemText)],
    }));
    setNewItemText("");
  }

  function updateItemText(checklist: Checklist, itemId: string, text: string) {
    replaceChecklist(withChecklistUpdate({
      ...checklist,
      items: checklist.items.map((item) =>
        item.id === itemId ? withItemUpdate({ ...item, text }) : item,
      ),
    }));
  }

  function toggleItem(checklist: Checklist, itemId: string) {
    replaceChecklist(withChecklistUpdate({
      ...checklist,
      items: checklist.items.map((item) =>
        item.id === itemId
          ? withItemUpdate({ ...item, completed: !item.completed })
          : item,
      ),
    }));
  }

  function deleteItem(checklist: Checklist, itemId: string) {
    replaceChecklist(withChecklistUpdate({
      ...checklist,
      items: checklist.items.filter((item) => item.id !== itemId),
    }));
  }

  function moveItem(checklist: Checklist, itemId: string, direction: -1 | 1) {
    const fromIndex = checklist.items.findIndex((item) => item.id === itemId);
    const toIndex = fromIndex + direction;

    if (fromIndex < 0 || toIndex < 0 || toIndex >= checklist.items.length) {
      return;
    }

    replaceChecklist(withChecklistUpdate({
      ...checklist,
      items: reorder(checklist.items, fromIndex, toIndex),
    }));
  }

  function beginItemDrag(event: PointerEvent<HTMLButtonElement>, itemId: string) {
    event.currentTarget.setPointerCapture(event.pointerId);
    setDraggingItemId(itemId);
  }

  function dragItem(event: PointerEvent<HTMLButtonElement>, checklist: Checklist) {
    if (!draggingItemId) {
      return;
    }

    const target = document.elementFromPoint(event.clientX, event.clientY);
    const row = target?.closest<HTMLElement>("[data-item-id]");
    const targetItemId = row?.dataset.itemId;

    if (!targetItemId || targetItemId === draggingItemId) {
      return;
    }

    const fromIndex = checklist.items.findIndex((item) => item.id === draggingItemId);
    const toIndex = checklist.items.findIndex((item) => item.id === targetItemId);

    if (fromIndex < 0 || toIndex < 0) {
      return;
    }

    replaceChecklist(withChecklistUpdate({
      ...checklist,
      items: reorder(checklist.items, fromIndex, toIndex),
    }));
  }

  const progress = selectedChecklist ? getProgress(selectedChecklist) : null;
  const selectedIsComplete = selectedChecklist ? isChecklistComplete(selectedChecklist) : false;

  return (
    <main className="app-shell">
      <section className="sidebar" aria-label="Checklists">
        <div className="brand-row">
          <div>
            <h1>Checklist</h1>
            <p>Simple lists that stay on this device.</p>
          </div>
        </div>

        <form className="create-form" onSubmit={createNewChecklist}>
          <input
            aria-label="New checklist title"
            placeholder="New checklist"
            value={newChecklistTitle}
            onChange={(event) => setNewChecklistTitle(event.target.value)}
          />
          <button type="submit">Create</button>
        </form>

        <div className="search-wrap">
          <input
            aria-label="Search checklists"
            placeholder="Search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>

        <div className="segmented-control" aria-label="Checklist view">
          <button
            className={view === "active" ? "is-selected" : ""}
            type="button"
            onClick={() => setView("active")}
          >
            Active
          </button>
          <button
            className={view === "archived" ? "is-selected" : ""}
            type="button"
            onClick={() => setView("archived")}
          >
            Archived
          </button>
        </div>

        {storageError ? <p className="error-message">{storageError}</p> : null}

        <div className="list-stack">
          {isLoading ? <p className="quiet">Loading...</p> : null}
          {!isLoading && visibleChecklists.length === 0 ? (
            <div className="empty-state">
              <strong>{view === "active" ? "No active checklists" : "No archived checklists"}</strong>
              <span>{query ? "Try another search." : "Create one when you are ready."}</span>
            </div>
          ) : null}

          {visibleChecklists.map((checklist) => {
            const itemProgress = getProgress(checklist);

            return (
              <button
                className={`checklist-tab ${selectedId === checklist.id ? "is-selected" : ""}`}
                key={checklist.id}
                type="button"
                onClick={() => setSelectedId(checklist.id)}
              >
                <span>{checklist.title}</span>
                <small>
                  {itemProgress.completed}/{itemProgress.total}
                </small>
              </button>
            );
          })}
        </div>
      </section>

      <section className="workspace" aria-label="Selected checklist">
        {selectedChecklist && progress ? (
          <>
            <header className="checklist-header">
              <div className="title-group">
                <input
                  aria-label="Checklist title"
                  className="title-input"
                  value={selectedChecklist.title}
                  onChange={(event) => renameChecklist(selectedChecklist, event.target.value)}
                />
                <div className="progress-line">
                  <span>
                    {progress.completed}/{progress.total} completed
                  </span>
                  <span>{progress.percent}%</span>
                </div>
                <div className="progress-track" aria-hidden="true">
                  <div style={{ width: `${progress.percent}%` }} />
                </div>
              </div>

              <div className="header-actions">
                <button
                  className="secondary-button"
                  disabled={!selectedChecklist.archived && !selectedIsComplete}
                  type="button"
                  onClick={() => toggleArchive(selectedChecklist)}
                  title={
                    selectedChecklist.archived
                      ? "Restore checklist"
                      : "Archive after every item is complete"
                  }
                >
                  {selectedChecklist.archived ? "Restore" : "Archive"}
                </button>
                <button
                  className="danger-button"
                  type="button"
                  onClick={() => deleteChecklist(selectedChecklist)}
                >
                  Delete
                </button>
              </div>
            </header>

            <form className="item-form" onSubmit={addItem}>
              <input
                aria-label="New item"
                placeholder="Add an item"
                value={newItemText}
                onChange={(event) => setNewItemText(event.target.value)}
              />
              <button type="submit">Add</button>
            </form>

            <div className="items" aria-label="Checklist items">
              {selectedChecklist.items.length === 0 ? (
                <div className="empty-workspace">
                  <strong>No items yet</strong>
                  <span>Add one small step to get moving.</span>
                </div>
              ) : null}

              {selectedChecklist.items.map((item, index) => (
                <div
                  className={`item-row ${item.completed ? "is-complete" : ""} ${
                    draggingItemId === item.id ? "is-dragging" : ""
                  }`}
                  data-item-id={item.id}
                  key={item.id}
                >
                  <button
                    aria-label="Drag to reorder"
                    className="drag-handle"
                    type="button"
                    onPointerDown={(event) => beginItemDrag(event, item.id)}
                    onPointerMove={(event) => dragItem(event, selectedChecklist)}
                    onPointerUp={() => setDraggingItemId(null)}
                    onPointerCancel={() => setDraggingItemId(null)}
                  >
                    <span />
                    <span />
                    <span />
                  </button>

                  <label className="check-control">
                    <input
                      checked={item.completed}
                      type="checkbox"
                      onChange={() => toggleItem(selectedChecklist, item.id)}
                    />
                    <span />
                  </label>

                  <input
                    aria-label="Checklist item text"
                    className="item-input"
                    value={item.text}
                    onChange={(event) => updateItemText(selectedChecklist, item.id, event.target.value)}
                  />

                  <div className="item-actions">
                    <button
                      aria-label="Move item up"
                      disabled={index === 0}
                      type="button"
                      onClick={() => moveItem(selectedChecklist, item.id, -1)}
                    >
                      ↑
                    </button>
                    <button
                      aria-label="Move item down"
                      disabled={index === selectedChecklist.items.length - 1}
                      type="button"
                      onClick={() => moveItem(selectedChecklist, item.id, 1)}
                    >
                      ↓
                    </button>
                    <button
                      aria-label="Delete item"
                      className="delete-item-button"
                      type="button"
                      onClick={() => deleteItem(selectedChecklist, item.id)}
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="welcome-panel">
            <h2>Make a checklist</h2>
            <p>Use it for a challenge, trip, routine, or any small personal list.</p>
          </div>
        )}
      </section>
    </main>
  );
}

function sortChecklists(checklists: Checklist[]) {
  return [...checklists].sort((a, b) => b.updatedAt - a.updatedAt);
}

function reorder<T>(items: T[], fromIndex: number, toIndex: number) {
  const nextItems = [...items];
  const [movedItem] = nextItems.splice(fromIndex, 1);
  nextItems.splice(toIndex, 0, movedItem);
  return nextItems;
}
