
import { supabase } from "@/lib/supabase";

export const signInWithEmail = async (email: string, password: string) => {
  try {
    // First try direct email login
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      // If direct email login fails and input doesn't contain @, try username lookup
      if (!email.includes('@')) {
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('email')
          .eq('username', email)
          .single();

        if (userError) {
          console.error("Error finding user by username:", userError);
          throw new Error("Invalid username or password");
        }

        if (userData) {
          // Try login with found email
          const { data: emailData, error: emailError } = await supabase.auth.signInWithPassword({
            email: userData.email,
            password,
          });

          if (emailError) {
            console.error("Login error with found email:", emailError);
            throw new Error("Invalid username or password");
          }

          return emailData;
        } else {
          throw new Error("User not found");
        }
      }

      // Handle specific error cases
      if (error.message.includes("Email not confirmed")) {
        throw new Error(
          "Please verify your email before signing in. Check your inbox for the verification link."
        );
      }
      
      console.error("Authentication error:", error);
      throw new Error("Invalid email or password");
    }

    return data;
  } catch (error) {
    console.error("Authentication error:", error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("An unexpected error occurred during sign in");
  }
};

export const signUpWithEmail = async (
  email: string,
  password: string,
  userData: {
    role: string;
    name: string;
    username: string;
    date_of_birth: string;
  }
) => {
  try {
    // Check if username already exists
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('username')
      .eq('username', userData.username)
      .maybeSingle();

    if (checkError) {
      console.error("Error checking existing username:", checkError);
      throw new Error("Error checking username availability");
    }

    if (existingUser) {
      throw new Error("Username already taken");
    }

    // Sign up the user
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData,
        emailRedirectTo: `${window.location.origin}/signin`,
      },
    });

    if (error) {
      console.error("Signup error:", error);
      if (error.message.includes("over_email_send_rate_limit")) {
        throw new Error("Please wait 45 seconds before trying again.");
      }
      throw error;
    }

    return data;
  } catch (error) {
    console.error("Sign up error:", error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("An unexpected error occurred during sign up");
  }
};

export const signInWithOAuth = async (
  provider: 'google',
  mode: 'login' | 'register',
  role?: string
) => {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/`,
        queryParams: mode === 'register' ? {
          default_role: role
        } : undefined
      }
    });

    if (error) {
      console.error("OAuth error:", error);
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error("OAuth sign in error:", error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("An unexpected error occurred during OAuth sign in");
  }
};
