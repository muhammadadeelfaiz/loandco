
import Navigation from "@/components/Navigation";
import { useUser } from "@/hooks/useUser";

const PrivacyPolicy = () => {
  const { user, loading } = useUser();

  if (loading) {
    return <div className="min-h-screen bg-gradient-loco flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
    </div>;
  }

  return (
    <div className="min-h-screen bg-gradient-loco">
      <Navigation user={user} />
      
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg">
          <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
          
          <section className="space-y-4">
            <h2 className="text-xl font-semibold">1. Information We Collect</h2>
            <p>We collect information that you provide directly to us when you:</p>
            <ul className="list-disc pl-6">
              <li>Create an account</li>
              <li>Use our services</li>
              <li>Make purchases or conduct transactions</li>
              <li>Contact us for support</li>
              <li>Browse product listings</li>
            </ul>
          </section>

          <section className="mt-8 space-y-4">
            <h2 className="text-xl font-semibold">2. Third-Party Integration</h2>
            <p>Our service integrates with third-party platforms including:</p>
            <ul className="list-disc pl-6">
              <li>eBay's API services for product listings and information</li>
              <li>Payment processing services</li>
              <li>Authentication services</li>
            </ul>
            <p>When using these services, you may be subject to their respective privacy policies.</p>
          </section>

          <section className="mt-8 space-y-4">
            <h2 className="text-xl font-semibold">3. How We Use Your Information</h2>
            <p>We use the information we collect to:</p>
            <ul className="list-disc pl-6">
              <li>Process your requests and transactions</li>
              <li>Provide personalized product recommendations</li>
              <li>Improve our services</li>
              <li>Send important notifications about your account or purchases</li>
              <li>Prevent fraud and enhance security</li>
            </ul>
          </section>

          <section className="mt-8 space-y-4">
            <h2 className="text-xl font-semibold">4. Information Sharing</h2>
            <p>We do not sell your personal information. We may share your information only in the following circumstances:</p>
            <ul className="list-disc pl-6">
              <li>With your explicit consent</li>
              <li>To comply with legal obligations</li>
              <li>To protect our rights and safety</li>
              <li>With service providers who assist in our operations</li>
            </ul>
          </section>

          <section className="mt-8 space-y-4">
            <h2 className="text-xl font-semibold">5. Data Security</h2>
            <p>We implement appropriate security measures to protect your personal information from unauthorized access, alteration, or destruction. This includes:</p>
            <ul className="list-disc pl-6">
              <li>Encryption of sensitive data</li>
              <li>Secure server infrastructure</li>
              <li>Regular security audits</li>
              <li>Access controls and authentication</li>
            </ul>
          </section>

          <section className="mt-8 space-y-4">
            <h2 className="text-xl font-semibold">6. Your Rights</h2>
            <p>You have the right to:</p>
            <ul className="list-disc pl-6">
              <li>Access your personal information</li>
              <li>Correct inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Opt-out of marketing communications</li>
              <li>Export your data</li>
            </ul>
          </section>

          <section className="mt-8 space-y-4">
            <h2 className="text-xl font-semibold">7. Contact Us</h2>
            <p>If you have any questions about this Privacy Policy, please contact us at:</p>
            <ul className="list-disc pl-6">
              <li>Email: privacy@example.com</li>
              <li>Address: 123 Privacy Street, Security City, 12345</li>
            </ul>
          </section>

          <p className="mt-8 text-sm text-gray-600 dark:text-gray-400">Last updated: {new Date().toLocaleDateString()}</p>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
