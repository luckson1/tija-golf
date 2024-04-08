import { createClient } from "@supabase/supabase-js";
console.log(
  "url",
  process.env.APPSETTING_SUPABASE_URL,
  "key",
  process.env.APPSETTING_SUPABASE_SERVICE_ROLE_KEY
);
export const supabaseClient =
  process.env.APPSETTING_SUPABASE_URL &&
  process.env.APPSETTING_SUPABASE_SERVICE_ROLE_KEY
    ? createClient(
        process.env.APPSETTING_SUPABASE_URL,
        process.env.APPSETTING_SUPABASE_SERVICE_ROLE_KEY
      )
    : null;

export async function getUser(token: string) {
  const supabase = supabaseClient;

  const userData = await supabase?.auth?.getUser(token);
  const usersId = userData?.data.user?.id;
  return usersId;
}
