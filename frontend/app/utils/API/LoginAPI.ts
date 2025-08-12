/* eslint-disable @typescript-eslint/no-explicit-any */
import { supabase } from "@/app/utils/Server/supabaseClient";  // Import supabase client

export const loginUser = async (email: string, password: string) => {
  try {
    console.log("Attempting to login with:", { email, password });

    // Use Supabase's auth API to login with email and password
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error; // Throw an error if login fails

    // Store the access token for axios
    if (data?.session?.access_token) {
      localStorage.setItem('token', data.session.access_token);
    }

    // Accessing the user from the `data` object
    const user = data?.user;  // Access user inside data
    console.log("Login successful:", user);  // Log the user object after successful login
    return user;  // Return user data if login is successful
  } catch (error: any) {
    // Detailed error handling
    console.error("Login error:", error.message);
    throw new Error(`Login failed: ${error.message || 'Unknown error'}`);  // Throw a custom error
  }
};
