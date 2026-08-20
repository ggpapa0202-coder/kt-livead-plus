import "server-only";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type UserRole = "admin" | "advertiser" | null;

export type CurrentUser = {
  role: UserRole;
  email: string | null;
};

// 로그인한 사용자가 관리자인지 광고주인지 서버에서 판정한다.
// - 관리자: admins 테이블에 auth 사용자 id가 등록되어 있고 active=true인 경우
// - 광고주: advertisers.contact_email이 로그인 이메일과 일치하는 경우 (CLAUDE.md 접근 제어 규칙)
// 두 조건 모두 아니면 로그인은 됐어도 서비스 접근 권한이 없는 사용자다.
export async function getCurrentUser(): Promise<CurrentUser> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return { role: null, email: null };
  }

  const email = user.email.trim().toLowerCase();
  const admin = createAdminClient();

  const { data: adminRow } = await admin
    .from("admins")
    .select("id")
    .eq("id", user.id)
    .eq("active", true)
    .maybeSingle();

  if (adminRow) {
    return { role: "admin", email };
  }

  const { data: advertiserRow } = await admin
    .from("advertisers")
    .select("id")
    .ilike("contact_email", email)
    .maybeSingle();

  if (advertiserRow) {
    return { role: "advertiser", email };
  }

  return { role: null, email };
}
