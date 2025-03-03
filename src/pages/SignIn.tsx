
import { AuthForm } from "@/components/auth/AuthForm";
import Navigation from "@/components/Navigation";

const SignIn = () => {
  return (
    <div className="flex flex-col min-h-[calc(100vh-53px)]">
      <Navigation user={null} />
      <div className="flex-1 dark:bg-gradient-to-br dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 bg-gradient-to-br from-blue-50/50 to-white flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-background p-6 md:p-8 rounded-lg shadow-lg">
          <h1 className="text-2xl font-bold text-center mb-6">Sign In to LoCo</h1>
          <AuthForm defaultMode="login" />
        </div>
      </div>
    </div>
  );
};

export default SignIn;
