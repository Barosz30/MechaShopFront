interface SectionHeadingProps {
  eyebrow: string;
  title: string;
  description: string;
  align?: 'left' | 'center';
}

function SectionHeading({
  eyebrow,
  title,
  description,
  align = 'left',
}: SectionHeadingProps) {
  const alignmentClass = align === 'center' ? 'mx-auto text-center' : '';

  return (
    <div className={`max-w-3xl ${alignmentClass}`}>
      <p className="text-xs font-semibold uppercase tracking-[0.35em] text-cyan-300/80">
        {eyebrow}
      </p>
      <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
        {title}
      </h2>
      <p className="mt-4 text-base leading-7 text-slate-300 sm:text-lg">{description}</p>
    </div>
  );
}

export default SectionHeading;
