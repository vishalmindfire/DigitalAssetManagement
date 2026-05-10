import { useEffect, useRef } from 'react';

type PopupProps = {
  open: boolean;
  title: string;
  message: string;
  onClose: () => void;
};

export default function Popup({ open, title, message, onClose }: PopupProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    closeButtonRef.current?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="
        fixed inset-0 z-50
        flex items-center justify-center
        bg-black/50
        p-4
      "
      aria-hidden={!open}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="popup-title"
        aria-describedby="popup-description"
        className="
          w-full max-w-md
          rounded-2xl
          bg-white
          shadow-xl
          dark:bg-gray-900
        "
      >
        {/* Header */}
        <div
          className="
            flex items-center justify-between
            border-b
            px-5 py-4
          "
        >
          <h2
            id="popup-title"
            className="
              text-lg font-semibold
              text-gray-900
              dark:text-white
            "
          >
            {title}
          </h2>

          <button
            ref={closeButtonRef}
            onClick={onClose}
            aria-label="Close popup"
            className="
              rounded-md
              p-2
              text-gray-500
              hover:bg-gray-100
              focus:outline-none
              focus:ring-2
              focus:ring-blue-500
            "
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4">
          <p
            id="popup-description"
            className="
              text-sm text-gray-600
              dark:text-gray-300
            "
          >
            {message}
          </p>
        </div>

        {/* Footer */}
        <div
          className="
            flex justify-end
            border-t
            px-5 py-4
          "
        >
          <button
            onClick={onClose}
            className="
              rounded-lg
              bg-blue-600
              px-4 py-2
              text-sm font-medium text-white
              hover:bg-blue-700
              focus:outline-none
              focus:ring-2
              focus:ring-blue-500
            "
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
