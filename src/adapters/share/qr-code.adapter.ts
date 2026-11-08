import QRCode from 'qrcode';
import { SAAS, ERROR_CODES } from '../../config/constants';
import { failure } from '../../lib/errors';
import { ok } from '../../lib/result';
import type { QrCodePort } from '../../core/ports/public-catalog.port';
export class QrCodeAdapter implements QrCodePort {
  async encode(url: string) {
    try {
      const png = await QRCode.toBuffer(url, {
        type: 'png',
        width: SAAS.QR_SIZE,
        margin: SAAS.QR_MARGIN,
        errorCorrectionLevel: 'M',
      });
      return ok(new Uint8Array(png));
    } catch {
      return failure(ERROR_CODES.INTERNAL_ERROR, 'Share', 'qr');
    }
  }
}
