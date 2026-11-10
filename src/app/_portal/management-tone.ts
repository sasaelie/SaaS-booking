import type { StatusTone } from '../../core/domain/status-indicator';
export function managementTone(command: Readonly<Record<string, unknown>>): StatusTone | undefined {
  if (command['action'] === 'review-bank') {
    if (command['decision'] === 'APPROVE') return 'green';
    if (command['decision'] === 'REJECT') return 'red';
  }
  if (
    command['action'] === 'close' ||
    command['action'] === 'pause' ||
    command['action'] === 'pause-local' ||
    command['action'] === 'cancel'
  )
    return 'red';
  return undefined;
}
