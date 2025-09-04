'use client';

import { AnimatePresence, motion } from 'framer-motion';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { trackDownloadStart } from '~/lib/analytics';
import { Button } from './button';
import { Input } from './input';
import { Caveat } from 'next/font/google';
import { X } from 'lucide-react';

const caveat = Caveat({ subsets: ['latin'], weight: '700' });

interface DownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  autoFocusWindowsWaitlist?: boolean;
}

const DownloadModal: React.FC<DownloadModalProps> = ({
  isOpen,
  onClose,
  autoFocusWindowsWaitlist,
}) => {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const windowsWaitlistInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isOpen && autoFocusWindowsWaitlist) {
      setTimeout(() => {
        windowsWaitlistInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen, autoFocusWindowsWaitlist]);

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

  const handleWaitlistSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/windows-waitlist`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        setIsSubmitted(true);
      }
    } catch (error) {
      console.error('Error submitting to waitlist:', error);
    }
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

  if (!isClient) {
    return null;
  }

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 flex items-center justify-center bg-black/50 z-[60]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
        >
          <motion.div
            className="bg-white p-8 rounded-2xl shadow-lg max-w-md w-full mx-4 font-serif relative"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top-right close */}
            <button
              onClick={onClose}
              aria-label="Close"
              className="absolute top-3 right-3 rounded-full p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-center justify-center gap-2 mb-4">
              {/* <Image
                src="/icons/apple.png"
                alt="Apple Logo"
                width={24}
                height={24}
                className="w-6 h-6"
              /> */}
              {/* <h2 className="text-2xl font-bold text-gray-900">Download Cronus</h2> */}
            </div>

            {/* Sunset/Hold Notice */}
            <div className="rounded-md border border-neutral-200 bg-zinc-50 text-neutral-800 p-4 mb-2 text-sm leading-6">
              Hello everyone, we’ve stopped operating Cronus. Thank you for your support. The
              website remains available.
            </div>
            <div className={`${caveat.className} text-2xl text-neutral-700 mt-2`}>
              Moritz & Arne
            </div>

            {/* <p className="text-gray-600 mb-6 text-center">
              Choose the version that matches your Mac:
            </p> */}

            {/* <div className="flex flex-col space-y-4">
              <button
                onClick={() => handleDownload(downloadUrls.armUrl, 'arm64')}
                className="flex-1 px-4 py-3 bg-primary text-white rounded-lg hover:bg-dark-hover text-center font-semibold transition-all hover:scale-105"
              >
                Download for Apple Silicon (M1-M4)
              </button>
              <button
                onClick={() => handleDownload(downloadUrls.intelUrl, 'x64')}
                className="flex-1 px-4 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 text-center font-semibold transition-all hover:scale-105"
              >
                Download for Intel
              </button>
            </div> */}

            {/* Windows Waitlist Section */}
            {/* <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="flex items-center justify-center gap-2 mb-3">
                <Image
                  src="/icons/windows.png"
                  alt="Windows Logo"
                  width={24}
                  height={24}
                  className="w-6 h-6"
                />
                <h3 className="text-lg font-semibold text-gray-800">Using Windows?</h3>
              </div>
              <p className="text-sm text-gray-600 mb-4 text-center">
                Join our waitlist to be notified when Windows version is available
              </p> */}

            {/* {!isSubmitted ? (
              <form onSubmit={handleWaitlistSubmit} className="flex flex-col space-y-3">
                <Input
                  ref={windowsWaitlistInputRef}
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full"
                />
                <Button type="submit" variant="outline" className="w-full">
                  Join Waitlist
                </Button>
              </form>
            ) : (
              <p className="text-green-600 text-center text-sm">
                Thanks for joining! We&apos;ll notify you when Windows version is ready.
              </p>
            )} */}
            {/* Bottom cancel removed in favor of top-right close */}
            {/* <button
              onClick={onClose}
              type="button"
              className="w-full mt-6 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button> */}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.getElementById('modal-root')!
  );
};

export default DownloadModal;
