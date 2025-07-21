import React from "react"
import { RobustDocumentUpload } from "@/components/profile/robust-document-upload"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

// Ejemplo de uso del componente RobustDocumentUpload
export default function TestRobustUpload() {
  const userId = "test-user-123"
  
  return (
    <div className="container mx-auto p-4 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Test RobustDocumentUpload</CardTitle>
          <CardDescription>
            Prueba del componente de upload robusto con IDs reales
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          
          {/* Ejemplo 1: Educación básica */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">1. Certificado de Educación Básica</h3>
            <p className="text-sm text-gray-600">
              Usando recordId real (ejemplo: education_record_123)
            </p>
            <RobustDocumentUpload
              userId={userId}
              documentType="basic_education_certificate"
              formType="education"
              recordId="education_record_123"
              onUploadSuccess={(url) => {
                console.log("✅ Educación básica subida:", url)
              }}
              onUploadError={(error) => {
                console.error("❌ Error educación básica:", error)
              }}
            />
          </div>

          {/* Ejemplo 2: Educación superior */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">2. Diploma de Educación Superior</h3>
            <p className="text-sm text-gray-600">
              Usando recordId real (ejemplo: education_record_456)
            </p>
            <RobustDocumentUpload
              userId={userId}
              documentType="higher_education_diploma"
              formType="education"
              recordId="education_record_456"
              onUploadSuccess={(url) => {
                console.log("✅ Educación superior subida:", url)
              }}
              onUploadError={(error) => {
                console.error("❌ Error educación superior:", error)
              }}
            />
          </div>

          {/* Ejemplo 3: Experiencia laboral */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">3. Documento de Experiencia</h3>
            <p className="text-sm text-gray-600">
              Usando recordId real (ejemplo: experience_record_789)
            </p>
            <RobustDocumentUpload
              userId={userId}
              documentType="work_certificate"
              formType="experience"
              recordId="experience_record_789"
              onUploadSuccess={(url) => {
                console.log("✅ Experiencia subida:", url)
              }}
              onUploadError={(error) => {
                console.error("❌ Error experiencia:", error)
              }}
            />
          </div>

          {/* Ejemplo 4: Idiomas */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">4. Certificado de Idioma</h3>
            <p className="text-sm text-gray-600">
              Usando recordId real (ejemplo: language_record_101)
            </p>
            <RobustDocumentUpload
              userId={userId}
              documentType="language_certificate"
              formType="language"
              recordId="language_record_101"
              onUploadSuccess={(url) => {
                console.log("✅ Idioma subido:", url)
              }}
              onUploadError={(error) => {
                console.error("❌ Error idioma:", error)
              }}
            />
          </div>

          {/* Ejemplo 5: Backward compatibility */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">5. Compatibilidad hacia atrás</h3>
            <p className="text-sm text-gray-600">
              Usando itemIndex para compatibilidad (se debe migrar a recordId)
            </p>
            <RobustDocumentUpload
              userId={userId}
              documentType="basic_education_certificate"
              formType="education"
              itemIndex={0}
              onUploadSuccess={(url) => {
                console.log("✅ Backward compatibility subida:", url)
              }}
              onUploadError={(error) => {
                console.error("❌ Error backward compatibility:", error)
              }}
            />
          </div>

        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Instrucciones de Prueba</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>Cada componente de upload usa un <code>recordId</code> único</li>
            <li>Los archivos se guardan con item_id: <code>form_type_recordId</code></li>
            <li>Para educación básica: <code>basic_recordId</code></li>
            <li>Para educación superior: <code>higher_recordId</code></li>
            <li>Para experiencia: <code>experience_recordId</code></li>
            <li>Para idiomas: <code>language_recordId</code></li>
            <li>El último ejemplo muestra compatibilidad hacia atrás con itemIndex</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  )
}
