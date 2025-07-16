import { useNavigate } from 'react-router-dom';
import { AppLayout } from './AppLayout';

export default function HomePage() {
  const navigate = useNavigate();

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto px-4 py-16">
        <div className="text-center space-y-6">welcome to dashboard homepage</div>
      </div>
    </AppLayout>
  );
}
