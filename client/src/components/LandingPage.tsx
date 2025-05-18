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
    words: ['product', 'travel location', 'lead', 'company', 'prospect', 'VC'],
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
      <div className="w-full text-center py-16 md:py-24 space-y-6">
        <h1 className="text-4xl md:text-6xl font-bold my-6">
          <span>
            AI agents that research
            <br />
            {text}
            <Cursor cursorStyle="|" />
            <br></br> and output <span className="text-[#4169E1]">tables</span>
          </span>
        </h1>

        <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
          Intelligent web research assistant that helps you make informed decisions. From travel
          planning to product research, we analyze the web to give you comprehensive, table-based
          insights.
        </p>

        {/* Try it free now button */}
        <div className="flex justify-center mt-8">
          <Button
            className="bg-[#4169E1] hover:bg-[#3a5ecc] text-white px-8 py-6 text-lg"
            onClick={() => navigate('/login')}
          >
            Try it free now
          </Button>
        </div>
      </div>

      <div className="flex flex-row items-center justify-center mt-12 mb-8">
        <p className="text-muted-foreground">© 2025 PROJECT_NAME Inc.</p>
      </div>
    </div>
  );
};

export default LandingPage;
