import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://zodcdrhtylrpcduameeq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpvZGNkcmh0eWxycGNkdWFtZWVxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA3MjI2ODcsImV4cCI6MjA5NjI5ODY4N30.lhwyX0A2cRk03VTOlgmwcYZhefQZxsTSv-m-Vh7VdAA';
const BACKEND_URL = 'http://localhost:8000/api/v1';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const companiesToSeed = [
  {
    company_name: 'Tech Corp',
    admin_name: 'Tech Super Admin',
    admin_email: 'super1@stocknroll.com',
    admin_password: 'Password123!',
    users: [
      { email: 'admin1@stocknroll.com', role: 'admin', name: 'Tech Admin' },
      { email: 'staff1@stocknroll.com', role: 'staff', name: 'Tech Staff' }
    ]
  },
  {
    company_name: 'Global Trade',
    admin_name: 'Global Super Admin',
    admin_email: 'super2@stocknroll.com',
    admin_password: 'Password123!',
    users: [
      { email: 'admin2@stocknroll.com', role: 'admin', name: 'Global Admin' },
      { email: 'staff2@stocknroll.com', role: 'staff', name: 'Global Staff' }
    ]
  }
];

async function seed() {
  for (const company of companiesToSeed) {
    console.log(`\n--- Creating company: ${company.company_name} ---`);
    try {
      const response = await fetch(`${BACKEND_URL}/companies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_name: company.company_name,
          admin_name: company.admin_name,
          admin_email: company.admin_email,
          admin_password: company.admin_password
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Failed to create company ${company.company_name}:`, errorText);
        continue;
      }

      const createdCompany = await response.json();
      const companyId = createdCompany.id;
      console.log(`Successfully created company ${company.company_name} and its super_admin (${company.admin_email})`);

      for (const u of company.users) {
        console.log(`Attempting to seed ${u.role} (${u.email})...`);
        const { data, error } = await supabase.auth.signUp({
          email: u.email,
          password: 'Password123!',
          options: {
            data: {
              full_name: u.name,
              role: u.role,
              status: 'approved',
              company_id: companyId
            }
          }
        });

        if (error) {
          console.error(`Failed to seed ${u.email}:`, error.message);
        } else {
          console.log(`Successfully seeded ${u.email}`);
        }
      }
    } catch (err) {
      console.error(`Error processing company ${company.company_name}:`, err.message);
    }
  }
}

seed();
