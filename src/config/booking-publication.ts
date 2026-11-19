type PublicationSettings = {
  readonly NEXT_PUBLIC_APP_URL: string;
  readonly PUBLIC_BOOKING_URL?: string;
  readonly PUBLIC_BOOKING_ORGANIZATION_ID?: string;
};
export function publicBookingOrigin(value: string) {
  try {
    const url = new URL(value);
    return (
      url.protocol === 'https:' &&
      url.pathname === '/' &&
      !url.username &&
      !url.password &&
      !url.search &&
      !url.hash
    );
  } catch {
    return false;
  }
}
export function bookingPublication(organizationId: string, settings: PublicationSettings) {
  const published = Boolean(
    settings.PUBLIC_BOOKING_URL && settings.PUBLIC_BOOKING_ORGANIZATION_ID === organizationId,
  );
  return {
    appUrl: published
      ? (settings.PUBLIC_BOOKING_URL ?? settings.NEXT_PUBLIC_APP_URL)
      : settings.NEXT_PUBLIC_APP_URL,
    published,
  };
}
