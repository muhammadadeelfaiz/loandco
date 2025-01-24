import { AuthForm } from "@/components/auth/AuthForm";
import Navigation from "@/components/Navigation";

const SignUp = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation user={null} />
      <div className="min-h-[calc(100vh-73px)] dark:bg-gradient-to-br dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 bg-gradient-to-br from-blue-50/50 to-white flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-card p-6 md:p-8 rounded-lg shadow-lg border border-border">
          <div className="space-y-2 text-center mb-6">
            <h1 className="text-2xl font-bold tracking-tight">Create an Account</h1>
            <p className="text-muted-foreground">
              Enter your details below to create your account
            </p>
          </div>
          <AuthForm defaultMode="register" />
        </div>
      </div>
    </div>
  );
};

export default SignUp;