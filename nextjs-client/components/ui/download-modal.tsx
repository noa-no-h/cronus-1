'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useEffect } from 'react';
import { trackDownloadStart } from '~/lib/analytics';

interface DownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DownloadModal: React.FC<DownloadModalProps> = ({ isOpen, onClose }) => {
  const handleDownload = (url: string, type: 'arm64' | 'x64') => {
    // Track actual download start
    trackDownloadStart(type);

    window.open(url, '_blank');
    // Redirect to get-started page after download
    setTimeout(() => {
      window.location.href = '/get-started';
    }, 500);
    onClose();
  };

  // Handle escape key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  const downloadUrls = {
    armUrl: 'https://cronusnewupdates.s3.amazonaws.com/Cronus-latest-arm64.dmg',
    intelUrl: 'https://cronusnewupdates.s3.amazonaws.com/Cronus-latest-x64.dmg',
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 flex items-center justify-center bg-black/50 z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
        >
          <motion.div
            className="bg-white p-8 rounded-2xl shadow-lg max-w-md w-full mx-4"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-2xl font-bold mb-4 text-center text-gray-900">Download Cronus</h2>
            <p className="text-gray-600 mb-6 text-center">
              Choose the version that matches your Mac:
            </p>

            <div className="flex flex-col space-y-4">
              <button
                onClick={() => handleDownload(downloadUrls.armUrl, 'arm64')}
                className="flex-1 px-4 py-3 bg-[#242437] text-white rounded-lg hover:bg-[#1a1a2e] text-center font-semibold transition-all hover:scale-105"
              >
                Download for Apple Silicon (M1-M4)
              </button>
              <button
                onClick={() => handleDownload(downloadUrls.intelUrl, 'x64')}
                className="flex-1 px-4 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 text-center font-semibold transition-all hover:scale-105"
              >
                Download for Intel
              </button>
            </div>

            <button
              onClick={onClose}
              type="button"
              className="w-full mt-6 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default DownloadModal;
