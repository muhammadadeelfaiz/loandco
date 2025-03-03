
import { AuthForm } from "@/components/auth/AuthForm";
import Navigation from "@/components/Navigation";

const SignUp = () => {
  return (
    <div className="flex flex-col min-h-[calc(100vh-53px)]">
      <Navigation user={null} />
      <div className="flex-1 bg-gradient-to-br from-blue-50/50 to-white dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-8 bg-card p-8 rounded-xl shadow-lg border border-border">
          <div className="space-y-2 text-center">
            <h1 className="text-3xl font-bold tracking-tight">Create an Account</h1>
            <p className="text-muted-foreground">
              Join our community and start exploring
            </p>
          </div>
          <AuthForm defaultMode="register" />
        </div>
      </div>
    </div>
  );
};

export default SignUp;
