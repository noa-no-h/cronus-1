import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Cursor, useTypewriter } from 'react-simple-typewriter';
import { Button } from './ui/button';

interface LandingPageProps {
  landingPageKeyword?: string;
}

const LandingPage: React.FC<LandingPageProps> = ({ landingPageKeyword }) => {
  // const [prompt, setPrompt] = useState('');
  const navigate = useNavigate();

  const [text] = useTypewriter({
    words: ['today', 'this week'],
    loop: true,
    delaySpeed: 500,
    deleteSpeed: 100,
  });

  // const handleSubmit = (e: React.FormEvent) => {
  //   e.preventDefault();
  //   if (prompt.trim()) {
  //     // Navigate to research page with the query parameter
  //     navigate(`/new?q=${encodeURIComponent(prompt.trim())}`);
  //   }
  // };

  return (
    <div className="max-w-5xl mx-auto px-4">
      {/* hero section */}
      <div className="w-full text-left py-12 md:py-24 space-y-6">
        <h1 className="text-6xl md:text-8xl font-bold my-6">
          <span className="text-[#1d278f] dark:text-[#6c74d4]">Elon</span>
        </h1>
        <div className="text-3xl md:text-4xl font-semibold dark:text-white text-black mb-4">
          What did you get done{' '}
          <span>
            {text}
            <Cursor cursorStyle="|" />
          </span>
          ?
        </div>
      </div>
      {/* Try it free now button */}
      <div className="flex justify-center mt-12">
        <Button
          className="bg-[#4169E1] hover:bg-[#3a5ecc] text-white px-8 py-6 text-lg"
          onClick={() => navigate('/login')}
        >
          Try it free now
        </Button>
      </div>

      <div className="flex flex-row items-center justify-center mt-12 mb-8">
        <p className="text-muted-foreground">© 2025 whatdidyougetdonetoday labs inc.</p>
      </div>
    </div>
  );
};

export default LandingPage;
