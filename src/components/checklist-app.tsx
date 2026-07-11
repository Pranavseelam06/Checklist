"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  createChecklist,
  getTodayKey,
  markChallengeDay,
  matchesQuery,
  normalizeChecklist,
  withChecklistUpdate,
} from "@/src/lib/checklists";
import { getChecklists, removeChecklist, saveChecklist } from "@/src/lib/indexed-db";
import { registerServiceWorker } from "@/src/lib/service-worker";
import type { ChallengeDayStatus, Checklist } from "@/src/types";
import { ChallengeDetail } from "@/src/components/challenge-detail";
import { CreateChallenge } from "@/src/components/create-challenge";
import { Dashboard } from "@/src/components/dashboard";

type AppView = "dashboard" | "create" | "detail";

export function ChecklistApp() {
  const [checklists, setChecklists] = useState<Checklist[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [view, setView] = useState<AppView>("dashboard");
  const [isLoading, setIsLoading] = useState(true);
  const [storageError, setStorageError] = useState<string | null>(null);
  const todayKey = useMemo(() => getTodayKey(), []);

  useEffect(() => {
    registerServiceWorker();

    getChecklists()
      .then((storedChecklists) => {
        setChecklists(sortChecklists(storedChecklists.map(normalizeChecklist)));
      })
      .catch(() =>
        setStorageError("Local storage could not be opened. Check browser storage permissions."),
      )
      .finally(() => setIsLoading(false));
  }, []);

  const visibleChecklists = useMemo(() => {
    return sortChecklists(checklists).filter((checklist) => matchesQuery(checklist, query));
  }, [checklists, query]);

  const selectedChecklist = checklists.find((checklist) => checklist.id === selectedId) ?? null;

  async function persist(nextChecklist: Checklist) {
    setStorageError(null);
    await saveChecklist(nextChecklist).catch(() => {
      setStorageError("Your latest change could not be saved locally.");
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

  function createChallenge(event: FormEvent<HTMLFormElement>, formData: FormData) {
    event.preventDefault();

    const title = String(formData.get("title") ?? "").trim();
    const startDate = String(formData.get("startDate") ?? todayKey);
    const durationDays = Number(formData.get("durationDays") ?? 30);
    const checklist = createChecklist(title, startDate, durationDays);

    setChecklists((current) => sortChecklists([checklist, ...current]));
    setSelectedId(checklist.id);
    setView("detail");
    void persist(checklist);
  }

  function openChecklist(id: string) {
    setSelectedId(id);
    setView("detail");
  }

  function renameChecklist(checklist: Checklist, title: string) {
    replaceChecklist(
      withChecklistUpdate({
        ...checklist,
        title: title.trimStart() || "Untitled Challenge",
      }),
    );
  }

  function markToday(checklist: Checklist, status: ChallengeDayStatus) {
    replaceChecklist(markChallengeDay(checklist, todayKey, status));
  }

  function toggleArchive(checklist: Checklist) {
    replaceChecklist(
      withChecklistUpdate({
        ...checklist,
        archived: !checklist.archived,
      }),
    );
  }

  function deleteChecklist(checklist: Checklist) {
    const confirmed = window.confirm(`Delete "${checklist.title}"? This cannot be undone.`);

    if (!confirmed) {
      return;
    }

    setChecklists((current) => current.filter((item) => item.id !== checklist.id));
    setSelectedId(null);
    setView("dashboard");
    void removeChecklist(checklist.id).catch(() => {
      setStorageError("The challenge disappeared from the app, but deletion was not confirmed.");
    });
  }

  return (
    <main className="app-shell">
      <header className="app-header">
        <button className="brand-mark" type="button" onClick={() => setView("dashboard")}>
          <span aria-hidden="true">✓</span>
          <span>Checklist</span>
        </button>
        <nav aria-label="Primary navigation">
          <button
            className={view === "dashboard" ? "nav-button is-active" : "nav-button"}
            type="button"
            onClick={() => setView("dashboard")}
          >
            Challenges
          </button>
          <button className="primary-button" type="button" onClick={() => setView("create")}>
            New Challenge
          </button>
        </nav>
      </header>

      {storageError ? <p className="toast-message">{storageError}</p> : null}

      {view === "dashboard" ? (
        <Dashboard
          checklists={visibleChecklists}
          isLoading={isLoading}
          query={query}
          todayKey={todayKey}
          onCreate={() => setView("create")}
          onOpen={openChecklist}
          onQueryChange={setQuery}
        />
      ) : null}

      {view === "create" ? (
        <CreateChallenge todayKey={todayKey} onCancel={() => setView("dashboard")} onCreate={createChallenge} />
      ) : null}

      {view === "detail" && selectedChecklist ? (
        <ChallengeDetail
          key={selectedChecklist.id}
          checklist={selectedChecklist}
          todayKey={todayKey}
          onBack={() => setView("dashboard")}
          onDelete={deleteChecklist}
          onMarkToday={markToday}
          onRename={renameChecklist}
          onReplace={replaceChecklist}
          onToggleArchive={toggleArchive}
        />
      ) : null}
    </main>
  );
}

function sortChecklists(checklists: Checklist[]) {
  return [...checklists].sort((a, b) => b.updatedAt - a.updatedAt);
}
