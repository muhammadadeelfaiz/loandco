import { AuthForm } from "@/components/auth/AuthForm";

const SignIn = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white p-6 md:p-8 rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold text-center mb-6">Sign In to LoCo</h1>
        <AuthForm defaultMode="login" />
      </div>
    </div>
  );
};

export default SignIn;