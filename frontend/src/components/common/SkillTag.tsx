interface SkillTagProps {
  skill: string;
  variant: 'matched' | 'transferable' | 'gap';
  className?: string;
}

export default function SkillTag({ skill, variant, className = '' }: SkillTagProps) {
  const baseClasses = "px-3 py-1 rounded-full text-xs font-medium";

  const variantClasses = {
    matched: "bg-[#22C55E] text-white",           // Green - full match
    transferable: "bg-[#3B82F6] text-white",      // Blue - related/transferable skill
    gap: "bg-[#F59E0B] text-white",               // Orange - skill gap
  }[variant];

  const icon = {
    matched: '✓ ',
    transferable: '~ ',
    gap: '⚠ ',
  }[variant];

  return (
    <span className={`${baseClasses} ${variantClasses} ${className}`}>
      {icon}
      {skill}
    </span>
  );
}
