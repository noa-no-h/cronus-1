'use client';

import { Download } from 'lucide-react';
import { useState } from 'react';
import { trackDownloadIntent } from '~/lib/analytics';
import { Button } from './button';
import DownloadModal from './download-modal';

interface DownloadButtonProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary' | 'outline';
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

  return (
    <>
      <Button
        onClick={handleOpenModal}
        className={className}
        size={size}
        variant={variant}
        icon={<Download size={16} />}
      >
        {children}
      </Button>

      <DownloadModal isOpen={isModalOpen} onClose={handleCloseModal} />
    </>
  );
};

export default DownloadButton;
