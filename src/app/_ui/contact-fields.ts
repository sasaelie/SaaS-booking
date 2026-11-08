import { FORM_LABELS, INPUT_LIMITS } from '../../config/constants';
export const CONTACT_FIELDS = [
  {
    label: FORM_LABELS.FIRST_NAME,
    name: 'firstName',
    autoComplete: 'given-name',
    required: true,
    minLength: INPUT_LIMITS.NAME_MIN,
    maxLength: INPUT_LIMITS.NAME_MAX,
  },
  {
    label: FORM_LABELS.LAST_NAME,
    name: 'lastName',
    autoComplete: 'family-name',
    required: true,
    minLength: INPUT_LIMITS.NAME_MIN,
    maxLength: INPUT_LIMITS.NAME_MAX,
  },
  {
    label: FORM_LABELS.EMAIL,
    name: 'email',
    type: 'email',
    autoComplete: 'email',
    required: true,
    maxLength: INPUT_LIMITS.EMAIL_MAX,
  },
] as const;
