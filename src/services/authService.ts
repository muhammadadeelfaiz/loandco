import { supabase } from "@/lib/supabase";

export const signInWithEmail = async (email: string, password: string) => {
  // Try login with email first
  const { data: emailData, error: emailError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (emailError && emailError.message.includes("Invalid login credentials")) {
    // If email login fails, try with username
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('email')
      .eq('username', email)
      .single();

    if (userError) throw new Error("Invalid username/store name or password");

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
      throw error;
    }

    return data;
  }

  return emailData;
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

  if (insertError) throw insertError;
};

export const signInWithOAuth = async (
  provider: 'facebook' | 'google',
  mode: 'login' | 'register',
  role?: string
) => {
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
};