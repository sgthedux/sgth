export const dynamic = "force-dynamic"

import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { DocumentUpload } from "@/components/profile/document-upload"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { InfoIcon } from "lucide-react"
import { Suspense } from "react"

export default async function DocumentsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Obtener información del perfil del usuario
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  // Obtener todos los documentos del usuario para todas las categorías
  const { data: userDocuments, error } = await supabase.from("documents").select("*").eq("user_id", user.id)

  if (error) {
    console.error("Error al cargar documentos:", error)
  } else {
    console.log("Documentos cargados:", userDocuments?.length || 0)
  }

  // Definir los documentos requeridos por categoría
  const requiredDocuments = {
    personal: [
      { type: "identification", label: "Documento de Identidad" },
      { type: "military_booklet", label: "Libreta Militar" },
    ],
    education: [
      { type: "education_basic", label: "Certificado de Educación Básica", itemId: "basic_0" },
      { type: "education_higher", label: "Certificado de Educación Superior", itemId: "higher_0" },
    ],
    experience: [{ type: "experience", label: "Certificado Laboral", itemId: "experience_0" }],
    language: [{ type: "language", label: "Certificado de Idioma", itemId: "language_0" }],
    legal: [
      { type: "cv_signed", label: "Hoja de Vida Firmada" },
      { type: "rut", label: "RUT (DIAN)" },
      { type: "bank_certification", label: "Certificación Bancaria" },
      { type: "fiscal_background", label: "Antecedentes Fiscales" },
      { type: "disciplinary_background", label: "Antecedentes Disciplinarios" },
      { type: "criminal_background", label: "Antecedentes Penales" },
      { type: "professional_validation", label: "Validación Profesional" },
      { type: "redam", label: "Registro de Deudores Alimentarios Morosos (REDAM)" },
    ],
  }

  return (
    <Suspense fallback={<div>Cargando documentos...</div>}>
      <div className="container mx-auto py-6">
        <h1 className="text-2xl font-bold mb-6">Documentos</h1>

        <Alert className="mb-6">
          <InfoIcon className="h-4 w-4" />
          <AlertTitle>Documentos requeridos</AlertTitle>
          <AlertDescription>
            Para completar tu perfil, debes subir los documentos requeridos. Los documentos que no hayas subido aparecerán
            como pendientes.
          </AlertDescription>
        </Alert>

        <Tabs defaultValue="legal" className="w-full">
          <TabsList className="grid grid-cols-1 mb-6">
            <TabsTrigger value="legal">Legales</TabsTrigger>
          </TabsList>

          <TabsContent value="personal">
            <Card>
              <CardHeader>
                <CardTitle>Documentos Personales</CardTitle>
                <CardDescription>Sube tus documentos de identificación personal.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {requiredDocuments.personal.map((doc) => (
                  <div key={doc.type} className="p-4 border rounded-lg">
                    <DocumentUpload userId={user.id} documentType={doc.type} label={doc.label} />
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="education">
            <Card>
              <CardHeader>
                <CardTitle>Documentos de Educación</CardTitle>
                <CardDescription>Sube tus certificados y diplomas educativos.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {requiredDocuments.education.map((doc) => (
                  <div key={doc.type} className="p-4 border rounded-lg">
                    <DocumentUpload
                      userId={user.id}
                      documentType={doc.type}
                      label={doc.label}
                      itemId={doc.itemId || "default"}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="experience">
            <Card>
              <CardHeader>
                <CardTitle>Documentos de Experiencia Laboral</CardTitle>
                <CardDescription>Sube tus certificados laborales.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {requiredDocuments.experience.map((doc) => (
                  <div key={doc.type} className="p-4 border rounded-lg">
                    <DocumentUpload
                      userId={user.id}
                      documentType={doc.type}
                      label={doc.label}
                      itemId={doc.itemId || "default"}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="language">
            <Card>
              <CardHeader>
                <CardTitle>Certificados de Idiomas</CardTitle>
                <CardDescription>Sube tus certificados de idiomas.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {requiredDocuments.language.map((doc) => (
                  <div key={doc.type} className="p-4 border rounded-lg">
                    <DocumentUpload
                      userId={user.id}
                      documentType={doc.type}
                      label={doc.label}
                      itemId={doc.itemId || "default"}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="legal">
            <Card>
              <CardHeader>
                <CardTitle>Documentos Legales y Administrativos</CardTitle>
                <CardDescription>
                  Estos documentos son necesarios para completar tu expediente. Si no los has subido, aparecerán como
                  pendientes.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {requiredDocuments.legal.map((doc) => (
                  <div key={doc.type} className="p-4 border rounded-lg">
                    <DocumentUpload userId={user.id} documentType={doc.type} label={doc.label} />
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Suspense>
  )
}
