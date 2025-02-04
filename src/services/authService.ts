import { supabase } from "@/lib/supabase";

export const signInWithEmail = async (email: string, password: string) => {
  try {
    // Try direct email login first
    const { data: emailData, error: emailError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (emailError) {
      // If email login fails, check if input might be a username
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('email')
        .eq('username', email)
        .maybeSingle();

      if (userError || !userData) {
        throw new Error("Invalid email/username or password");
      }

      // Try login with the found email
      const { data, error } = await supabase.auth.signInWithPassword({
        email: userData.email,
        password,
      });

      if (error) {
        if (error.message.includes("Email not confirmed")) {
          throw new Error(
            "Please verify your email before signing in. Check your inbox for the verification link."
          );
        }
        throw new Error("Invalid email/username or password");
      }

      return data;
    }

    return emailData;
  } catch (error) {
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

    if (existingUser) {
      throw new Error("Username already taken");
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData,
        emailRedirectTo: `${window.location.origin}/signin`,
      },
    });

    if (error) {
      if (error.message.includes("over_email_send_rate_limit")) {
        throw new Error("Please wait 45 seconds before trying again.");
      }
      throw error;
    }

    // Insert the user data into the users table
    const { error: insertError } = await supabase
      .from('users')
      .insert([
        {
          email,
          name: userData.name,
          username: userData.username,
          role: userData.role,
          date_of_birth: userData.date_of_birth,
        }
      ]);

    if (insertError) {
      throw new Error("Failed to create user profile");
    }
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("An unexpected error occurred during sign up");
  }
};

export const signInWithOAuth = async (
  provider: 'facebook' | 'google',
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

    if (error) throw error;
    return data;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("An unexpected error occurred during OAuth sign in");
  }
};