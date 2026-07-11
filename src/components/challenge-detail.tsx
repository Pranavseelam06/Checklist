import { useMemo, useState } from "react";
import {
  formatDisplayDate,
  getChallengeStats,
  getDayRecord,
  isChecklistComplete,
  parseDateKey,
} from "@/src/lib/checklists";
import type { ChallengeDayStatus, Checklist } from "@/src/types";
import { CalendarMonth } from "@/src/components/calendar-month";
import { ChecklistItems } from "@/src/components/checklist-items";

type ChallengeDetailProps = {
  checklist: Checklist;
  todayKey: string;
  onBack: () => void;
  onDelete: (checklist: Checklist) => void;
  onMarkToday: (checklist: Checklist, status: ChallengeDayStatus) => void;
  onRename: (checklist: Checklist, title: string) => void;
  onReplace: (checklist: Checklist) => void;
  onToggleArchive: (checklist: Checklist) => void;
};

export function ChallengeDetail({
  checklist,
  todayKey,
  onBack,
  onDelete,
  onMarkToday,
  onRename,
  onReplace,
  onToggleArchive,
}: ChallengeDetailProps) {
  const stats = getChallengeStats(checklist, todayKey);
  const [monthDate, setMonthDate] = useState(() => parseDateKey(todayKey));
  const [isTodayModalOpen, setIsTodayModalOpen] = useState(false);
  const todayRecord = getDayRecord(checklist, todayKey);
  const canArchive = checklist.archived || isChecklistComplete(checklist);
  const statCards = useMemo(
    () => [
      { label: "Current Streak", value: `${stats.currentStreak} day${stats.currentStreak === 1 ? "" : "s"}` },
      { label: "Completed", value: `${stats.completed}/${stats.durationDays}` },
      { label: "Success Rate", value: `${stats.successRate}%` },
      { label: "Days Remaining", value: stats.daysRemaining },
    ],
    [stats.completed, stats.currentStreak, stats.daysRemaining, stats.durationDays, stats.successRate],
  );

  function chooseToday(status: ChallengeDayStatus) {
    onMarkToday(checklist, status);
    setIsTodayModalOpen(false);
  }

  return (
    <section className="page-shell detail-page" aria-labelledby="challenge-title">
      <div className="detail-topbar">
        <button className="ghost-button back-button" type="button" onClick={onBack}>
          Back
        </button>
        <div className="detail-actions">
          <button
            className="secondary-button"
            disabled={!canArchive}
            type="button"
            onClick={() => onToggleArchive(checklist)}
          >
            {checklist.archived ? "Restore" : "Archive"}
          </button>
          <button className="danger-button" type="button" onClick={() => onDelete(checklist)}>
            Delete
          </button>
        </div>
      </div>

      <header className="detail-hero">
        <div>
          <span className={`status-pill ${stats.status.toLowerCase()}`}>{stats.status}</span>
          <input
            aria-label="Challenge title"
            className="hero-title-input"
            id="challenge-title"
            value={checklist.title}
            onChange={(event) => onRename(checklist, event.target.value)}
          />
          <p>
            Day {stats.currentDay || 1} of {stats.durationDays} · Started{" "}
            {formatDisplayDate(stats.startDate)}
          </p>
        </div>

        <div className="hero-progress" aria-label={`${stats.percent}% complete`}>
          <span>{stats.percent}%</span>
          <div className="progress-track thin">
            <span style={{ width: `${stats.percent}%` }} />
          </div>
        </div>
      </header>

      <div className="stats-grid">
        {statCards.map((stat) => (
          <article className="stat-card" key={stat.label}>
            <span>{stat.label}</span>
            <strong>{stat.value}</strong>
          </article>
        ))}
      </div>

      <CalendarMonth
        checklist={checklist}
        monthDate={monthDate}
        todayKey={todayKey}
        onMonthChange={setMonthDate}
        onTodayClick={() => setIsTodayModalOpen(true)}
      />

      <ChecklistItems checklist={checklist} onReplace={onReplace} />

      {isTodayModalOpen ? (
        <TodayModal
          checklist={checklist}
          isLocked={Boolean(todayRecord)}
          onClose={() => setIsTodayModalOpen(false)}
          onChoose={chooseToday}
        />
      ) : null}
    </section>
  );
}

function TodayModal({
  checklist,
  isLocked,
  onClose,
  onChoose,
}: {
  checklist: Checklist;
  isLocked: boolean;
  onClose: () => void;
  onChoose: (status: ChallengeDayStatus) => void;
}) {
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        aria-labelledby="today-modal-title"
        aria-modal="true"
        className="modal-card"
        role="dialog"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <p className="eyebrow">Today</p>
        <h2 id="today-modal-title">Did you complete today’s challenge?</h2>
        <p>{checklist.title}</p>

        {isLocked ? (
          <p className="locked-note">Today is already recorded.</p>
        ) : (
          <div className="modal-actions">
            <button className="success-button" type="button" onClick={() => onChoose("complete")}>
              Mark Complete
            </button>
            <button className="missed-button" type="button" onClick={() => onChoose("missed")}>
              Mark Missed
            </button>
          </div>
        )}

        <button className="ghost-button" type="button" onClick={onClose}>
          Close
        </button>
      </section>
    </div>
  );
}
