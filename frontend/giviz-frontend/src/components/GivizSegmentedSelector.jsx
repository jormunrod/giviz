import GivizButton from "./GivizButton";

export default function GivizSegmentedSelector({
  options,
  value,
  onChange,
  className = "",
}) {
  return (
    <div className={`flex gap-2 ${className}`}>
      {options.map((opt) => (
        <GivizButton
          key={opt.value}
          variant={value === opt.value ? "primary" : "secondary"}
          className="text-xs px-3 py-1"
          onClick={() => value !== opt.value && onChange(opt.value)}
        >
          {opt.label}
        </GivizButton>
      ))}
    </div>
  );
}
