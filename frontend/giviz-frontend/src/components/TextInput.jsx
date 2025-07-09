export default function TextInput({
  value,
  onChange,
  placeholder = "",
  className = "",
  ...props
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={`px-4 py-2 rounded-md border border-black shadow-[3px_3px_0px_0px_#0F172A] hover:shadow-[2px_2px_0px_0px_#0F172A] hover:translate-y-[0.5px] focus:shadow-[1px_1px_0px_0px_#0F172A] focus:translate-y-[1px] focus:outline-none focus:ring-2 focus:ring-givizBlue3 text-sm transition-all ${className}`}
      {...props}
    />
  );
}
