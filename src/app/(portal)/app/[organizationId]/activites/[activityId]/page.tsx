import { canUsePro } from '../../../../../../core/domain/commercial';
import { PauseForm } from '../../../../../_portal/activity/PauseForm';
import type { PortalOverview } from '../../../../../../core/ports/portal-models';
import { EditActivityForm } from '../../../../../_portal/activity/EditActivityForm';
import { AddSessionForm } from '../../../../../_portal/activity/AddSessionForm';
import Link from 'next/link';
import {
  PORTAL,
  ACTIVITY_UI,
  AUDIENCE_LABELS,
  PAYMENT_LABELS,
} from '../../../../../../config/constants';
import { loadWorkspace } from '../../../../../_portal/load-workspace';
import { PortalHeading } from '../../../../../_portal/PortalHeading';
import { PortalError } from '../../../../../_portal/PortalError';
import { PortalForm } from '../../../../../_portal/PortalForm';
import { SessionList } from '../../../../../_portal/SessionList';
import { formatMoney } from '../../../../../_ui/format-money';
export default async function Page({
  params,
}: {
  readonly params: Promise<{ organizationId: string; activityId: string }>;
}) {
  const { organizationId, activityId } = await params;
  const result = await loadWorkspace(organizationId);
  if (!result.ok) return <PortalError />;
  const data = result.value;
  const activity = data.activities.find((value) => value.id === activityId);
  if (!activity) return <PortalError />;
  return <ActivityDetail data={data} activity={activity} />;
}
function ActivityDetail({
  data,
  activity,
}: {
  readonly data: PortalOverview;
  readonly activity: PortalOverview['activities'][number];
}) {
  const organizationId = data.organization.id;
  return (
    <div className="portal-section-stack">
      <PortalHeading
        title={activity.name}
        description={activity.description ?? undefined}
        action={
          <Link
            className="liquid-ice-button portal-button"
            href={`/${data.organization.slug}/${activity.id}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            {PORTAL.OPEN_PAGE}
          </Link>
        }
      />
      <ActivityMeta activity={activity} organizationId={organizationId} />
      <div className="portal-section-heading">
        <h2>{PORTAL.NEXT_SESSIONS}</h2>
      </div>
      <SessionList
        sessions={data.sessions.filter((session) => session.activityId === activity.id)}
        timezone={data.organization.timezone}
        organizationId={organizationId}
      />
      <PauseForm organizationId={organizationId} activityId={activity.id} />
      <ActivityManagement data={data} activity={activity} />
    </div>
  );
}

function ActivityManagement({
  data,
  activity,
}: {
  readonly data: PortalOverview;
  readonly activity: PortalOverview['activities'][number];
}) {
  const organizationId = data.organization.id;
  return (
    <>
      <EditActivityForm
        pro={canUsePro(data.organization.access, new Date())}
        activity={activity}
        organizationId={organizationId}
        disabled={Boolean(data.organization.access.suspendedAt)}
      />
      <AddSessionForm
        activityId={activity.id}
        organizationId={organizationId}
        disabled={Boolean(data.organization.access.suspendedAt)}
      />
      {!activity.isActive ? (
        <PortalForm
          action="publish-activity"
          organizationId={organizationId}
          submitLabel={ACTIVITY_UI.PUBLISH}
          disabled={Boolean(data.organization.access.suspendedAt)}
        >
          <input type="hidden" name="activityId" value={activity.id} />
        </PortalForm>
      ) : null}
      {activity.isActive ? (
        <ArchiveActivity organizationId={organizationId} activityId={activity.id} />
      ) : null}
    </>
  );
}

function ArchiveActivity({
  organizationId,
  activityId,
}: {
  readonly organizationId: string;
  readonly activityId: string;
}) {
  return (
    <details className="portal-panel portal-details">
      <summary>{ACTIVITY_UI.ARCHIVE}</summary>
      <div>
        <p className="portal-muted">{ACTIVITY_UI.ARCHIVE_NOTE}</p>
        <PortalForm
          action="archive-activity"
          organizationId={organizationId}
          submitLabel={ACTIVITY_UI.ARCHIVE}
          compact
        >
          <input type="hidden" name="activityId" value={activityId} />
          <label className="portal-check">
            <input type="checkbox" required />
            {PORTAL.CONFIRM_MANAGEMENT}
          </label>
        </PortalForm>
      </div>
    </details>
  );
}

function ActivityMeta({
  activity,
  organizationId,
}: {
  readonly activity: PortalOverview['activities'][number];
  readonly organizationId: string;
}) {
  return (
    <section className="portal-panel portal-activity-summary">
      <div className="portal-activity-meta">
        <strong>{formatMoney(activity.priceCents, activity.currency)}</strong>
        <span>{AUDIENCE_LABELS[activity.audiencePolicy]}</span>
        <span>{PAYMENT_LABELS[activity.paymentMode]}</span>
        <span>{activity.isActive ? PORTAL.ACTIVE : PORTAL.ARCHIVED}</span>
      </div>
      <AttendeesLink organizationId={organizationId} activityId={activity.id} />
    </section>
  );
}

function AttendeesLink({
  organizationId,
  activityId,
}: {
  readonly organizationId: string;
  readonly activityId: string;
}) {
  return (
    <Link
      className="liquid-ice-button portal-button"
      href={`/app/${organizationId}/reservations?activityId=${activityId}`}
    >
      {PORTAL.VIEW_ATTENDEES}
    </Link>
  );
}
