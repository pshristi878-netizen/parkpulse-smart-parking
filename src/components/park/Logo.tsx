import { Zap } from "lucide-react";

export function Logo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizes = {
    sm: { icon: 18, text: "text-lg", pad: "p-1.5" },
    md: { icon: 22, text: "text-xl", pad: "p-2" },
    lg: { icon: 28, text: "text-2xl", pad: "p-2.5" },
  }[size];

  return (
    <div className="flex items-center gap-2">
      <div
        className={`${sizes.pad} rounded-2xl bg-gradient-primary shadow-glow`}
      >
        <Zap
          size={sizes.icon}
          className="text-primary-foreground"
          strokeWidth={2.5}
          fill="currentColor"
        />
      </div>
      <span className={`${sizes.text} font-bold tracking-tight`}>
        ParkPulse
      </span>
    </div>
  );
}
