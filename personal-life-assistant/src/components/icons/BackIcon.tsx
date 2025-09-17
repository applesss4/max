import React from 'react';

interface BackIconProps {
  className?: string;
  ariaHidden?: boolean;
}

const BackIcon: React.FC<BackIconProps> = ({ 
  className = 'h-6 w-6', 
  ariaHidden = true 
}) => {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      className={className} 
      fill="none" 
      viewBox="0 0 24 24" 
      stroke="currentColor"
      aria-hidden={ariaHidden}
    >
      <path 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        strokeWidth={2} 
        d="M10 19l-7-7m0 0l7-7m-7 7h18" 
      />
    </svg>
  );
};

export default BackIcon;