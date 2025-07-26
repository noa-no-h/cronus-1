'use client';

import { Minus, Plus } from 'lucide-react';
import { ComponentProps, useState } from 'react';
import { Button } from '~/components/ui/button';
import DownloadModal from '~/components/ui/download-modal';
import { cn } from '~/lib/cn';

type FAQItem = {
  question: string;
  answer: React.ReactNode;
};

const faqData: FAQItem[] = [
  {
    question: 'How is it able to understand context?',
    answer:
      "Our app uses advanced AI models to analyze the text content of your active application. This allows it to understand the context of your work and categorize your activities with high accuracy. We're constantly improving our models to better understand a wider range of contexts.",
  },
  {
    question: 'Does it take screenshots of my screen?',
    answer: (
      <div>
        <p>
          Yes - but that's optional. You can also only give accessibility access which allows us to
          read the app meta-data (such as the title of your active browser tab). However this is
          less accurate, which is why most users enable sceenrecording access.
        </p>
        <p className="mt-2">
          We never send the screenshot to our server or store it. We only use it to extract the text
          which we use to categorize the content.
        </p>
        <p className="mt-2">
          You can read more about our privacy practices in our{' '}
          <a href="/privacy" className="underline">
            privacy policy
          </a>
          .
        </p>
      </div>
    ),
  },
  {
    question: 'Does the app work on Windows?',
    answer: <WindowsWaitlistTrigger />,
  },
  {
    question: "What's the cost?",
    answer:
      "It's completely free currently. We will likely add a small subscription in the future for advanced features. However we will never paywall the core time tracking funktionality.",
  },
];

function WindowsWaitlistTrigger() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  return (
    <>
      <div>
        <p>
          We are currently working on a Windows version. You can join the waitlist to be notified
          when it's available.
        </p>
        <Button onClick={() => setIsModalOpen(true)} className="mt-2">
          Join the waitlist
        </Button>
      </div>
      <DownloadModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        autoFocusWindowsWaitlist
      />
    </>
  );
}

const AccordionItem = ({
  item,
  isOpen,
  onClick,
}: {
  item: FAQItem;
  isOpen: boolean;
  onClick: () => void;
}) => {
  return (
    <div className="border-b border-gray-200 py-4">
      <button className="w-full flex justify-between items-center text-left" onClick={onClick}>
        <h3 className="text-lg font-medium">{item.question}</h3>
        {isOpen ? <Minus className="h-6 w-6" /> : <Plus className="h-6 w-6" />}
      </button>
      {isOpen && <div className="mt-4 text-gray-600">{item.answer}</div>}
    </div>
  );
};

export function FAQSection({ className, ...props }: ComponentProps<'section'>) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const handleClick = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className={cn('py-20', className)} {...props}>
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>
        <div className="max-w-3xl mx-auto">
          {faqData.map((item, index) => (
            <AccordionItem
              key={index}
              item={item}
              isOpen={openIndex === index}
              onClick={() => handleClick(index)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
