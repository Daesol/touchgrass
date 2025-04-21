import dotenv from 'dotenv'
import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'
import fetch from 'node-fetch'

// Load environment variables from .env.local
const __dirname = dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: resolve(__dirname, '../../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

console.log('Supabase URL:', supabaseUrl)
console.log('Service Role Key:', supabaseServiceKey ? 'Found (not showing for security)' : 'Not found')

// Function to read SQL from file
function readSqlFromFile() {
  const filePath = resolve(__dirname, '../../create-profile-table.sql')
  return fs.readFileSync(filePath, 'utf8')
}

// Execute SQL via REST API
async function executeSQLViaREST(sql) {
  const response = await fetch(`${supabaseUrl}/rest/v1/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': supabaseServiceKey,
      'Authorization': `Bearer ${supabaseServiceKey}`,
      'Prefer': 'return=minimal'
    },
    body: JSON.stringify({
      query: sql
    })
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API request failed with status ${response.status}: ${errorText}`);
  }
  
  return await response.json();
}

// Main function
async function main() {
  console.log('Setting up profiles table...')
  
  if (!supabaseServiceKey) {
    console.error('No service role key provided. Unable to execute SQL directly.');
    console.log('Please execute the SQL in create-profile-table.sql manually using the Supabase dashboard SQL editor.');
    return;
  }
  
  try {
    // Get SQL from file
    const sql = readSqlFromFile();
    console.log('Executing SQL via REST API...');
    
    await executeSQLViaREST(sql);
    console.log('✅ SQL executed successfully via REST API!');
    
  } catch (error) {
    console.error('Error executing SQL:', error.message);
    console.log('\nPlease execute the SQL manually using the Supabase dashboard SQL editor.');
  }
}

main(); 