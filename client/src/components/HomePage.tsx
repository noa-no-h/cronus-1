import { useNavigate } from 'react-router-dom';
import { AppLayout } from './AppLayout';

export default function HomePage() {
  const navigate = useNavigate();

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto px-4 py-16">
        <div className="text-center space-y-6">
          <h1 className="text-4xl font-bold">Welcome to PROJECT_NAME</h1>
          <p className="text-lg text-muted-foreground">Your minimalistic SaaS template</p>
        </div>
      </div>
    </AppLayout>
  );
}
