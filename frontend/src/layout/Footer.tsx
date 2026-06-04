// src/components/layout/Footer.tsx
import React from "react";

export const Footer: React.FC = () => (
  <footer className="bg-white border-t border-gray-200 py-3 text-center text-sm text-gray-600">
    © {new Date().getFullYear()} Humflow Demo – <a href="/privacy" className="underline hover:text-gray-800">Privacy</a> •{" "}
    <a href="/terms" className="underline hover:text-gray-800">Termini</a>
  </footer>
);