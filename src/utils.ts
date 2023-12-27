import { createClient } from '@supabase/supabase-js';
export const supabaseClient =  (  process.env.SUPABASE_URL && 
    process.env.SUPABASE_SERVICE_ROLE_KEY) ? createClient(
    process.env.SUPABASE_URL ,
   process.env.SUPABASE_SERVICE_ROLE_KEY,
  ) : null;


export async function getUser (token:string) {
    const supabase=supabaseClient
const userData= await supabase?.auth?.getUser(token)
console.log(token, "token")
console.log("user" , userData )
const usersId=userData?.data.user?.id
return usersId
}