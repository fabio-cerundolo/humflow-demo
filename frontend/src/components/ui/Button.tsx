import React from 'react';

export interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline';
  onClick?: () => void;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
}

const Button = ({ children, variant = 'primary', onClick, disabled, type = 'button', className = '' }: ButtonProps) => {
  const baseStyles = "font-medium py-2.5 px-5 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";
  
  // Aggiungiamo le classi 'dark:' per la modalità scura
  const variants = {
    primary: "bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-200 dark:shadow-none focus:ring-indigo-500",
    secondary: "bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 shadow-sm dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-700 focus:ring-gray-200 dark:focus:ring-gray-600",
    outline: "bg-transparent hover:bg-indigo-50 text-indigo-600 border border-indigo-200 dark:border-indigo-800 dark:text-indigo-400 dark:hover:bg-indigo-900/30 focus:ring-indigo-500"
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      type={type}
      className={`${baseStyles} ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
};

export default Button;