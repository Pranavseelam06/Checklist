import type { FormEvent } from "react";

type CreateChallengeProps = {
  todayKey: string;
  onCancel: () => void;
  onCreate: (event: FormEvent<HTMLFormElement>, formData: FormData) => void;
};

export function CreateChallenge({ todayKey, onCancel, onCreate }: CreateChallengeProps) {
  return (
    <section className="page-shell create-page" aria-labelledby="create-title">
      <button className="ghost-button back-button" type="button" onClick={onCancel}>
        Back
      </button>

      <form
        className="challenge-form"
        onSubmit={(event) => onCreate(event, new FormData(event.currentTarget))}
      >
        <div className="form-heading">
          <p className="eyebrow">New challenge</p>
          <h1 id="create-title">Start with one clear commitment.</h1>
        </div>

        <label>
          <span>Challenge Name</span>
          <input autoFocus name="title" placeholder="No Sugar" required />
        </label>

        <label>
          <span>Start Date</span>
          <input defaultValue={todayKey} name="startDate" required type="date" />
        </label>

        <label>
          <span>Duration (days)</span>
          <input defaultValue={30} min={1} name="durationDays" required type="number" />
        </label>

        <button className="primary-button large" type="submit">
          Create Challenge
        </button>
      </form>
    </section>
  );
}
