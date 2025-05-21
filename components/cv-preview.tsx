"use client"

import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface CvPreviewProps {
  profile: any
  personalInfo: any
  education: any[]
  experience: any[]
  languages: any[]
}

export function CvPreview({ profile, personalInfo, education, experience, languages }: CvPreviewProps) {
  // Formatear fecha
  const formatDate = (dateString: string | null) => {
    if (!dateString) return ""
    const date = new Date(dateString)
    return `${date.getDate().toString().padStart(2, "0")}/${(date.getMonth() + 1)
      .toString()
      .padStart(2, "0")}/${date.getFullYear()}`
  }

  return (
    <div className="border rounded-lg p-6 space-y-6">
      <Tabs defaultValue="personal" className="w-full">
        <TabsList className="grid grid-cols-4 mb-4">
          <TabsTrigger value="personal">Datos Personales</TabsTrigger>
          <TabsTrigger value="education">Formación Académica</TabsTrigger>
          <TabsTrigger value="experience">Experiencia Laboral</TabsTrigger>
          <TabsTrigger value="languages">Idiomas</TabsTrigger>
        </TabsList>

        <TabsContent value="personal" className="space-y-4">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold">
              {personalInfo?.first_surname || ""} {personalInfo?.second_surname || ""} {personalInfo?.first_name || ""}
            </h2>
            <p>{personalInfo?.email || ""}</p>
          </div>

          <Card className="p-4">
            <h3 className="text-lg font-semibold mb-3">Información Personal</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Tipo de Documento</p>
                <p>{personalInfo?.identification_type || ""}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Número de Documento</p>
                <p>{personalInfo?.identification_number || ""}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Sexo</p>
                <p>{personalInfo?.gender === "M" ? "Masculino" : "Femenino"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Nacionalidad</p>
                <p>{personalInfo?.nationality || ""}</p>
              </div>
            </div>
          </Card>

          {personalInfo?.military_booklet_type && personalInfo?.military_booklet_type !== "No Aplica" && (
            <Card className="p-4">
              <h3 className="text-lg font-semibold mb-3">Libreta Militar</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Tipo</p>
                  <p>{personalInfo?.military_booklet_type || ""}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Número</p>
                  <p>{personalInfo?.military_booklet_number || ""}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Distrito Militar</p>
                  <p>{personalInfo?.military_district || ""}</p>
                </div>
              </div>
            </Card>
          )}

          <Card className="p-4">
            <h3 className="text-lg font-semibold mb-3">Nacimiento y Contacto</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Fecha de Nacimiento</p>
                <p>{formatDate(personalInfo?.birth_date)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Lugar de Nacimiento</p>
                <p>
                  {personalInfo?.birth_city || ""}, {personalInfo?.birth_state || ""},{" "}
                  {personalInfo?.birth_country || ""}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Dirección</p>
                <p>{personalInfo?.address || ""}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Teléfono</p>
                <p>{personalInfo?.phone || ""}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Correo Electrónico</p>
                <p>{personalInfo?.email || ""}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Lugar de Residencia</p>
                <p>
                  {personalInfo?.residence_city || ""}, {personalInfo?.residence_state || ""},{" "}
                  {personalInfo?.residence_country || ""}
                </p>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="education" className="space-y-4">
          <Card className="p-4">
            <h3 className="text-lg font-semibold mb-3">Educación Básica y Media</h3>
            {education?.filter((item) => item.education_type === "basic").length > 0 ? (
              <div className="space-y-4">
                {education
                  ?.filter((item) => item.education_type === "basic")
                  .map((item, index) => (
                    <div key={index} className="border-b pb-4 last:border-b-0">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Nivel</p>
                          <p>{item.field_of_study || ""}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Grado</p>
                          <p>{item.level || ""}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Título Obtenido</p>
                          <p>{item.degree || ""}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Fecha de Grado</p>
                          <p>{formatDate(item.graduation_date)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No se ha registrado información de educación básica y media.</p>
            )}
          </Card>

          <Card className="p-4">
            <h3 className="text-lg font-semibold mb-3">Educación Superior</h3>
            {education?.filter((item) => item.education_type === "higher").length > 0 ? (
              <div className="space-y-4">
                {education
                  ?.filter((item) => item.education_type === "higher")
                  .map((item, index) => (
                    <div key={index} className="border-b pb-4 last:border-b-0">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Modalidad Académica</p>
                          <p>{item.level || ""}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Semestres Aprobados</p>
                          <p>{item.semesters_completed || ""}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Graduado</p>
                          <p>{item.graduated ? "Sí" : "No"}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Título Obtenido</p>
                          <p>{item.degree || ""}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Área de Estudio</p>
                          <p>{item.field_of_study || ""}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Fecha de Terminación</p>
                          <p>{formatDate(item.graduation_date)}</p>
                        </div>
                        {item.professional_card_number && (
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Tarjeta Profesional</p>
                            <p>{item.professional_card_number}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No se ha registrado información de educación superior.</p>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="experience" className="space-y-4">
          <Card className="p-4">
            <h3 className="text-lg font-semibold mb-3">Experiencia Laboral</h3>
            {experience && experience.length > 0 ? (
              <div className="space-y-6">
                {experience.map((item, index) => (
                  <div key={index} className="border-b pb-4 last:border-b-0">
                    <h4 className="font-medium text-lg mb-2">
                      {item.position} en {item.company}
                      {item.current && " (Actual)"}
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Empresa</p>
                        <p>{item.company || ""}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Tipo</p>
                        <p>{item.company_type === "public" ? "Pública" : "Privada"}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Ubicación</p>
                        <p>
                          {item.city || ""}, {item.state || ""}, {item.country || ""}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Contacto</p>
                        <p>
                          {item.phone || ""} - {item.email || ""}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Periodo</p>
                        <p>
                          {formatDate(item.start_date)} - {item.current ? "Actual" : formatDate(item.end_date)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Cargo</p>
                        <p>{item.position || ""}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Dependencia</p>
                        <p>{item.department || ""}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Dirección</p>
                        <p>{item.address || ""}</p>
                      </div>
                    </div>
                    {item.description && (
                      <div className="mt-2">
                        <p className="text-sm font-medium text-muted-foreground">Descripción</p>
                        <p className="text-sm">{item.description}</p>
                      </div>
                    )}
                  </div>
                ))}

                <div className="mt-4 pt-4 border-t">
                  <h4 className="font-medium mb-2">Tiempo Total de Experiencia</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Años</p>
                      <p>{profile?.total_experience_years || 0}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Meses</p>
                      <p>{profile?.total_experience_months || 0}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Ocupación</p>
                      <p>
                        {profile?.occupation === "public"
                          ? "Servidor Público"
                          : profile?.occupation === "private"
                            ? "Empleado del Sector Privado"
                            : profile?.occupation === "independent"
                              ? "Trabajador Independiente"
                              : ""}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">No se ha registrado información de experiencia laboral.</p>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="languages" className="space-y-4">
          <Card className="p-4">
            <h3 className="text-lg font-semibold mb-3">Idiomas</h3>
            {languages && languages.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-4">Idioma</th>
                      <th className="text-left py-2 px-4">Lo Habla</th>
                      <th className="text-left py-2 px-4">Lo Lee</th>
                      <th className="text-left py-2 px-4">Lo Escribe</th>
                    </tr>
                  </thead>
                  <tbody>
                    {languages.map((item, index) => (
                      <tr key={index} className="border-b">
                        <td className="py-2 px-4">{item.language || ""}</td>
                        <td className="py-2 px-4">
                          {item.speaking_level === "R"
                            ? "Regular"
                            : item.speaking_level === "B"
                              ? "Bueno"
                              : item.speaking_level === "MB"
                                ? "Muy Bueno"
                                : ""}
                        </td>
                        <td className="py-2 px-4">
                          {item.reading_level === "R"
                            ? "Regular"
                            : item.reading_level === "B"
                              ? "Bueno"
                              : item.reading_level === "MB"
                                ? "Muy Bueno"
                                : ""}
                        </td>
                        <td className="py-2 px-4">
                          {item.writing_level === "R"
                            ? "Regular"
                            : item.writing_level === "B"
                              ? "Bueno"
                              : item.writing_level === "MB"
                                ? "Muy Bueno"
                                : ""}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-muted-foreground">No se han registrado idiomas.</p>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
