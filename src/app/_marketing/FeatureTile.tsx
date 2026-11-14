'use client';
import { useId, type ReactNode } from 'react';
import type { MarketingVisualFeature } from '../../config/marketing-visuals';
import { IceIcon } from '../_ui/IceIcon';
interface TileProps {
  readonly feature: MarketingVisualFeature;
  readonly open: boolean;
  readonly onOpen: () => void;
  readonly onClose: () => void;
  readonly onToggle: () => void;
}
export function FeatureTile({ feature, open, onOpen, onClose, onToggle }: TileProps) {
  const id = useId();
  return (
    <TileFrame open={open} onOpen={onOpen} onClose={onClose}>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={onToggle}
        className="marketing-feature-trigger"
      >
        <span className="marketing-tile-icon">
          <IceIcon name={feature.icon} />
        </span>
        <span>
          <strong>{feature.title}</strong>
          <span>{feature.lead}</span>
        </span>
        <IceIcon name="next" />
      </button>
      <div id={id} className="marketing-feature-detail" hidden={!open}>
        <p>{feature.detail}</p>
        <div className="marketing-feature-flow" aria-hidden="true">
          <span>{feature.steps[0]}</span>
          <IceIcon name="arrow" />
          <span>{feature.steps[1]}</span>
        </div>
        <span className="marketing-feature-badge">{feature.badge}</span>
      </div>
    </TileFrame>
  );
}
function TileFrame({
  open,
  onOpen,
  onClose,
  children,
}: {
  readonly open: boolean;
  readonly onOpen: () => void;
  readonly onClose: () => void;
  readonly children: ReactNode;
}) {
  return (
    <article
      className="portal-panel marketing-feature-tile"
      data-open={open}
      onPointerEnter={(event) => {
        if (event.pointerType === 'mouse') onOpen();
      }}
      onPointerLeave={(event) => {
        if (!event.currentTarget.contains(document.activeElement)) onClose();
      }}
      onBlur={(event) => {
        if (
          !(event.relatedTarget instanceof Node) ||
          !event.currentTarget.contains(event.relatedTarget)
        )
          onClose();
      }}
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          onClose();
          event.stopPropagation();
        }
      }}
    >
      {children}
    </article>
  );
}
