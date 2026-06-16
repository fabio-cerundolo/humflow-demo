// src/components/ui/Toast.tsx
import React from "react";

type ToastType = "success" | "error" | "warning" | "info";

interface ToastProps {
  id: string;
  type: ToastType;
  message: string;
  onClose: (id: string) => void;
}

export const Toast: React.FC<ToastProps> = ({
  id,
  type,
  message,
  onClose,
}) => {
  const bgMap: Record<ToastType, string> = {
    success: "bg-green-100 border-green-300 text-green-800",
    error: "bg-red-100 border-red-300 text-red-800",
    warning: "bg-yellow-100 border-yellow-300 text-yellow-800",
    info: "bg-blue-100 border-blue-300 text-blue-800",
  };

  return (
    <div
      role="status"
      aria-live="polite"
      className={`border-l-4 p-3 rounded shadow-sm mb-2 max-w-sm ${bgMap[type]}`}
    >
      <div className="flex justify-between items-center">
        <span>{message}</span>
        <button
          onClick={() => onClose(id)}
          className="ml-4 text-xl leading-none focus:outline-none"
        >
          &times;
        </button>
      </div>
    </div>
  );
};