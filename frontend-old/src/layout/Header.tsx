// src/components/layout/Header.tsx
import React from "react";
import { Breadcrumb } from "../components/ui/Breadcrumb";

export const Header: React.FC = () => (
  <header className="bg-white border-b border-gray-200 shadow-sm">
    <div className="container mx-auto flex items-center justify-between px-4 py-3">
      {/* Logo */}
      <div className="flex items-center space-x-2">
        <img src="/logo.svg" alt="Humflow" className="h-8 w-auto" />
        <span className="font-semibold text-gray-800 text-lg">
          Humflow Demo
        </span>
      </div>

      {/* Search bar */}
      <div className="flex-1 mx-4 max-w-xl">
        <div className="relative">
          <input
            type="text"
            placeholder="Cerca..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <svg
            className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z"
            />
          </svg>
        </div>
      </div>

      {/* Profile menu */}
      <div className="flex items-center space-x-3">
        <span className="text-gray-600 hidden md:inline">Nome Utente</span>
        <button className="focus:outline-none">
          <img
            src="/avatar.png"
            alt="avatar"
            className="h-8 w-8 rounded-full border border-gray-300"
          />
        </button>
      </div>
    </div>

    {/* Breadcrumb – sarà gestito dalle singole pagine */}
    {/* <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Dashboard" }]} /> */}
  </header>
);