import React from 'react';
import { useNavigate } from 'react-router-dom';
import icon from '../assets/icon.png';
import { APP_NAME, APP_USP } from '../lib/constants';
import { Button } from './ui/button';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center p-4">
      <img src={icon} alt={APP_NAME} className="w-24 h-24 mb-8" />
      <h1 className="text-6xl md:text-8xl font-bold my-6">
        <span className="text-primary dark:text-[#6c74d4]">{APP_NAME}</span>
      </h1>
      <p className="text-xl md:text-2xl mt-4 max-w-3xl dark:text-white text-black mb-4">
        {APP_USP}
      </p>
      <div className="flex justify-center mt-6">
        <Button className="px-8 py-6 text-lg" onClick={() => navigate('/signup')}>
          Signup
        </Button>
      </div>
    </div>
  );
};

export default LandingPage;
