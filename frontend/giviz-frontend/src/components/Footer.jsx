export default function Footer() {
  return (
    <footer className="w-full text-center py-4 text-sm text-gray-600 bg-white border-t border-gray-200">
      <p>
        © 2025 GIVIZ ·{' '}
        <a
          href="https://github.com/jormunrod"
          target="_blank"
          rel="noopener noreferrer"
          className="text-givizBlue3 hover:text-givizBlue4 transition-colors"
        >
          @jormunrod
        </a>
      </p>
    </footer>
  );
}