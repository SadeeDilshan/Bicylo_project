
import { createClient } from '@supabase/supabase-js'
const supabaseUrl = 'https://lwvezyqbecadwdyccyst.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx3dmV6eXFiZWNhZHdkeWNjeXN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU1NTE2MjQsImV4cCI6MjA4MTEyNzYyNH0.-EgK8-beso3LS9wqInDeOMLPMUTa8mU6iIvubt4z2O4'
export const supabase = createClient(supabaseUrl, supabaseKey)