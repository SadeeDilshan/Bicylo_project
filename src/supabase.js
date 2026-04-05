import { createClient } from '@supabase/supabase-js'

const supabaseUrl = "https://bsteunbxauodptozcedp.supabase.co";
const supabaseKey = "sb_publishable_55PB8PtTBgKI1Rg3GuePTg_H6Yv8D_B";

export const supabase = createClient(supabaseUrl, supabaseKey)