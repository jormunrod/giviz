import { useState } from "react";

export default function InfoTooltip({ text }) {
  const [show, setShow] = useState(false);

  return (
    <span className="relative inline-block align-middle">
      <button
        type="button"
        aria-label="More info"
        className="ml-2 text-gray-400 hover:text-blue-500 focus:outline-none"
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onFocus={() => setShow(true)}
        onBlur={() => setShow(false)}
      >
        <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
          <circle
            cx="10"
            cy="10"
            r="9"
            stroke="currentColor"
            strokeWidth="2"
            fill="white"
          />
          <text
            x="10"
            y="15"
            textAnchor="middle"
            fontSize="13"
            fill="currentColor"
          >
            ?
          </text>
        </svg>
      </button>
      {show && (
        <div className="absolute z-10 left-1/2 -translate-x-1/2 mt-1 w-44 p-2 bg-white border border-gray-300 rounded shadow text-xs text-gray-700 max-w-xs">
          {text}
        </div>
      )}
    </span>
  );
}
