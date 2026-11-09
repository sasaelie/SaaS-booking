export interface PlatformOperation {
  readonly id: string;
  readonly organizationId: string;
  readonly organizationName: string;
  readonly type: string;
  readonly attempts: number;
  readonly lastError: string | null;
  readonly availableAt: Date;
  readonly createdAt: Date;
}
export interface PlatformAuditEvent {
  readonly id: string;
  readonly organizationId: string | null;
  readonly organizationName: string | null;
  readonly actorName: string | null;
  readonly action: string;
  readonly createdAt: Date;
}
export interface PlatformOperationsPage {
  readonly entries: readonly PlatformOperation[];
  readonly total: number;
  readonly failedCount: number;
  readonly page: number;
}
export interface PlatformHistoryPage {
  readonly entries: readonly PlatformAuditEvent[];
  readonly total: number;
  readonly page: number;
}
