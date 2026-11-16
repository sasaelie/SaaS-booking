export interface PlanningSession {
  readonly id: string;
  readonly activityId: string;
  readonly name: string;
  readonly startsAt: string;
  readonly endsAt: string;
  readonly availability: string;
  readonly isBookable: boolean;
  readonly isCancelled?: boolean;
  readonly href?: string;
}
export interface PlanningProps {
  readonly sessions: readonly PlanningSession[];
  readonly timezone: string;
  readonly selected?: string;
  readonly onSelect?: (iso: string) => void;
}
export interface PositionedSession {
  readonly session: PlanningSession;
  readonly start: number;
  readonly end: number;
  readonly column: number;
  readonly columns: number;
}
