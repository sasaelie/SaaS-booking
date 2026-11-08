import { portal } from '../../../../../composition/portal';
import { runtime } from '../../../../../composition/runtime';
import { HTTP_STATUS } from '../../../../../config/constants';
export async function GET(request: Request): Promise<Response> {
  const app = runtime();
  if (!app.ok) return new Response(null, { status: HTTP_STATUS.UNAVAILABLE });
  const query = new URL(request.url).searchParams;
  const service = portal(request.headers);
  if (!service.ok) return new Response(null, { status: HTTP_STATUS.UNAVAILABLE });
  const result = await service.value.connect.callback({
    state: query.get('state'),
    code: query.get('code'),
  });
  const path = result.ok
    ? `/app/${result.value.organizationId}/parametres?stripe=retour`
    : '/app?stripe=erreur';
  return Response.redirect(new URL(path, app.value.env.NEXT_PUBLIC_APP_URL), HTTP_STATUS.SEE_OTHER);
}
