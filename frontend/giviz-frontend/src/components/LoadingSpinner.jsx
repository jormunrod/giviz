export default function LoadingSpinner({ text = "Loading..." }) {
  return (
    <div className="flex flex-col items-center justify-center py-8">
      <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-givizBlue3 mb-4"></div>
      <span className="text-givizBlue3 font-semibold text-lg mt-2">{text}</span>
    </div>
  );
}
