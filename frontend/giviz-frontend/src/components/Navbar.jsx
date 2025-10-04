import { useEffect, useState, useCallback } from "react";
import GivizModal from "./GivizModal";
import GivizButton from "./GivizButton";

export default function Navbar() {
  const [modalOpen, setModalOpen] = useState(false);
  const [pendingNav, setPendingNav] = useState(null);

  const warningMsg =
    "Navigating to the homepage will cause you to lose the data of the repository you are analyzing. Do you want to continue?";

  const handleLogoClick = useCallback((e) => {
    e.preventDefault();
    setPendingNav(() => () => (window.location.href = "/"));
    setModalOpen(true);
  }, []);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setPendingNav(() => () => window.location.reload());
      setModalOpen(true);
      e.returnValue = warningMsg;
      return warningMsg;
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, []);

  const handleConfirm = () => {
    setModalOpen(false);
    if (pendingNav) pendingNav();
  };
  const handleCancel = () => {
    setModalOpen(false);
    setPendingNav(null);
  };

  return (
    <>
      <GivizModal
        open={modalOpen}
        title="Warning"
        message={warningMsg}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        confirmText={<GivizButton size="sm">Continue</GivizButton>}
        cancelText={
          <GivizButton size="sm" variant="secondary">
            Cancel
          </GivizButton>
        }
      />
      <nav className="w-full px-6 py-4 bg-white shadow-sm fixed top-0 left-0 z-10 flex items-center justify-between">
        <a
          href="/"
          onClick={handleLogoClick}
          className="group flex items-center cursor-pointer transition-opacity hover:opacity-95 focus:opacity-95"
          aria-label="GIVIZ homepage"
        >
          <img
            src="/giviz_logo.png"
            alt="GIVIZ logo"
            className="h-6 w-auto transition-all duration-300 ease-out group-hover:scale-105 group-hover:[filter:drop-shadow(0_0_5px_rgba(118,192,255,0.9))_drop-shadow(0_0_16px_rgba(63,124,247,0.65))]"
          />
        </a>
        <a
          href="https://github.com/jormunrod/giviz"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-givizBlue4 transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-6 h-6 align-middle"
            aria-label="GitHub logo"
          >
            <path
              fillRule="evenodd"
              d="M12 2C6.477 2 2 6.484 2 12.021c0 4.428 2.865 8.184 6.839 9.504.5.092.682-.217.682-.483 0-.237-.009-.868-.014-1.703-2.782.605-3.369-1.342-3.369-1.342-.454-1.155-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.004.07 1.532 1.032 1.532 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.339-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.025A9.564 9.564 0 0 1 12 6.844c.85.004 1.705.115 2.504.337 1.909-1.295 2.748-1.025 2.748-1.025.546 1.378.202 2.397.1 2.65.64.7 1.028 1.595 1.028 2.688 0 3.847-2.338 4.695-4.566 4.944.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.749 0 .268.18.579.688.481C19.138 20.2 22 16.447 22 12.021 22 6.484 17.523 2 12 2Z"
              clipRule="evenodd"
            />
          </svg>
          <span className="align-middle">GitHub</span>
        </a>
      </nav>
    </>
  );
}
