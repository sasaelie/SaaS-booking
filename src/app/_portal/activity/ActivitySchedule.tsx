'use client';
import { useState } from 'react';
import { ACTIVITY_UI } from '../../../config/constants';
import { ManualDateFields } from './ManualDateFields';
import { WeeklySlots } from './WeeklySlots';
export function ActivitySchedule() {
  const [mode, setMode] = useState('MANUAL');
  return (
    <fieldset className="portal-fieldset">
      <legend>{ACTIVITY_UI.MODE}</legend>
      <ScheduleMode mode={mode} setMode={setMode} />
      <fieldset
        className="portal-form-fields"
        hidden={mode !== 'MANUAL'}
        disabled={mode !== 'MANUAL'}
      >
        <ManualDateFields />
      </fieldset>
      <fieldset
        className="portal-form-fields"
        hidden={mode !== 'WEEKLY'}
        disabled={mode !== 'WEEKLY'}
      >
        <WeeklySlots />
      </fieldset>
    </fieldset>
  );
}

function ScheduleMode({
  mode,
  setMode,
}: {
  readonly mode: string;
  readonly setMode: (mode: string) => void;
}) {
  return (
    <div className="portal-radio-row">
      <label>
        <input
          type="radio"
          name="scheduleKind"
          value="MANUAL"
          checked={mode === 'MANUAL'}
          onChange={() => setMode('MANUAL')}
        />
        {ACTIVITY_UI.MANUAL}
      </label>
      <label>
        <input
          type="radio"
          name="scheduleKind"
          value="WEEKLY"
          checked={mode === 'WEEKLY'}
          onChange={() => setMode('WEEKLY')}
        />
        {ACTIVITY_UI.WEEKLY}
      </label>
    </div>
  );
}
