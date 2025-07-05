import { Footer } from '~/components/footer';
import { Header } from '~/components/header';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />

      <main className="pt-16 tablet:pt-[90px] px-4 tablet:px-12 desktop:px-[180px] py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl tablet:text-4xl font-bold text-primary mb-8">
            Terms and Conditions
          </h1>

          <div className="prose prose-lg max-w-none text-primary space-y-6">
            <p className="text-lg text-[#242437CC]">
              Last updated: {new Date().toLocaleDateString()}
            </p>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-primary">1. Agreement to Terms</h2>
              <p>
                By accessing or using Cronus, you agree to be bound by these Terms and Conditions
                and our Privacy Policy. If you disagree with any part of the terms, you do not have
                permission to access or use our services.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-primary">2. Description of Service</h2>
              <p>
                Cronus is a productivity tracking application that helps users understand how they
                spend their time on their computer. The service includes:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Activity tracking and categorization</li>
                <li>AI-powered insights and analytics</li>
                <li>Calendar integration features</li>
                <li>Productivity reporting and visualization</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-primary">3. User Accounts</h2>
              <p>To use Cronus, you must create an account. You are responsible for:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Maintaining the confidentiality of your account credentials</li>
                <li>All activities that occur under your account</li>
                <li>Notifying us immediately of any unauthorized use</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-primary">4. Acceptable Use</h2>
              <p>You agree not to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Use the service for any illegal purpose</li>
                <li>Attempt to gain unauthorized access to any part of the service</li>
                <li>Interfere with or disrupt the service or servers</li>
                <li>Reverse engineer or attempt to extract the source code of our software</li>
                <li>Use the service in a way that violates any applicable laws or regulations</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-primary">
                5. Data Collection and Privacy
              </h2>
              <p>Our service collects and processes data about your computer usage, including:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Application names and window titles</li>
                <li>Activity duration and timestamps</li>
                <li>Content from active windows using local OCR (when permitted)</li>
              </ul>
              <p>
                All data collection and processing is subject to our Privacy Policy. By using
                Cronus, you consent to such processing and warrant that all data you provide is
                accurate.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-primary">6. Intellectual Property</h2>
              <p>
                The service and its original content, features, and functionality are owned by
                Cronus and are protected by international copyright, trademark, patent, trade
                secret, and other intellectual property or proprietary rights laws.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-primary">
                7. Subscription and Payments
              </h2>
              <p>
                Some features of Cronus require a paid subscription. By subscribing, you agree to:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Pay all applicable fees</li>
                <li>Provide current, complete, and accurate billing information</li>
                <li>Allow automatic renewal unless cancelled</li>
                <li>Accept our refund and cancellation policies</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-primary">8. Disclaimer of Warranties</h2>
              <p>
                The service is provided &quot;as is&quot; and &quot;as available&quot; without
                warranties of any kind, either express or implied. We do not warrant that the
                service will be uninterrupted, timely, secure, or error-free.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-primary">9. Limitation of Liability</h2>
              <p>
                To the fullest extent permitted by law, Cronus shall not be liable for any indirect,
                incidental, special, consequential, or punitive damages resulting from your use or
                inability to use the service.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-primary">10. Changes to Terms</h2>
              <p>
                We reserve the right to modify these terms at any time. We will notify users of any
                material changes via email or through the application. Your continued use of Cronus
                after such modifications constitutes acceptance of the updated terms.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-primary">11. Contact Information</h2>
              <p>For any questions about these Terms and Conditions, please contact us at:</p>
              <p>Email: wallawitsch@gmail.com, arne.strickmann@googlemail.com</p>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
