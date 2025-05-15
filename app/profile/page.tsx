import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { ProfileForm } from "@/components/profile-form"

export default async function ProfilePage() {
  const supabase = await createClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, email, avatar_url")
    .eq("id", session.user.id)
    .single()

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-8">Mi Perfil</h1>
      <ProfileForm
        userId={session.user.id}
        email={session.user.email || ""}
        fullName={profile?.full_name || ""}
        avatarUrl={profile?.avatar_url || ""}
      />
    </div>
  )
}
