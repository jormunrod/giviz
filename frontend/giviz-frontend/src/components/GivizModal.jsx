import React from "react";

export default function GivizModal({
  open,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = "Continue",
  cancelText = "Cancel",
}) {
  if (!open) return null;
  const renderButton = (content, handler, defaultClass) => {
    if (React.isValidElement(content)) {
      return React.cloneElement(content, { onClick: handler });
    }
    return (
      <button className={defaultClass} onClick={handler}>
        {content}
      </button>
    );
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full animate-fade-in">
        {title && (
          <h2 className="text-lg font-semibold mb-2 text-givizBlue4">
            {title}
          </h2>
        )}
        <p className="mb-6 text-gray-700">{message}</p>
        <div className="flex justify-end gap-3">
          {renderButton(
            cancelText,
            onCancel,
            "px-4 py-2 rounded bg-gray-200 text-gray-700 hover:bg-gray-300 transition"
          )}
          {renderButton(
            confirmText,
            onConfirm,
            "px-4 py-2 rounded bg-givizBlue4 text-white hover:bg-givizBlue3 transition"
          )}
        </div>
      </div>
    </div>
  );
}
