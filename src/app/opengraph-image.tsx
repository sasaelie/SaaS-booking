import { ImageResponse } from 'next/og';
import { MARKETING } from '../config/marketing';
import { MARKETING_MEDIA as MEDIA, SOCIAL_CARD_STYLES as styles } from '../config/marketing-media';
export const alt = MARKETING.DESCRIPTION;
export const size = MEDIA.SIZE;
export const contentType = 'image/png';
export default function SocialImage() {
  return new ImageResponse(<SocialCard />, size);
}
function SocialCard() {
  return (
    <div style={styles.root}>
      <div style={styles.brand}>
        <span style={styles.mark}>{MEDIA.MONOGRAM}</span>
        {MARKETING.BRAND}
      </div>
      <div style={styles.panel}>
        <span style={styles.title}>{MARKETING.HERO_FIRST}</span>
        <span style={styles.subtitle}>{MARKETING.HERO_SECOND}</span>
        <span style={styles.audience}>{MARKETING.EYEBROW}</span>
      </div>
      <div style={styles.footer}>
        <span>{MARKETING.REASSURANCE[0]}</span>
        <span>{MARKETING.REASSURANCE[1]}</span>
      </div>
    </div>
  );
}
