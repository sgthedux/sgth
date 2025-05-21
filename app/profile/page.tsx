import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { ProfileForm } from "@/components/profile-form"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

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
      <div className="flex items-center mb-6">
        <Link href="/dashboard" passHref>
          <Button variant="ghost" className="mr-4" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Regresar
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">Mi Perfil</h1>
      </div>
      <ProfileForm
        userId={session.user.id}
        email={session.user.email || ""}
        fullName={profile?.full_name || ""}
        avatarUrl={profile?.avatar_url || ""}
      />
    </div>
  )
}
