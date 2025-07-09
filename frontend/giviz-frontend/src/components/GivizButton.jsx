export default function GivizButton({
  children,
  type = "button",
  className = "",
  variant = "primary",
  ...props
}) {
  let variantClass = "";
  if (variant === "secondary") {
    variantClass =
      "bg-gray-200 text-givizBlue4 border-gray-300 hover:bg-gray-300 hover:text-givizBlue4";
  } else {
    variantClass =
      "text-white bg-givizBlue3 border-givizBlue4 hover:bg-givizBlue4";
  }
  return (
    <button
      type={type}
      className={`appearance-none rounded-md font-medium border border-black shadow-[3px_3px_0px_0px_#0F172A] hover:shadow-[1px_1px_0px_0px_#0F172A] hover:translate-y-[1px] transition-all cursor-pointer px-6 py-2 ${variantClass} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
