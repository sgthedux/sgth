import React from "react"
import { RobustDocumentUpload } from "@/components/profile/robust-document-upload"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface EducationDocumentsSectionProps {
  userId: string
  basicEducationId?: string | number
  higherEducationId?: string | number
  educationSections: Array<{
    id: string
    education_type: string
    institution: string
    degree: string
    // ... otros campos
  }>
}

export function EducationDocumentsSection({ 
  userId, 
  basicEducationId, 
  higherEducationId, 
  educationSections 
}: EducationDocumentsSectionProps) {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Documentos de Educación</CardTitle>
        <CardDescription>
          Sube los documentos que respaldan tu formación académica
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Documento para educación básica */}
        {basicEducationId && (
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Certificado de Educación Básica</h3>
            <RobustDocumentUpload
              userId={userId}
              documentType="basic_education_certificate"
              formType="education"
              recordId={basicEducationId}
              onUploadSuccess={(url) => {
                console.log("Documento de educación básica subido:", url)
              }}
              onUploadError={(error) => {
                console.error("Error subiendo documento básico:", error)
              }}
            />
          </div>
        )}

        {/* Documento para educación superior */}
        {higherEducationId && (
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Diploma de Educación Superior</h3>
            <RobustDocumentUpload
              userId={userId}
              documentType="higher_education_diploma"
              formType="education"
              recordId={higherEducationId}
              onUploadSuccess={(url) => {
                console.log("Documento de educación superior subido:", url)
              }}
              onUploadError={(error) => {
                console.error("Error subiendo documento superior:", error)
              }}
            />
          </div>
        )}

        {/* Ejemplo de múltiples secciones de educación */}
        {educationSections.map((section, index) => (
          <div key={section.id} className="space-y-2">
            <h3 className="text-lg font-semibold">
              {section.education_type === "basic" ? "Certificado" : "Diploma"} - {section.institution}
            </h3>
            <RobustDocumentUpload
              userId={userId}
              documentType={section.education_type === "basic" ? "basic_education_certificate" : "higher_education_diploma"}
              formType="education"
              recordId={section.id}  // Usar el ID real del registro
              onUploadSuccess={(url) => {
                console.log(`Documento para ${section.institution} subido:`, url)
              }}
              onUploadError={(error) => {
                console.error(`Error subiendo documento para ${section.institution}:`, error)
              }}
            />
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
