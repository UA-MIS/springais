interface SkillTagProps {
  skill: string;
  variant: 'matched' | 'gap';
  className?: string;
}

export default function SkillTag({ skill, variant, className = '' }: SkillTagProps) {
  const baseClasses = "px-3 py-1 rounded-full text-xs font-medium";
  const variantClasses = variant === 'matched' 
    ? "bg-[#22C55E] text-white"
    : "bg-[#F59E0B] text-white";

  return (
    <span className={`${baseClasses} ${variantClasses} ${className}`}>
      {variant === 'matched' && '✓ '}
      {variant === 'gap' && '⚠ '}
      {skill}
    </span>
  );
}
