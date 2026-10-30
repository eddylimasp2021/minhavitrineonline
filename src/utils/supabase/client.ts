import { supabase } from '@/integrations/supabase/client';  
  
export const createClient = () => supabase;
export { supabase }; 
