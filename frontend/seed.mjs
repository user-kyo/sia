import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://zodcdrhtylrpcduameeq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpvZGNkcmh0eWxycGNkdWFtZWVxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA3MjI2ODcsImV4cCI6MjA5NjI5ODY4N30.lhwyX0A2cRk03VTOlgmwcYZhefQZxsTSv-m-Vh7VdAA';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const usersToSeed = [
  { email: 'super@salesinvent.com', role: 'super_admin', name: 'Super Admin User' },
  { email: 'admin@salesinvent.com', role: 'admin', name: 'Admin User' },
  { email: 'staff@salesinvent.com', role: 'staff', name: 'Staff User' },
];

async function seed() {
  for (const u of usersToSeed) {
    console.log(`Attempting to seed ${u.email}...`);
    const { data, error } = await supabase.auth.signUp({
      email: u.email,
      password: 'Password123!',
      options: {
        data: {
          full_name: u.name,
          role: u.role,
          status: 'approved'
        }
      }
    });

    if (error) {
      console.error(`Failed to seed ${u.email}:`, error.message);
    } else {
      console.log(`Successfully seeded ${u.email}`);
    }
  }
}

seed();
