export default function Card({ children, className = "" }) {
  return (
    <div
      className={`relative overflow-hidden bg-givizBlue1 p-6 rounded-2xl shadow-[6px_6px_0px_0px_#0F172A] border border-black ${className}`}
    >
      {children}
    </div>
  );
}
