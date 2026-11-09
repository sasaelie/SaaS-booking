import { generateFormattedVoucherCode } from '../../../core/domain/voucher-engine';
import { INPUT_LIMITS } from '../../../config/constants';
import { required } from '../transaction';
export function newVoucherCode() {
  return required(
    generateFormattedVoucherCode(crypto.getRandomValues(new Uint8Array(INPUT_LIMITS.HASH_LENGTH))),
  );
}
