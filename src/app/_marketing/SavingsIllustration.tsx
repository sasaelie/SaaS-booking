'use client';
import { useState } from 'react';
import { MARKETING_SAVINGS as UI } from '../../config/marketing-preview';
import { COMMERCIAL } from '../../config/commercial';
import { formatMoney } from '../_ui/format-money';
export function SavingsIllustration({ avoidableCents }: { readonly avoidableCents: number }) {
  const [volume, setVolume] = useState<number>(UI.DEFAULT_VOLUME);
  const avoidable = volume * avoidableCents;
  const difference = avoidable - COMMERCIAL.MONTHLY_CENTS;
  return (
    <div className="portal-panel marketing-savings" aria-labelledby="economie-titre">
      <div>
        <h3 id="economie-titre">{UI.TITLE}</h3>
        <p>{UI.INTRO}</p>
        <p className="marketing-savings-hypothesis">{UI.HYPOTHESIS}</p>
      </div>
      <div className="marketing-savings-calculation">
        <label htmlFor="marketing-volume">
          {UI.VOLUME}
          <output htmlFor="marketing-volume">{volume}</output>
        </label>
        <input
          id="marketing-volume"
          type="range"
          min={UI.MIN_VOLUME}
          max={UI.MAX_VOLUME}
          value={volume}
          onChange={(event) => setVolume(Number(event.target.value))}
          aria-describedby="economie-hypothese"
        />
        <SavingsAmounts avoidable={avoidable} difference={difference} />
        <p role="status" className="marketing-savings-result">
          {difference >= 0 ? UI.PRO : UI.LIBERTE}
        </p>
      </div>
      <p id="economie-hypothese" className="marketing-small-print">
        {UI.NOTE}
      </p>
    </div>
  );
}
function SavingsAmounts({
  avoidable,
  difference,
}: {
  readonly avoidable: number;
  readonly difference: number;
}) {
  return (
    <dl>
      <div>
        <dt>{UI.AVOIDABLE}</dt>
        <dd>{formatMoney(avoidable, 'EUR')}</dd>
      </div>
      <div>
        <dt>{UI.SUBSCRIPTION}</dt>
        <dd>{formatMoney(COMMERCIAL.MONTHLY_CENTS, 'EUR')}</dd>
      </div>
      <div className="marketing-savings-net">
        <dt>{UI.DIFFERENCE}</dt>
        <dd>{formatMoney(difference, 'EUR')}</dd>
      </div>
    </dl>
  );
}
