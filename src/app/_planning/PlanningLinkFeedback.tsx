'use client';
import { useLinkStatus } from 'next/link';
export function PlanningLinkFeedback() {
  const { pending } = useLinkStatus();
  return <span className="planning-link-pending" hidden={!pending} aria-hidden="true" />;
}
