import { Footer } from '~/components/footer';
import { Header } from '~/components/header';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />

      <main className="pt-16 tablet:pt-[90px] px-4 tablet:px-12 desktop:px-[180px] py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl tablet:text-4xl font-bold text-primary mb-8">Privacy Policy</h1>

          <div className="prose prose-lg max-w-none text-primary space-y-6">
            <p className="text-lg text-primary-80">
              Last updated: {new Date().toLocaleDateString()}
            </p>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-primary">Information We Collect</h2>
              <p>
                Cronus collects information to provide better services to our users. We collect
                information in the following ways:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Information you give us (such as your name and email address)</li>
                <li>
                  Information we get from your use of our services (such as activity tracking data)
                </li>
                <li>Device information (such as your operating system and application usage)</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-primary">How We Use Information</h2>
              <p>We use the information we collect to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Provide, maintain, and improve our services</li>
                <li>Develop new features and functionality</li>
                <li>Communicate with you about our services</li>
                <li>Protect Cronus and our users</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-primary">Third-Party Services</h2>
              <p>
                To provide our services, we work with the following trusted third-party providers:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  <strong>OpenAI:</strong> We use OpenAI&apos;s services to process and analyze your
                  activity data to provide AI-powered insights and categorization
                </li>
                <li>
                  <strong>Google OAuth:</strong> We use Google&apos;s authentication service for
                  secure login and calendar integration (calendar integration is currently in
                  development)
                </li>
                <li>
                  <strong>MongoDB:</strong> We use MongoDB as our database service to store your
                  account and activity data
                </li>
                <li>
                  <strong>PostHog:</strong> We use PostHog for basic user analytics to understand
                  how our application is used and improve the user experience
                </li>
              </ul>
              <p>
                These services may have access to your data as necessary to provide their
                functionality. Each service operates under their own privacy policies and terms of
                service.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-primary">Information Sharing</h2>
              <p>
                We share personal information with the third-party services listed above as
                necessary to provide our services. We do not sell or share your personal information
                for advertising or marketing purposes.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-primary">Data Security</h2>
              <p>
                We take reasonable measures to protect your information, though no method of
                transmission over the internet or electronic storage is 100% secure. We work with
                reputable third-party services that maintain their own security practices.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-primary">Data Retention</h2>
              <p>
                We retain personal information only for as long as necessary to provide our services
                and fulfill the purposes outlined in this privacy policy. When we no longer need
                personal information, we securely delete or anonymize it.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-primary">Your Rights</h2>
              <p>You have the right to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Access the personal information we hold about you</li>
                <li>Request correction of inaccurate personal information</li>
                <li>Request deletion of your personal information</li>
                <li>Object to processing of your personal information</li>
                <li>Request data portability</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-primary">Contact Us</h2>
              <p>If you have any questions about this Privacy Policy, please contact us at:</p>
              <p>Email: wallawitsch@gmail.com</p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-primary">Changes to This Policy</h2>
              <p>
                We may update this Privacy Policy from time to time. We will notify you of any
                changes by posting the new Privacy Policy on this page and updating the &quot;Last
                updated&quot; date.
              </p>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
