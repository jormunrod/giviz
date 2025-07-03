export default function GivizButton({ children, type = "button", className = "", ...props }) {
  return (
    <button
      type={type}
      className={`appearance-none text-white bg-givizBlue3 rounded-md font-medium border border-givizBlue4 shadow-[3px_3px_0px_0px_#0F172A] hover:shadow-[1px_1px_0px_0px_#0F172A] hover:translate-y-[1px] transition-all cursor-pointer px-6 py-2 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}