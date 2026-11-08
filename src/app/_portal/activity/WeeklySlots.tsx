'use client';
import { useRef, useState } from 'react';
import { ACTIVITY_UI, SAAS } from '../../../config/constants';
import { WeeklySlotRow } from './WeeklySlotRow';
export function WeeklySlots() {
  const [rows, setRows] = useState([0]);
  const sequence = useRef(0);
  function add() {
    if (rows.length >= SAAS.MAX_WEEKLY_SLOTS) return;
    sequence.current++;
    setRows([...rows, sequence.current]);
  }
  return (
    <div className="portal-list">
      {rows.map((row) => (
        <WeeklySlotRow
          key={row}
          removable={rows.length > 1}
          remove={() => setRows(rows.filter((id) => id !== row))}
        />
      ))}
      <button
        type="button"
        className="portal-text-button"
        disabled={rows.length >= SAAS.MAX_WEEKLY_SLOTS}
        onClick={add}
      >
        {ACTIVITY_UI.ADD_SLOT}
      </button>
    </div>
  );
}
