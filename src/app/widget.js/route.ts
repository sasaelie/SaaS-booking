import { publicWidgetScript } from '../../composition/widget';
export function GET(): Response {
  return new Response(publicWidgetScript(), {
    headers: {
      'Content-Type': 'application/javascript; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
