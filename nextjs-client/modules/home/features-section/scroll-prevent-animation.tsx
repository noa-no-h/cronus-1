'use client';
import { useRive } from '@rive-app/react-canvas';

export function ScrollPreventAnimation() {
  const { rive, RiveComponent } = useRive({
    src: '/rive/doom-scroll-prevention.riv',
    autoplay: true,
  });

  return (
    <RiveComponent
      className="size-full"
      onMouseEnter={() => rive && rive.play()}
      onMouseLeave={() => rive && rive.pause()}
    />
  );
}
