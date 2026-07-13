import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export default function Card({ children, className }: CardProps) {
  return (
    <div className={`bg-white border border-neutral-200 rounded-md overflow-hidden ${className ?? ''}`}>
      {children}
    </div>
  );
}
