'use client';
import { getImageProps } from 'next/image';
import { useEffect } from 'react';
import { MARKETING_PREVIEW } from '../../config/marketing-preview';
import { MARKETING_VISUALS } from '../../config/marketing-visuals';
export function useDemoImages(exampleIndex: number) {
  useEffect(() => {
    const next =
      MARKETING_PREVIEW.EXAMPLES[(exampleIndex + 1) % MARKETING_PREVIEW.EXAMPLES.length] ??
      MARKETING_PREVIEW.EXAMPLES[0];
    const { props } = getImageProps({
      src: next.image,
      alt: '',
      fill: true,
      sizes: MARKETING_VISUALS.IMAGE_SIZES,
    });
    const image = new window.Image();
    image.decoding = 'async';
    image.fetchPriority = 'low';
    image.sizes = props.sizes ?? '';
    image.srcset = props.srcSet ?? '';
    image.src = props.src;
  }, [exampleIndex]);
}
