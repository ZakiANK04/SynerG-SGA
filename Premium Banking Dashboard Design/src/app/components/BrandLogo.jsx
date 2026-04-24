import { cn } from "./ui/utils";

export function BrandLogo({
  alt = "SynerG",
  className,
  imageClassName,
  compact = false,
  withPlate = false,
}) {
  const image = (
    <img
      alt={alt}
      className={cn("h-10 w-auto", compact ? "max-w-12" : "max-w-full", imageClassName)}
      src="/logo.png"
    />
  );

  if (withPlate) {
    return (
      <div
        className={cn(
          "inline-flex items-center justify-center rounded-2xl bg-white p-2 shadow-sm",
          className,
        )}
      >
        {image}
      </div>
    );
  }

  return <div className={className}>{image}</div>;
}
