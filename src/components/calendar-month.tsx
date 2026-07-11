import {
  addDays,
  diffInDays,
  formatMonthLabel,
  getCalendarMonthDays,
  getChallengeStats,
  getDayRecord,
  toDateKey,
} from "@/src/lib/checklists";
import type { Checklist } from "@/src/types";

const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

type CalendarMonthProps = {
  checklist: Checklist;
  monthDate: Date;
  todayKey: string;
  onMonthChange: (date: Date) => void;
  onTodayClick: () => void;
};

export function CalendarMonth({
  checklist,
  monthDate,
  todayKey,
  onMonthChange,
  onTodayClick,
}: CalendarMonthProps) {
  const stats = getChallengeStats(checklist, todayKey);
  const visibleDays = getCalendarMonthDays(monthDate);

  return (
    <section className="calendar-panel" aria-labelledby="calendar-title">
      <div className="calendar-header">
        <div>
          <p className="eyebrow">Calendar</p>
          <h2 id="calendar-title">{formatMonthLabel(monthDate)}</h2>
        </div>
        <div className="month-controls">
          <button
            aria-label="Previous month"
            className="icon-button"
            type="button"
            onClick={() => onMonthChange(addDays(new Date(monthDate.getFullYear(), monthDate.getMonth(), 1), -1))}
          >
            ‹
          </button>
          <button
            aria-label="Next month"
            className="icon-button"
            type="button"
            onClick={() => onMonthChange(new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 1))}
          >
            ›
          </button>
        </div>
      </div>

      <div className="calendar-grid" aria-label="Challenge month view">
        {weekdays.map((weekday) => (
          <span className="weekday" key={weekday}>
            {weekday}
          </span>
        ))}

        {visibleDays.map((date) => {
          const dateKey = toDateKey(date);
          const record = getDayRecord(checklist, dateKey);
          const isToday = dateKey === todayKey;
          const isCurrentMonth = date.getMonth() === monthDate.getMonth();
          const isBeforeStart = diffInDays(dateKey, stats.startDate) > 0;
          const isAfterEnd = diffInDays(stats.endDate, dateKey) > 0;
          const isFuture = diffInDays(todayKey, dateKey) > 0;
          const isInteractive = isToday && !record && !isBeforeStart && !isAfterEnd;
          const stateClass = [
            "calendar-day",
            isToday ? "is-today" : "",
            !isCurrentMonth || isFuture || isBeforeStart || isAfterEnd ? "is-faded" : "",
            record?.status === "complete" ? "is-complete" : "",
            record?.status === "missed" ? "is-missed" : "",
          ]
            .filter(Boolean)
            .join(" ");

          return (
            <button
              aria-label={`${dateKey}${record ? ` ${record.status}` : ""}`}
              className={stateClass}
              disabled={!isInteractive}
              key={dateKey}
              type="button"
              onClick={onTodayClick}
            >
              <span>{date.getDate()}</span>
              {record?.status === "complete" ? <strong>✓</strong> : null}
              {record?.status === "missed" ? <strong>×</strong> : null}
            </button>
          );
        })}
      </div>
    </section>
  );
}
