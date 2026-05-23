import { HalconLogo } from '~/components/halcon-logo';
import { cn } from '~/lib/utils';

export function Wordmark({
  className,
  logoClassName = 'size-7',
  textClassName = 'text-lg',
}: {
  className?: string;
  logoClassName?: string;
  textClassName?: string;
}) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <HalconLogo className={logoClassName} />
      <span className={cn('font-semibold tracking-tight', textClassName)}>
        Halcón<span className="text-primary">OS</span>
      </span>
    </div>
  );
}
