export default function Navbar() {
  return (
    <nav className="w-full px-6 py-4 bg-white shadow-sm fixed top-0 left-0 z-10 flex items-center justify-between">
      <h1 className="text-xl font-semibold text-givizBlue4">GIVIZ</h1>
      <a
        href="https://github.com/jormunrod/giviz"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 text-sm text-gray-600 hover:text-givizBlue4 transition-colors"
      >
        <span>GitHub</span>
        <span className="text-lg">🐙</span>
      </a>
    </nav>
  );
}