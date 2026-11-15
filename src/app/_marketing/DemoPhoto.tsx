'use client';
import Image from 'next/image';
import { MARKETING_PREVIEW } from '../../config/marketing-preview';
import { MARKETING_VISUALS } from '../../config/marketing-visuals';
import { useMarketingDemo } from './MarketingDemo';
export function DemoPhoto({ decorative = false }: { readonly decorative?: boolean }) {
  const { state, exampleTransition } = useMarketingDemo();
  const examples = MARKETING_PREVIEW.EXAMPLES;
  const current = state.exampleIndex;
  const from =
    exampleTransition === 'in' ? (current + examples.length - 1) % examples.length : current;
  const to = exampleTransition === 'out' ? (current + 1) % examples.length : current;
  return (
    <>
      {[...new Set([from, to])].map((index) => {
        const example = examples[index] ?? examples[0];
        const overlay = index !== from;
        return (
          <Image
            key={example.key}
            className={`marketing-demo-photo${decorative ? ' marketing-preview-photo' : ''}${overlay ? ' marketing-demo-photo-blend' : ''}`}
            src={example.image}
            alt={decorative || index !== current ? '' : example.imageAlt}
            aria-hidden={index !== current || decorative}
            data-photo-current={index === current}
            fill
            loading="eager"
            sizes={MARKETING_VISUALS.IMAGE_SIZES}
          />
        );
      })}
    </>
  );
}
