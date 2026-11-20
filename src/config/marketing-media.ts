import { PLATFORM_BRAND } from './platform-brand';
export const MARKETING_MEDIA = {
  MONOGRAM: PLATFORM_BRAND.MONOGRAM,
  SIZE: { width: 1200, height: 630 },
  COLORS: {
    scene: '#dfe6f5',
    ink: '#1a1730',
    accent: '#5b35b4',
    violet: '#d9c8f4',
    cyan: '#bdeaf1',
    orange: '#f2d0c1',
    paper: '#ffffff',
    rim: 'rgba(255, 255, 255, 0.8)',
    surface: 'rgba(255, 255, 255, 0.55)',
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
    background: `linear-gradient(135deg, ${MARKETING_MEDIA.COLORS.violet}, ${MARKETING_MEDIA.COLORS.scene} 45%, ${MARKETING_MEDIA.COLORS.cyan} 72%, ${MARKETING_MEDIA.COLORS.orange})`,
    color: MARKETING_MEDIA.COLORS.ink,
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
    background: MARKETING_MEDIA.COLORS.surface,
    borderRadius: '22px',
    border: `1px solid ${MARKETING_MEDIA.COLORS.rim}`,
  },
  title: { fontSize: '64px', fontWeight: 600, lineHeight: '1.1', letterSpacing: '-2px' },
  subtitle: {
    fontSize: '52px',
    lineHeight: '1.2',
    marginTop: '12px',
    color: MARKETING_MEDIA.COLORS.accent,
  },
  audience: { fontSize: '23px', marginTop: '26px' },
  footer: { display: 'flex', justifyContent: 'space-between', fontSize: '20px' },
} as const;
