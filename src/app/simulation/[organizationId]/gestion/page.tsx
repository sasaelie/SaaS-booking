import { ManageBooking } from '../../../manage/ManageBooking';
export default async function Page({ params }: { readonly params: Promise<{ organizationId: string }> }) {
  const { organizationId } = await params;
  return <ManageBooking simulationId={organizationId} />;
}
