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
            <p className="text-md text-primary-80">
              Last updated: {new Date().toLocaleDateString()}
            </p>

            <div className="rounded-lg border bg-muted p-4 not-prose">
              <p className="text-sm text-muted-foreground">
                <strong className="text-foreground">TL;DR:</strong> We are GDPR compliant, aligning
                with one of the world&apos;s most protective data privacy laws. This ensures your
                data is handled with the highest standard of care, transparency, and security.
              </p>
            </div>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-primary">Information We Collect</h2>
              <p>
                Cronus collects information to provide better services to our users. We collect
                information in the following ways:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  <strong>Information You Provide:</strong> This includes your name and email
                  address when you register for an account.
                </li>
                <li>
                  <strong>Activity and Usage Data:</strong> We collect data from your device to
                  power our automatic time-tracking features. This includes metadata about the
                  applications you use and the websites you visit, such as window titles and URLs.
                  <br />
                  <br />
                  For more accurate categorization, you can optionally grant permission for screen
                  recordings. This feature captures screenshots that are processed locally on your
                  device to extract text. These screenshots and the extracted text are{' '}
                  <strong>never sent to our servers or stored.</strong> If you choose not to enable
                  this optional feature, we only collect the basic metadata mentioned above.
                </li>
                <li>
                  <strong>Device Information:</strong> We collect basic information about your
                  device, such as its operating system, to ensure our service is compatible and to
                  improve functionality.
                </li>
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
              <h2 className="text-2xl font-semibold text-primary">
                Google API Services and Limited Use Disclosure
              </h2>
              <p>
                The use of information received from Google APIs will adhere to the{' '}
                <a
                  href="https://developers.google.com/terms/api-services-user-data-policy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 underline"
                >
                  Google API Services User Data Policy
                </a>
                , including the Limited Use requirements.
              </p>
              <p className="mt-4">
                <strong>Limited Use Disclosure:</strong> Our application&apos;s use of information
                received from Google Workspace APIs will adhere to{' '}
                <a
                  href="https://developers.google.com/workspace/workspace-api-user-data-developer-policy#limited-use"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 underline"
                >
                  Google&apos;s Limited Use requirements
                </a>
                . The use of information received from Google Workspace APIs will adhere to the
                Limited Use requirements. Specifically, we affirm that:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  We only use Google user data to provide and improve our time tracking and
                  productivity analysis services.
                </li>
                <li>We do not use Google user data for serving advertisements.</li>
                <li>
                  We do not allow humans to read Google user data unless:
                  <ul className="list-disc pl-6 mt-2">
                    <li>We have your explicit consent</li>
                    <li>It is necessary for security purposes</li>
                    <li>It is required to comply with applicable laws</li>
                  </ul>
                </li>
                <li>
                  We do not sell Google user data or share it with third parties except as necessary
                  to provide and improve our services.
                </li>
              </ul>
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
              <p>
                To exercise any of these rights, please contact us at the email address provided in
                the &quot;Contact Us&quot; section. We will process your request in accordance with
                applicable data protection laws. When you request data portability, we will provide
                your data in a structured and machine-readable format.
              </p>
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
