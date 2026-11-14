import Image from 'next/image';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { MARKETING_VISUALS as UI } from '../../config/marketing-visuals';
import { IceIcon } from '../_ui/IceIcon';
export function PreviewStage({
  image,
  children,
}: {
  readonly image: string;
  readonly children: ReactNode;
}) {
  return (
    <div className="marketing-visual-stage">
      <div className="marketing-stage-photo">
        <Image src={image} alt="" fill loading="eager" sizes={UI.IMAGE_SIZES} />
      </div>
      <Link className="marketing-price-float" href="#tarifs">
        <span>{UI.FLOATING_PLAN}</span>
        <strong>
          {UI.FLOATING_PRICE}
          <small>{UI.FLOATING_PERIOD}</small>
        </strong>
        <span>{UI.FLOATING_FEES}</span>
        <span className="ice-sr-only">{UI.PLAN_LINK}</span>
        <IceIcon name="arrow" />
      </Link>
      <div className="marketing-stage-front">{children}</div>
    </div>
  );
}
