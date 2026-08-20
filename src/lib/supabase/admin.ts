import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// service_role 키를 쓰는 서버 전용 관리자 클라이언트 — RLS를 완전히 우회한다.
// 절대 클라이언트 컴포넌트에서 import하지 말 것 (import "server-only"가 실수로라도 번들에 섞이면 빌드를 막아준다).
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
