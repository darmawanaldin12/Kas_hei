import { iconResponse } from '../../lib/icon';

export const runtime = 'edge';

export function GET() {
  return iconResponse(512);
}
