/* Euro4All — settings.
   Leave supabaseUrl / supabaseKey empty: answers are kept on each device (works offline).
   Fill them in (see README) to combine answers from every phone live in the Observatory. */
window.E4A_CONFIG = {
  supabaseUrl: "https://yzertxifrunysbvesrqo.supabase.co",
  supabaseKey: "sb_publishable_FUdjPnP8VtkOlIc_MiE-2A_AHeuVSSt",   // public publishable key (safe in the browser; RLS allows insert/read of anonymous rows only)
  table: "e4a_responses"
};
