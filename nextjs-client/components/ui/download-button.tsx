'use client';

import { Download } from 'lucide-react';
import { useState } from 'react';
import { cn } from '~/lib/cn';
import { trackDownloadIntent } from '~/lib/analytics';
import DownloadModal from './download-modal';

interface DownloadButtonProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary';
  children?: React.ReactNode;
  location?: string;
}

const DownloadButton: React.FC<DownloadButtonProps> = ({
  className,
  size = 'md',
  variant = 'primary',
  children = 'Download Cronus',
  location = 'unknown',
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenModal = () => {
    trackDownloadIntent(location);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const sizeClasses = {
    sm: 'py-2 px-4 text-xs',
    md: 'py-2.5 px-6 text-sm',
    lg: 'py-3 px-8 text-base',
  };

  const variantClasses = {
    primary: 'bg-primary hover:bg-[#1a1a2e] text-white',
    secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-900',
  };

  return (
    <>
      <button
        onClick={handleOpenModal}
        className={cn(
          'inline-flex cursor-pointer hover:scale-105 transition-all items-center gap-2 rounded-md font-semibold',
          sizeClasses[size],
          variantClasses[variant],
          className
        )}
      >
        <Download size={16} />
        {children}
      </button>

      <DownloadModal isOpen={isModalOpen} onClose={handleCloseModal} />
    </>
  );
};

export default DownloadButton;
