import { ManageBooking } from './ManageBooking';
export const dynamic = 'force-dynamic';
export default function ManagePage() {
  return (
    <main className="participant-page">
      <ManageBooking />
    </main>
  );
}
