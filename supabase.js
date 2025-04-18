import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;  // Service Role Key for backend access

// Use Service Role key for server-side
export const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
