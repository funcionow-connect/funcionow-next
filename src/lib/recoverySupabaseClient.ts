"use client";

import { createBrowserClient } from "@supabase/ssr";

// A recuperação usa o fluxo implícito para que o link possa ser aberto
// em outro navegador ou dispositivo sem depender do verificador local do PKCE.
export const recoverySupabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { flowType: "implicit" } },
);

