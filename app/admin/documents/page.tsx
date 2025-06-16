import { redirect } from "next/navigation"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { UserDocumentsClient } from "./client"

export default async function AdminDocumentsPage() {
  try {
    // Crear el cliente de Supabase directamente en la página
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name) {
            return cookieStore.get(name)?.value
          },
          set(name, value, options) {
            cookieStore.set({ name, value, ...options })
          },
          remove(name, options) {
            cookieStore.set({ name, value: "", ...options })
          },
        },
      },
    )

    // Verificar la sesión
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      console.log("No session found, redirecting to login")
      redirect("/auth/login")
    }

    console.log("Session found, user ID:", session.user.id)

    // Verificar si el usuario es administrador
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", session.user.id)
      .single()

    if (profileError) {
      console.error("Error fetching profile:", profileError.message)
      redirect("/dashboard")
    }

    if (profile?.role !== "admin") {
      console.log("User is not admin, redirecting to dashboard")
      redirect("/dashboard")
    }

    console.log("User is admin, fetching documents")

    // Obtener todos los documentos con información del usuario
    const { data: documents, error: documentsError } = await supabase
      .from("documents")
      .select("*, profiles(id, full_name, email)")
      .order("created_at", { ascending: false })

    if (documentsError) {
      console.error("Error fetching documents:", documentsError.message)
    }

    // Agrupar documentos por usuario
    const documentsByUser = documents?.reduce(
      (acc, doc) => {
        const userId = (doc.profiles as any)?.id || "unknown"
        const userName = (doc.profiles as any)?.full_name || "Usuario desconocido"

        if (!acc[userId]) {
          acc[userId] = {
            userName,
            documents: [],
          }
        }

        acc[userId].documents.push({
          id: doc.id,
          name: doc.name,
          type: doc.type,
          url: doc.url,
          status: doc.status,
          created_at: doc.created_at,
        })

        return acc
      },
      {} as Record<string, { userName: string; documents: any[] }>,
    )

    console.log(`Documentos agrupados por ${Object.keys(documentsByUser || {}).length} usuarios`)

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Documentos</h1>
          <p className="text-muted-foreground">Gestiona los documentos de todos los usuarios</p>
        </div>

        <UserDocumentsClient documentsByUser={documentsByUser || {}} />
      </div>
    )
  } catch (error) {
    console.error("Error in AdminDocumentsPage:", error)
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Error</h1>
          <p className="text-muted-foreground">
            Ocurrió un error al cargar los documentos. Por favor, intenta de nuevo más tarde.
          </p>
        </div>
      </div>
    )
  }
}
