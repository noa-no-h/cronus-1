import { trpc } from '@/utils/trpc';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';

const WaitlistFormPage: React.FC = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    jobTitle: '',
    companyName: '',
    workEmail: '',
    useCase: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const navigate = useNavigate();

  // Use the mutation hook
  const submitWaitlistForm = trpc.auth.submitWaitlistForm.useMutation();

  // Get user data to check waitlist status
  const { data: userData } = trpc.auth.getUser.useQuery(
    { token: localStorage.getItem('accessToken') || '' },
    {
      enabled: !!localStorage.getItem('accessToken'),
    }
  );

  useEffect(() => {
    // Get the token from localStorage
    const storedToken = localStorage.getItem('accessToken');
    if (storedToken) {
      setToken(storedToken);
    } else {
      // If no token, redirect to login
      navigate('/login');
    }
  }, [navigate]);

  // If user is already waitlisted, show the submitted message
  if (userData?.isWaitlisted) {
    return (
      <div className="max-w-md mx-auto text-center py-12">
        <h2 className="text-2xl font-bold mb-4">Thank You!</h2>
        <p className="mb-4">You've been added to our waitlist. We'll be in touch soon!</p>
      </div>
    );
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      console.error('No authentication token found');
      navigate('/login');
      return;
    }

    setIsSubmitting(true);

    try {
      // Submit the waitlist form data to the server with the token
      await submitWaitlistForm.mutateAsync({
        ...formData,
        token,
      });

      setIsSubmitted(true);
    } catch (error: any) {
      console.error('Error submitting form:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="max-w-md mx-auto text-center py-12">
        <h2 className="text-2xl font-bold mb-4">Thank You!</h2>
        <p className="mb-4">You've been added to our waitlist. We'll be in touch soon!</p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Join Our Waitlist</CardTitle>
          <CardDescription>
            We're excited to have you join our exclusive beta program. Please fill out this short
            form to secure your spot.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  name="firstName"
                  placeholder="John"
                  required
                  value={formData.firstName}
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  name="lastName"
                  placeholder="Doe"
                  required
                  value={formData.lastName}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="jobTitle">Job Title (Optional)</Label>
              <Input
                id="jobTitle"
                name="jobTitle"
                placeholder="Product Manager"
                value={formData.jobTitle}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="companyName">Company Name (Optional)</Label>
              <Input
                id="companyName"
                name="companyName"
                placeholder="Acme Inc."
                value={formData.companyName}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="workEmail">Work Email</Label>
              <Input
                id="workEmail"
                name="workEmail"
                type="email"
                placeholder="john@company.com"
                required
                value={formData.workEmail}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="useCase">How do you plan to use PROJECT_NAME?</Label>
              <Textarea
                id="useCase"
                name="useCase"
                placeholder="Tell us about your use case"
                rows={3}
                value={formData.useCase}
                onChange={handleChange}
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-[#4169E1] hover:bg-[#3a5ecc]"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Join Waitlist'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default WaitlistFormPage;
