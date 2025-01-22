import { AuthForm } from "@/components/auth/AuthForm";

const SignUp = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center">
      <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold text-center mb-6">Create a LoCo Account</h1>
        <AuthForm defaultMode="register" />
      </div>
    </div>
  );
};

export default SignUp;