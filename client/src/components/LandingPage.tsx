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
    words: ['today', 'this week', 'this month', 'this year'],
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
    <div className="relative min-h-screen flex flex-col md:flex-row max-w-full">
      {/* Left side: hero and footer */}
      <div className="flex-1 flex flex-col justify-between">
        {/* hero section */}
        <div className="w-full text-left py-12 md:py-24 space-y-6 px-4 md:px-12">
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
          <div className="flex justify-center md:justify-start mt-12">
            <Button
              className="bg-[#4169E1] hover:bg-[#3a5ecc] text-white px-8 py-6 text-lg"
              onClick={() => navigate('/login')}
            >
              Make Elon your executive coach
            </Button>
          </div>
        </div>
        {/* Footer */}
        <div className="flex flex-row items-center justify-start px-4 md:px-12 mb-4 md:mb-8 mt-auto sticky md:static bottom-0 left-0">
          <p className="text-muted-foreground">© 2025 whatdidyougetdonetoday labs inc.</p>
        </div>
      </div>
      {/* Right side: rocket image (hidden on mobile) */}
      <div className="hidden md:block md:w-1/2 h-screen fixed right-0 top-0 z-0">
        <img src="/rocket.jpeg" alt="Rocket Launch" className="object-cover w-full h-full" />
      </div>
      {/* Spacer for content to not go under image on desktop */}
      <div className="hidden md:block md:w-1/2"></div>
    </div>
  );
};

export default LandingPage;
