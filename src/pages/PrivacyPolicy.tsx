const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white py-16">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto bg-white p-8 rounded-lg shadow-lg">
          <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
          
          <section className="space-y-4">
            <h2 className="text-xl font-semibold">1. Information We Collect</h2>
            <p>We collect information that you provide directly to us when you:</p>
            <ul className="list-disc pl-6">
              <li>Create an account</li>
              <li>Use our services</li>
              <li>Contact us for support</li>
            </ul>
          </section>

          <section className="mt-8 space-y-4">
            <h2 className="text-xl font-semibold">2. How We Use Your Information</h2>
            <p>We use the information we collect to:</p>
            <ul className="list-disc pl-6">
              <li>Provide and maintain our services</li>
              <li>Improve user experience</li>
              <li>Send important notifications</li>
            </ul>
          </section>

          <section className="mt-8 space-y-4">
            <h2 className="text-xl font-semibold">3. Information Sharing</h2>
            <p>We do not sell or rent your personal information to third parties. We may share your information only in the following circumstances:</p>
            <ul className="list-disc pl-6">
              <li>With your consent</li>
              <li>To comply with legal obligations</li>
              <li>To protect our rights and safety</li>
            </ul>
          </section>

          <p className="mt-8 text-sm text-gray-600">Last updated: {new Date().toLocaleDateString()}</p>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;