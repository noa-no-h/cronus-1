'use client';

import { useState, useEffect } from 'react';
import { Header } from '~/components/header';
import Spinner from '~/components/ui/spinner';

export default function GetStartedPage() {
  const [isVideoLoading, setIsVideoLoading] = useState(true);

  useEffect(() => {
    // Simulate video loading - in reality, we'd want to hook into the iframe's load event
    const timer = setTimeout(() => {
      setIsVideoLoading(false);
    }, 1500); // Show spinner for 1.5s minimum

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-4xl mx-auto px-4 py-12 pt-32">
        <div className="text-center space-y-6 mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <h1 className="text-3xl font-bold text-gray-900">Get started with Cronus</h1>
          </div>

          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Launch the app after it completes downloading. Watch the video below to get up and
            running fast.
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="aspect-video w-full rounded-lg overflow-hidden relative">
            {isVideoLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                <Spinner />
              </div>
            )}
            <iframe
              src="https://www.loom.com/embed/34531aee1ce94343a2c4c7cee04a0dc8"
              className="w-full h-full border-0"
              allowFullScreen
              title="Cronus Tutorial - Get Started"
              onLoad={() => setIsVideoLoading(false)}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
