import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// 서버 컴포넌트/라우트 핸들러/서버 액션에서 "로그인한 사용자 세션" 기준으로 쓰는 클라이언트.
// anon 키 + 쿠키 세션을 사용하므로 RLS가 그대로 적용된다.
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Server Component에서 호출된 경우 — 세션 갱신은 middleware가 처리하므로 무시해도 된다.
          }
        },
      },
    },
  );
}
