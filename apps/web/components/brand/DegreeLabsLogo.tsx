import Image from "next/image";

type DegreeLabsLogoProps = {
  size?: "compact" | "default" | "large";
  priority?: boolean;
  className?: string;
};

const sizeStyles = {
  compact: {
    container: "w-[185px]",
    tagline: "pl-[23%] text-[8px] tracking-[0.34em]",
  },
  default: {
    container: "w-[215px]",
    tagline: "pl-[23%] text-[9px] tracking-[0.36em]",
  },
  large: {
    container: "w-[280px]",
    tagline: "pl-[23%] text-[11px] tracking-[0.38em]",
  },
} as const;

export function DegreeLabsLogo({
  size = "default",
  priority = false,
  className = "",
}: DegreeLabsLogoProps) {
  const styles = sizeStyles[size];

  return (
    <span
      className={`inline-flex shrink-0 flex-col ${styles.container} ${className}`}
      aria-label="DegreeLabs — Learn. Solve. Grow"
    >
      <Image
        src="/degreelabs-logo.png"
        alt="DegreeLabs"
        width={1754}
        height={372}
        priority={priority}
        className="h-auto w-full"
      />
      <span
        aria-hidden="true"
        className={`-mt-0.5 whitespace-nowrap font-semibold leading-none text-slate-900 ${styles.tagline}`}
      >
        Learn. Solve. Grow
      </span>
    </span>
  );
}
