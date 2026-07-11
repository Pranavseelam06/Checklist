import {
  formatDisplayDate,
  getChallengeStats,
} from "@/src/lib/checklists";
import type { Checklist } from "@/src/types";

type DashboardProps = {
  checklists: Checklist[];
  isLoading: boolean;
  query: string;
  todayKey: string;
  onCreate: () => void;
  onOpen: (id: string) => void;
  onQueryChange: (query: string) => void;
};

export function Dashboard({
  checklists,
  isLoading,
  query,
  todayKey,
  onCreate,
  onOpen,
  onQueryChange,
}: DashboardProps) {
  return (
    <section className="page-shell dashboard-page" aria-labelledby="dashboard-title">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Personal challenges</p>
          <h1 id="dashboard-title">Today’s focus</h1>
        </div>
        <button className="primary-button large" type="button" onClick={onCreate}>
          New Challenge
        </button>
      </div>

      <label className="search-field">
        <span>Search challenges</span>
        <input
          aria-label="Search challenges"
          placeholder="Search by name or checklist item"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
        />
      </label>

      {isLoading ? <p className="muted-message">Loading your challenges...</p> : null}

      {!isLoading && checklists.length === 0 ? (
        <div className="empty-panel">
          <div className="empty-icon" aria-hidden="true">
            ✓
          </div>
          <h2>No challenges yet</h2>
          <p>Create a simple challenge, track today, and keep everything private on this device.</p>
          <button className="primary-button" type="button" onClick={onCreate}>
            New Challenge
          </button>
        </div>
      ) : null}

      <div className="challenge-grid">
        {checklists.map((checklist) => (
          <ChallengeCard
            checklist={checklist}
            key={checklist.id}
            todayKey={todayKey}
            onOpen={() => onOpen(checklist.id)}
          />
        ))}
      </div>
    </section>
  );
}

function ChallengeCard({
  checklist,
  todayKey,
  onOpen,
}: {
  checklist: Checklist;
  todayKey: string;
  onOpen: () => void;
}) {
  const stats = getChallengeStats(checklist, todayKey);

  return (
    <button className="challenge-card" type="button" onClick={onOpen}>
      <span className={`status-pill ${stats.status.toLowerCase()}`}>{stats.status}</span>
      <span className="card-title">{checklist.title}</span>
      <span className="card-progress">
        Day {stats.currentDay || 1} of {stats.durationDays}
      </span>
      <span className="progress-track thin" aria-hidden="true">
        <span style={{ width: `${stats.percent}%` }} />
      </span>
      <span className="card-meta">
        <span>{stats.completed} completed</span>
        <span>Starts {formatDisplayDate(stats.startDate)}</span>
      </span>
    </button>
  );
}
