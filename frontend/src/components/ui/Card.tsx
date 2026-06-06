import React from 'react';
interface CardProps { title?: string; children?: React.ReactNode; className?: string; noPadding?: boolean; }
const Card = ({ title, children, className = '', noPadding = false }: CardProps) => (
  <div className={`bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300 dark:bg-gray-800 dark:border-gray-700 ${className}`}>
    {title && <div className="px-6 py-4 border-b border-gray-50 dark:border-gray-700"><h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">{title}</h3></div>}
    <div className={noPadding ? '' : 'p-6'}>{children}</div>
  </div>
);
export default Card;