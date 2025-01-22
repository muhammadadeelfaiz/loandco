import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://svdgniviotecguehvtig.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN2ZGduaXZpb3RlY2d1ZWh2dGlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc1NTE5ODAsImV4cCI6MjA1MzEyNzk4MH0.X6V8bw0SX-ZppIeIL6tXhqiXTej2shzJJ2PNxICWe8g';

export const supabase = createClient(supabaseUrl, supabaseKey);