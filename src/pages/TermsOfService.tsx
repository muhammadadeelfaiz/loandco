
import Navigation from "@/components/Navigation";
import { useUser } from "@/hooks/useUser";

const TermsOfService = () => {
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
          <h1 className="text-3xl font-bold mb-6">Terms of Service</h1>
          
          <section className="space-y-4">
            <h2 className="text-xl font-semibold">1. Acceptance of Terms</h2>
            <p>By accessing and using our services, you agree to be bound by these Terms of Service.</p>
          </section>

          <section className="mt-8 space-y-4">
            <h2 className="text-xl font-semibold">2. User Accounts</h2>
            <p>You are responsible for:</p>
            <ul className="list-disc pl-6">
              <li>Maintaining the confidentiality of your account</li>
              <li>All activities that occur under your account</li>
              <li>Notifying us of any unauthorized use</li>
            </ul>
          </section>

          <section className="mt-8 space-y-4">
            <h2 className="text-xl font-semibold">3. Acceptable Use</h2>
            <p>You agree not to:</p>
            <ul className="list-disc pl-6">
              <li>Violate any laws or regulations</li>
              <li>Infringe on others' rights</li>
              <li>Use the service for unauthorized purposes</li>
            </ul>
          </section>

          <p className="mt-8 text-sm text-gray-600 dark:text-gray-400">Last updated: {new Date().toLocaleDateString()}</p>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;
