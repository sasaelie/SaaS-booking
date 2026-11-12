export async function signOutRequest() {
  try {
    const response = await fetch('/api/auth/sign-out', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
    });
    return response.ok;
  } catch {
    return false;
  }
}
