'use client';

import { XIcon } from 'lucide-react';
import { useState } from 'react';
import { Button } from './button';
import { Input } from './input';

interface DemoBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DemoBookingModal({ isOpen, onClose }: DemoBookingModalProps) {
  const [email, setEmail] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [teamSize, setTeamSize] = useState('');
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/teams-waitlist`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          companyName,
          teamSize,
          additionalInfo: additionalInfo || undefined,
        }),
      });

      if (response.ok) {
        setIsSubmitted(true);
      }
    } catch (error) {
      console.error('Error submitting demo request:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setEmail('');
    setCompanyName('');
    setTeamSize('');
    setAdditionalInfo('');
    setIsSubmitted(false);
    setIsLoading(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-500/80 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Book a Demo</h2>
          <button
            onClick={handleClose}
            className="text-gray-500 cursor-pointer hover:text-gray-700 text-2xl"
          >
            <XIcon className="w-6 h-6" />
          </button>
        </div>

        {!isSubmitted ? (
          <>
            <p className="text-gray-600 mb-6">
              Enter your email and team size and we'll reach out to you as soon as we can.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full"
                />
              </div>

              <div>
                <Input
                  type="text"
                  placeholder="Company Name"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  required
                  className="w-full"
                />
              </div>

              <div>
                <Input
                  type="text"
                  placeholder="Team Size"
                  value={teamSize}
                  onChange={(e) => setTeamSize(e.target.value)}
                  required
                  className="w-full"
                />
              </div>

              <div>
                <Input
                  type="textarea"
                  placeholder="Anything else?"
                  value={additionalInfo}
                  onChange={(e) => setAdditionalInfo(e.target.value)}
                  className="w-full"
                />
              </div>

              <p className="text-sm text-gray-500 mt-4">
                We will never share any of your personal or private information with anyone.
              </p>

              <Button
                type="submit"
                className="w-full bg-accent hover:bg-accent/90 text-white"
                disabled={isLoading}
              >
                {isLoading ? 'SENDING...' : 'SEND'}
              </Button>
            </form>
          </>
        ) : (
          <div className="text-center">
            <div className="mb-4">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <svg
                  className="w-8 h-8 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Thank you!</h3>
            <p className="text-gray-600 mb-6">
              We've received your demo request. We'll reach out to you soon to schedule your
              personalized demo.
            </p>
            <Button onClick={handleClose} className="w-full">
              Close
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
