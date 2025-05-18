import { Button } from './ui/button';

export const EndOfBlogPostCTASection = () => {
  return (
    <div className="my-12 p-8 bg-muted rounded-lg">
      <div className="max-w-2xl mx-auto text-center">
        <h2 className="text-2xl font-semibold mb-4">Ready to Transform Your Research?</h2>
        <p className="text-muted-foreground mb-6">
          Sign up now to unlock unlimited AI-powered research capabilities and generate 100%
          accurate data tables in seconds.
        </p>
        <Button size="lg" onClick={() => (window.location.href = '/login?reason=blog-post-cta')}>
          Get Started Free
        </Button>
      </div>
    </div>
  );
};
