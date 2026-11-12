import { AuthEntry, type AuthEntryProps } from '../_auth/AuthEntry';
export default function Page(props: AuthEntryProps) {
  return <AuthEntry {...props} mode="SIGN_UP" />;
}
