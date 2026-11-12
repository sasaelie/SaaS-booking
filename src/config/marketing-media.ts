import { PLATFORM_BRAND } from './platform-brand';
export const MARKETING_MEDIA = {
  MONOGRAM: PLATFORM_BRAND.MONOGRAM,
  SIZE: { width: 1200, height: 630 },
  COLORS: {
    scene: '#e8eee6',
    forest: '#143d2b',
    link: '#1b654b',
    paper: '#ffffff',
    mist: '#d9e8e5',
  },
} as const;
export const SOCIAL_CARD_STYLES = {
  root: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    width: '100%',
    height: '100%',
    padding: '68px',
    background: MARKETING_MEDIA.COLORS.scene,
    color: MARKETING_MEDIA.COLORS.forest,
  },
  brand: { display: 'flex', alignItems: 'center', gap: '16px', fontSize: '25px', fontWeight: 600 },
  mark: {
    display: 'flex',
    padding: '14px 20px',
    borderRadius: '16px',
    background: MARKETING_MEDIA.COLORS.paper,
  },
  panel: {
    display: 'flex',
    flexDirection: 'column',
    padding: '36px',
    background: MARKETING_MEDIA.COLORS.paper,
    borderRadius: '32px',
    border: `1px solid ${MARKETING_MEDIA.COLORS.mist}`,
  },
  title: { fontSize: '64px', fontWeight: 600, lineHeight: '1.1', letterSpacing: '-2px' },
  subtitle: {
    fontSize: '52px',
    lineHeight: '1.2',
    marginTop: '12px',
    color: MARKETING_MEDIA.COLORS.link,
  },
  audience: { fontSize: '23px', marginTop: '26px' },
  footer: { display: 'flex', justifyContent: 'space-between', fontSize: '20px' },
} as const;
