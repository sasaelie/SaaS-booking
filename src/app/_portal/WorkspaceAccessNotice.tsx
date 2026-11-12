'use client';
import type { ReactNode } from 'react';
import { useSelectedLayoutSegment } from 'next/navigation';
export function WorkspaceAccessNotice({
  children,
  critical = false,
}: {
  readonly children: ReactNode;
  readonly critical?: boolean;
}) {
  return useSelectedLayoutSegment() === 'abonnement' && !critical ? null : children;
}
