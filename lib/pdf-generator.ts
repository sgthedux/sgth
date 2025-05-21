import { PDFDocument, rgb, StandardFonts } from "pdf-lib"

function mm2pt(mm: number): number {
  return mm * 2.83465
}

// Añadir constante para la posición del logo
const LOGO_POSITION = {
  x: mm2pt(148), // Posición X aproximada donde dice "entidad receptora"
  y: mm2pt(253), // Posición Y aproximada donde dice "entidad receptora"
  maxWidth: mm2pt(53), // 150px convertidos a puntos (aproximadamente 53mm)
}

/* ────────────────  PÁGINA 1  ──────────────── */
const P1 = {
  /* Datos personales */
  primerApellido: { x: mm2pt(22), y: mm2pt(213.5) },
  segundoApellido: { x: mm2pt(81), y: mm2pt(213.5) },
  nombres: { x: mm2pt(140), y: mm2pt(213.5) },

  /* Documento de identificación */
  tipoDocCC: { x: mm2pt(29), y: mm2pt(202.5) },
  tipoDocCE: { x: mm2pt(39), y: mm2pt(202.5) },
  tipoDocPAS: { x: mm2pt(49), y: mm2pt(202.5) },
  numeroDocumento: { x: mm2pt(64), y: mm2pt(202.5) },

  /* Libreta Militar - Coordenadas aproximadas */
  libretaMilitarNumero: { x: mm2pt(120), y: mm2pt(192) },
  libretaMilitarPrimera: { x: mm2pt(51), y: mm2pt(192) },
  libretaMilitarSegunda: { x: mm2pt(91), y: mm2pt(192) },
  libretaMilitarDistrito: { x: mm2pt(170), y: mm2pt(192) },

  /* Sexo */
  sexoF: { x: mm2pt(105), y: mm2pt(202.5) },
  sexoM: { x: mm2pt(112), y: mm2pt(202.5) },

  /* Nacionalidad */
  nacionalidadCol: { x: mm2pt(135.2), y: mm2pt(202.5) },
  nacionalidadOtra: { x: mm2pt(162), y: mm2pt(202.5) },
  nacionalidad: { x: mm2pt(145), y: mm2pt(202.5) },
  pais: { x: mm2pt(168), y: mm2pt(202.5) },

  /* Fecha y lugar de nacimiento */
  fechaNacDia: { x: mm2pt(49), y: mm2pt(179) },
  fechaNacMes: { x: mm2pt(66), y: mm2pt(179) },
  fechaNacAnio: { x: mm2pt(86), y: mm2pt(179) },
  paisNacimiento: { x: mm2pt(44), y: mm2pt(173) },
  deptoNacimiento: { x: mm2pt(44), y: mm2pt(167) },
  municipioNacimiento: { x: mm2pt(44), y: mm2pt(161) },

  /* Dirección y contacto */
  direccion: { x: mm2pt(105), y: mm2pt(179) },
  telefono: { x: mm2pt(121), y: mm2pt(161) },
  email: { x: mm2pt(154), y: mm2pt(161) },
  paisResidencia: { x: mm2pt(111), y: mm2pt(173) },
  deptoResidencia: { x: mm2pt(168), y: mm2pt(173) },
  municipioResidencia: { x: mm2pt(121), y: mm2pt(167) },

  /* Educación básica */
  nivelPrimaria: { x: mm2pt(140), y: mm2pt(123) },
  nivelSecundaria: { x: mm2pt(140), y: mm2pt(123) },
  nivelMedia: { x: mm2pt(140), y: mm2pt(123) },
  tituloBachiller: { x: mm2pt(140), y: mm2pt(123) },
  fechaGradoMes: { x: mm2pt(125), y: mm2pt(112) },
  fechaGradoAnio: { x: mm2pt(148), y: mm2pt(112) },

  /* Educación superior 1 */
  modalidadAcademica1: { x: mm2pt(22), y: mm2pt(70) },
  semestresAprobados1: { x: mm2pt(44), y: mm2pt(70) },
  graduadoSi1: { x: mm2pt(65), y: mm2pt(70) },
  graduadoNo1: { x: mm2pt(70), y: mm2pt(70) },
  tituloObtenido1: { x: mm2pt(80), y: mm2pt(70) },
  fechaTerminacionMes1: { x: mm2pt(152), y: mm2pt(70) },
  fechaTerminacionAnio1: { x: mm2pt(160), y: mm2pt(70) },
  tarjetaProfesional1: { x: mm2pt(175), y: mm2pt(70) },

  /* Educación superior 2 */
  modalidadAcademica2: { x: mm2pt(22), y: mm2pt(64) },
  semestresAprobados2: { x: mm2pt(44), y: mm2pt(64) },
  graduadoSi2: { x: mm2pt(65), y: mm2pt(64) },
  graduadoNo2: { x: mm2pt(70), y: mm2pt(64) },
  tituloObtenido2: { x: mm2pt(80), y: mm2pt(64) },
  fechaTerminacionMes2: { x: mm2pt(152), y: mm2pt(64) },
  fechaTerminacionAnio2: { x: mm2pt(160), y: mm2pt(64) },
  tarjetaProfesional2: { x: mm2pt(175), y: mm2pt(64) },

  /* Idiomas */
  idioma1: { x: mm2pt(65), y: mm2pt(25) },
  habla1R: { x: mm2pt(107), y: mm2pt(25) },
  habla1B: { x: mm2pt(113.5), y: mm2pt(25) },
  habla1MB: { x: mm2pt(119.5), y: mm2pt(25) },
  lee1R: { x: mm2pt(124), y: mm2pt(25) },
  lee1B: { x: mm2pt(130), y: mm2pt(25) },
  lee1MB: { x: mm2pt(136), y: mm2pt(25) },
  escribe1R: { x: mm2pt(142.5), y: mm2pt(25) },
  escribe1B: { x: mm2pt(148.5), y: mm2pt(25) },
  escribe1MB: { x: mm2pt(154.5), y: mm2pt(25) },

  idioma2: { x: mm2pt(65), y: mm2pt(19) },
  habla2R: { x: mm2pt(107), y: mm2pt(19) },
  habla2B: { x: mm2pt(113.5), y: mm2pt(19) },
  habla2MB: { x: mm2pt(119.5), y: mm2pt(19) },
  lee2R: { x: mm2pt(124), y: mm2pt(19) },
  lee2B: { x: mm2pt(130), y: mm2pt(19) },
  lee2MB: { x: mm2pt(136), y: mm2pt(19) },
  escribe2R: { x: mm2pt(142.5), y: mm2pt(19) },
  escribe2B: { x: mm2pt(148.5), y: mm2pt(19) },
  escribe2MB: { x: mm2pt(154.5), y: mm2pt(19) },
}

/* ────────────────  PÁGINA 2  ──────────────── */
const getExpCoords = (index: number) => {
  const baseY = 209 - index * 46 // mm
  return {
    empresa: { x: mm2pt(30), y: mm2pt(baseY - 15) },
    sectorPublico: { x: mm2pt(120), y: mm2pt(baseY - 15) },
    sectorPrivado: { x: mm2pt(135), y: mm2pt(baseY - 15) },
    pais: { x: mm2pt(171), y: mm2pt(baseY - 15) },
    departamento: { x: mm2pt(30), y: mm2pt(baseY - 25) },
    municipio: { x: mm2pt(90), y: mm2pt(baseY - 25) },
    correoEmpresa: { x: mm2pt(150), y: mm2pt(baseY - 25) },
    telefonoEmpresa: { x: mm2pt(30), y: mm2pt(baseY - 35) },
    fechaIngresoDia: { x: mm2pt(95), y: mm2pt(baseY - 35) },
    fechaIngresoMes: { x: mm2pt(110), y: mm2pt(baseY - 35) },
    fechaIngresoAnio: { x: mm2pt(128), y: mm2pt(baseY - 35) },
    fechaRetiroDia: { x: mm2pt(152), y: mm2pt(baseY - 35) },
    fechaRetiroMes: { x: mm2pt(167), y: mm2pt(baseY - 35) },
    fechaRetiroAnio: { x: mm2pt(185), y: mm2pt(baseY - 35) },
    cargo: { x: mm2pt(30), y: mm2pt(baseY - 45) },
    dependencia: { x: mm2pt(100), y: mm2pt(baseY - 45) },
    direccionEmpresa: { x: mm2pt(160), y: mm2pt(baseY - 45) },
  }
}

/* ────────────────  PÁGINA 3  ──────────────── */
const P3 = {
  ciudadFecha: { x: mm2pt(110), y: mm2pt(120) },

  // Experiencia por sector
  aniosExperienciaPublica: { x: mm2pt(136), y: mm2pt(220 - 10) },
  mesesExperienciaPublica: { x: mm2pt(162), y: mm2pt(220 - 10) },
  aniosExperienciaPrivada: { x: mm2pt(136), y: mm2pt(210 - 10) },
  mesesExperienciaPrivada: { x: mm2pt(162), y: mm2pt(210 - 10) },
  aniosExperienciaIndependiente: { x: mm2pt(136), y: mm2pt(200 - 10) },
  mesesExperienciaIndependiente: { x: mm2pt(162), y: mm2pt(200 - 10) },

  // Experiencia total
  aniosExperienciaTotal: { x: mm2pt(136), y: mm2pt(190 - 10) },
  mesesExperienciaTotal: { x: mm2pt(162), y: mm2pt(190 - 10) },
}

// Función para generar el PDF con los datos del usuario
export async function generatePdf(userData: any, educationData: any[], experienceData: any[], languagesData: any[]) {
  try {
    // Descargar el template desde la URL proporcionada
    const templateUrl = "https://pub-373d5369059842f8abf123c212109054.r2.dev/template.pdf"
    const templateResponse = await fetch(templateUrl)
    const templateBytes = await templateResponse.arrayBuffer()

    // Cargar el PDF
    const pdfDoc = await PDFDocument.load(templateBytes)
    const pages = pdfDoc.getPages()
    const page1 = pages[0]
    const page2 = pages[1]
    const page3 = pages[2]

    // Cargar el logo
    try {
      const logoUrl = "/images/logo.png" // Ruta relativa al logo
      const logoResponse = await fetch(logoUrl)
      if (!logoResponse.ok) {
        throw new Error(`Error al cargar el logo: ${logoResponse.status}`)
      }

      const logoBytes = await logoResponse.arrayBuffer()
      const logoImage = await pdfDoc.embedPng(logoBytes)

      // Calcular dimensiones manteniendo la proporción
      const { width, height } = logoImage.scale(1)
      let scaleFactor = 1

      if (width > LOGO_POSITION.maxWidth) {
        scaleFactor = LOGO_POSITION.maxWidth / width
      }

      const scaledWidth = width * scaleFactor
      const scaledHeight = height * scaleFactor

      // Insertar el logo en la primera página
      page1.drawImage(logoImage, {
        x: LOGO_POSITION.x,
        y: LOGO_POSITION.y - scaledHeight, // Ajustar Y para que la imagen se dibuje hacia abajo desde el punto de referencia
        width: scaledWidth,
        height: scaledHeight,
      })

      console.log("Logo insertado correctamente en el PDF")
    } catch (logoError) {
      console.error("Error al procesar el logo:", logoError)
      // Continuar con la generación del PDF sin el logo
    }

    // Configurar la fuente
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica)

    // Función para dibujar texto en el PDF
    const drawText = (text: string, coords: any, page: any, size = 10) => {
      if (!text || !coords) return
      page.drawText(text, {
        x: coords.x,
        y: coords.y,
        size: size,
        font,
        color: rgb(0, 0, 0),
      })
    }

    // Función para marcar casillas (X)
    const markCheckbox = (condition: boolean, coords: any, page: any, size = 10) => {
      if (!condition || !coords) return
      page.drawText("X", {
        x: coords.x,
        y: coords.y,
        size: size,
        font,
        color: rgb(0, 0, 0),
      })
    }

    // Llenar datos personales
    if (userData) {
      // Extraer nombres y apellidos
      let firstName = ""
      let lastName = ""
      let secondLastName = ""

      if (userData.first_name) {
        firstName = userData.first_name
      }

      if (userData.first_surname || userData.last_name) {
        lastName = userData.first_surname || userData.last_name
      }

      if (userData.second_surname) {
        secondLastName = userData.second_surname
      }

      // Si tenemos full_name pero no tenemos los componentes individuales
      if (userData.full_name && (!firstName || !lastName)) {
        const nameParts = userData.full_name.split(" ")
        if (nameParts.length >= 3) {
          lastName = nameParts[0]
          secondLastName = nameParts[1]
          firstName = nameParts.slice(2).join(" ")
        } else if (nameParts.length === 2) {
          lastName = nameParts[0]
          firstName = nameParts[1]
        } else if (nameParts.length === 1) {
          firstName = nameParts[0]
        }
      }

      // Dibujar nombres y apellidos
      drawText(lastName, P1.primerApellido, page1)
      drawText(secondLastName, P1.segundoApellido, page1)
      drawText(firstName, P1.nombres, page1)

      // Documento de identificación
      const docType = userData.identification_type || userData.document_type || ""
      markCheckbox(docType.toLowerCase() === "cc", P1.tipoDocCC, page1)
      markCheckbox(docType.toLowerCase() === "ce", P1.tipoDocCE, page1)
      markCheckbox(docType.toLowerCase() === "passport" || docType.toLowerCase() === "pas", P1.tipoDocPAS, page1)

      drawText(userData.identification_number || userData.document_number || "", P1.numeroDocumento, page1)

      // Libreta Militar
      drawText(userData.military_booklet_number || "", P1.libretaMilitarNumero, page1)

      // Marcar con X la clase de libreta militar
      const militaryType = userData.military_booklet_type || ""
      markCheckbox(
        militaryType.toLowerCase().includes("primera") || militaryType === "1",
        P1.libretaMilitarPrimera,
        page1,
      )
      markCheckbox(
        militaryType.toLowerCase().includes("segunda") || militaryType === "2",
        P1.libretaMilitarSegunda,
        page1,
      )

      drawText(userData.military_district || "", P1.libretaMilitarDistrito, page1)

      // Sexo
      const gender = userData.gender || ""
      markCheckbox(gender.toUpperCase() === "F", P1.sexoF, page1)
      markCheckbox(gender.toUpperCase() === "M", P1.sexoM, page1)

      // Nacionalidad
      const isColombiano = (userData.nationality || "").toLowerCase().includes("colomb")
      markCheckbox(isColombiano, P1.nacionalidadCol, page1)
      markCheckbox(!isColombiano, P1.nacionalidadOtra, page1)

      if (!isColombiano) {
        drawText(userData.nationality || "", P1.nacionalidad, page1)
      }

      drawText(userData.country || "Colombia", P1.pais, page1)

      // Fecha y lugar de nacimiento
      if (userData.birth_date) {
        const birthDate = new Date(userData.birth_date)
        drawText(birthDate.getDate().toString().padStart(2, "0"), P1.fechaNacDia, page1)
        drawText((birthDate.getMonth() + 1).toString().padStart(2, "0"), P1.fechaNacMes, page1)
        drawText(birthDate.getFullYear().toString(), P1.fechaNacAnio, page1)
      }

      drawText(userData.birth_country || "Colombia", P1.paisNacimiento, page1)
      drawText(userData.birth_state || userData.birth_department || "", P1.deptoNacimiento, page1)
      drawText(userData.birth_city || "", P1.municipioNacimiento, page1)

      // Dirección y contacto
      drawText(userData.address || "", P1.direccion, page1)
      drawText(userData.phone || "", P1.telefono, page1)
      drawText(userData.email || "", P1.email, page1)
      drawText(userData.residence_country || userData.country || "Colombia", P1.paisResidencia, page1)
      drawText(userData.residence_state || userData.state || "", P1.deptoResidencia, page1)
      drawText(userData.residence_city || userData.city || "", P1.municipioResidencia, page1)
    }

    // Llenar educación
    if (educationData && educationData.length > 0) {
      // Educación básica
      const basicEducation = educationData.find(
        (edu) =>
          edu.education_type === "basic" ||
          edu.level === "basic" ||
          (edu.field_of_study && ["Primaria", "Secundaria", "Media"].includes(edu.field_of_study)),
      )

      if (basicEducation) {
        // Marcar nivel educativo
        const level = basicEducation.education_level || basicEducation.level || ""
        markCheckbox(level.toLowerCase().includes("primaria"), P1.nivelPrimaria, page1)
        markCheckbox(level.toLowerCase().includes("secundaria"), P1.nivelSecundaria, page1)
        markCheckbox(level.toLowerCase().includes("media"), P1.nivelMedia, page1)

        // Título obtenido
        drawText(basicEducation.title || basicEducation.degree || "", P1.tituloBachiller, page1)

        // Fecha de grado
        if (basicEducation.end_date || basicEducation.graduation_date) {
          const endDate = new Date(basicEducation.end_date || basicEducation.graduation_date)
          drawText((endDate.getMonth() + 1).toString().padStart(2, "0"), P1.fechaGradoMes, page1)
          drawText(endDate.getFullYear().toString(), P1.fechaGradoAnio, page1)
        }
      }

      // Educación superior
      const higherEducation = educationData.filter(
        (edu) =>
          edu.education_type === "higher" ||
          edu.level === "higher" ||
          ["technical", "technological", "professional", "specialization", "master", "doctorate"].includes(
            edu.education_level || "",
          ),
      )

      // Primera educación superior
      if (higherEducation.length > 0) {
        const edu1 = higherEducation[0]

        // Modalidad académica - Usar el campo academic_modality si existe
        const modalidad = edu1.academic_modality || getModalidadAcademica(edu1.education_level)
        drawText(modalidad, P1.modalidadAcademica1, page1)

        // Semestres aprobados
        drawText(
          edu1.semesters?.toString() || edu1.semesters_completed?.toString() || "",
          P1.semestresAprobados1,
          page1,
        )

        // Graduado
        markCheckbox(edu1.graduated === true, P1.graduadoSi1, page1)
        markCheckbox(edu1.graduated === false, P1.graduadoNo1, page1)

        // Título obtenido
        drawText(edu1.title || edu1.degree || "", P1.tituloObtenido1, page1)

        // Fecha de terminación
        if (edu1.end_date || edu1.graduation_date) {
          const endDate = new Date(edu1.end_date || edu1.graduation_date)
          drawText((endDate.getMonth() + 1).toString().padStart(2, "0"), P1.fechaTerminacionMes1, page1)
          drawText(endDate.getFullYear().toString(), P1.fechaTerminacionAnio1, page1)
        }

        // Tarjeta profesional
        drawText(edu1.professional_card || edu1.professional_card_number || "", P1.tarjetaProfesional1, page1)
      }

      // Segunda educación superior
      if (higherEducation.length > 1) {
        const edu2 = higherEducation[1]

        // Modalidad académica - Usar el campo academic_modality si existe
        const modalidad = edu2.academic_modality || getModalidadAcademica(edu2.education_level)
        drawText(modalidad, P1.modalidadAcademica2, page1)

        // Semestres aprobados
        drawText(
          edu2.semesters?.toString() || edu2.semesters_completed?.toString() || "",
          P1.semestresAprobados2,
          page1,
        )

        // Graduado
        markCheckbox(edu2.graduated === true, P1.graduadoSi2, page1)
        markCheckbox(edu2.graduated === false, P1.graduadoNo2, page1)

        // Título obtenido
        drawText(edu2.title || edu2.degree || "", P1.tituloObtenido2, page1)

        // Fecha de terminación
        if (edu2.end_date || edu2.graduation_date) {
          const endDate = new Date(edu2.end_date || edu2.graduation_date)
          drawText((endDate.getMonth() + 1).toString().padStart(2, "0"), P1.fechaTerminacionMes2, page1)
          drawText(endDate.getFullYear().toString(), P1.fechaTerminacionAnio2, page1)
        }

        // Tarjeta profesional
        drawText(edu2.professional_card || edu2.professional_card_number || "", P1.tarjetaProfesional2, page1)
      }
    }

    // Llenar idiomas
    if (languagesData && languagesData.length > 0) {
      // Primer idioma
      if (languagesData.length > 0) {
        const lang1 = languagesData[0]

        // Nombre del idioma
        drawText(lang1.language || lang1.name || "", P1.idioma1, page1)

        // Nivel de habla
        const speakLevel = lang1.speaking_level || lang1.speak_level || ""
        markCheckbox(speakLevel.toLowerCase() === "basic" || speakLevel === "R", P1.habla1R, page1)
        markCheckbox(speakLevel.toLowerCase() === "intermediate" || speakLevel === "B", P1.habla1B, page1)
        markCheckbox(speakLevel.toLowerCase() === "advanced" || speakLevel === "MB", P1.habla1MB, page1)

        // Nivel de lectura
        const readLevel = lang1.reading_level || lang1.read_level || ""
        markCheckbox(readLevel.toLowerCase() === "basic" || readLevel === "R", P1.lee1R, page1)
        markCheckbox(readLevel.toLowerCase() === "intermediate" || readLevel === "B", P1.lee1B, page1)
        markCheckbox(readLevel.toLowerCase() === "advanced" || readLevel === "MB", P1.lee1MB, page1)

        // Nivel de escritura
        const writeLevel = lang1.writing_level || lang1.write_level || ""
        markCheckbox(writeLevel.toLowerCase() === "basic" || writeLevel === "R", P1.escribe1R, page1)
        markCheckbox(writeLevel.toLowerCase() === "intermediate" || writeLevel === "B", P1.escribe1B, page1)
        markCheckbox(writeLevel.toLowerCase() === "advanced" || writeLevel === "MB", P1.escribe1MB, page1)
      }

      // Segundo idioma
      if (languagesData.length > 1) {
        const lang2 = languagesData[1]

        // Nombre del idioma
        drawText(lang2.language || lang2.name || "", P1.idioma2, page1)

        // Nivel de habla
        const speakLevel = lang2.speaking_level || lang2.speak_level || ""
        markCheckbox(speakLevel.toLowerCase() === "basic" || speakLevel === "R", P1.habla2R, page1)
        markCheckbox(speakLevel.toLowerCase() === "intermediate" || speakLevel === "B", P1.habla2B, page1)
        markCheckbox(speakLevel.toLowerCase() === "advanced" || speakLevel === "MB", P1.habla2MB, page1)

        // Nivel de lectura
        const readLevel = lang2.reading_level || lang2.read_level || ""
        markCheckbox(readLevel.toLowerCase() === "basic" || readLevel === "R", P1.lee2R, page1)
        markCheckbox(readLevel.toLowerCase() === "intermediate" || readLevel === "B", P1.lee2B, page1)
        markCheckbox(readLevel.toLowerCase() === "advanced" || readLevel === "MB", P1.lee2MB, page1)

        // Nivel de escritura
        const writeLevel = lang2.writing_level || lang2.write_level || ""
        markCheckbox(writeLevel.toLowerCase() === "basic" || writeLevel === "R", P1.escribe2R, page1)
        markCheckbox(writeLevel.toLowerCase() === "intermediate" || writeLevel === "B", P1.escribe2B, page1)
        markCheckbox(writeLevel.toLowerCase() === "advanced" || writeLevel === "MB", P1.escribe2MB, page1)
      }
    }

    // Llenar experiencia laboral
    if (experienceData && experienceData.length > 0) {
      // Ordenar experiencias por fecha de inicio (más reciente primero)
      const sortedExperiences = [...experienceData].sort((a, b) => {
        const dateA = new Date(a.start_date || 0)
        const dateB = new Date(b.start_date || 0)
        return dateB.getTime() - dateA.getTime()
      })

      // Mostrar hasta 4 experiencias
      sortedExperiences.slice(0, 4).forEach((exp, index) => {
        const coords = getExpCoords(index)

        // Empresa
        drawText(exp.company || "", coords.empresa, page2)

        // Sector
        const sector = exp.sector || exp.company_type || ""
        markCheckbox(sector.toLowerCase() === "public", coords.sectorPublico, page2)
        markCheckbox(sector.toLowerCase() === "private", coords.sectorPrivado, page2)

        // País
        drawText(exp.country || "Colombia", coords.pais, page2)

        // Departamento y municipio
        drawText(exp.state || "", coords.departamento, page2)
        drawText(exp.city || "", coords.municipio, page2)

        // Correo y teléfono
        drawText(exp.company_email || exp.email || "", coords.correoEmpresa, page2)
        drawText(exp.company_phone || exp.phone || "", coords.telefonoEmpresa, page2)

        // Fecha de ingreso
        if (exp.start_date) {
          const startDate = new Date(exp.start_date)
          drawText(startDate.getDate().toString().padStart(2, "0"), coords.fechaIngresoDia, page2)
          drawText((startDate.getMonth() + 1).toString().padStart(2, "0"), coords.fechaIngresoMes, page2)
          drawText(startDate.getFullYear().toString(), coords.fechaIngresoAnio, page2)
        }

        // Fecha de retiro
        if (exp.end_date) {
          const endDate = new Date(exp.end_date)
          drawText(endDate.getDate().toString().padStart(2, "0"), coords.fechaRetiroDia, page2)
          drawText((endDate.getMonth() + 1).toString().padStart(2, "0"), coords.fechaRetiroMes, page2)
          drawText(endDate.getFullYear().toString(), coords.fechaRetiroAnio, page2)
        } else if (exp.current || exp.is_current) {
          drawText("Actual", { x: coords.fechaRetiroDia.x, y: coords.fechaRetiroDia.y }, page2)
        }

        // Cargo y dependencia
        drawText(exp.position || "", coords.cargo, page2)
        drawText(exp.department || "", coords.dependencia, page2)

        // Dirección
        drawText(exp.company_address || exp.address || "", coords.direccionEmpresa, page2)
      })

      // Calcular experiencia por sector
      const publicExperience = calculateExperienceBySector(experienceData, "public")
      const privateExperience = calculateExperienceBySector(experienceData, "private")
      const independentExperience = calculateExperienceBySector(experienceData, "independent")

      // Calcular experiencia total (suma de todos los sectores)
      const totalExperience = calculateTotalExperience(experienceData)

      // Escribir experiencia por sector (con verificación de coordenadas)
      if (P3.aniosExperienciaPublica && P3.mesesExperienciaPublica) {
        drawText(publicExperience.years.toString(), P3.aniosExperienciaPublica, page3)
        drawText(publicExperience.months.toString(), P3.mesesExperienciaPublica, page3)
      }

      if (P3.aniosExperienciaPrivada && P3.mesesExperienciaPrivada) {
        drawText(privateExperience.years.toString(), P3.aniosExperienciaPrivada, page3)
        drawText(privateExperience.months.toString(), P3.mesesExperienciaPrivada, page3)
      }

      if (P3.aniosExperienciaIndependiente && P3.mesesExperienciaIndependiente) {
        drawText(independentExperience.years.toString(), P3.aniosExperienciaIndependiente, page3)
        drawText(independentExperience.months.toString(), P3.mesesExperienciaIndependiente, page3)
      }

      // Escribir experiencia total (con verificación de coordenadas)
      if (P3.aniosExperienciaTotal && P3.mesesExperienciaTotal) {
        drawText(totalExperience.years.toString(), P3.aniosExperienciaTotal, page3)
        drawText(totalExperience.months.toString(), P3.mesesExperienciaTotal, page3)
      }

      // Escribir tiempo total en página 3 (campos originales)
      drawText(totalExperience.years.toString(), P3.aniosExperiencia, page3)
      drawText(totalExperience.months.toString(), P3.mesesExperiencia, page3)

      // Repetir tiempo total en segunda sección
      drawText(totalExperience.years.toString(), P3.aniosExperiencia2, page3)
      drawText(totalExperience.months.toString(), P3.mesesExperiencia2, page3)

      // Marcar tipo de ocupación
      let hasPublic = false
      let hasPrivate = false
      let hasIndependent = false

      experienceData.forEach((exp) => {
        const sector = exp.sector || exp.company_type || ""
        if (sector.toLowerCase() === "public") hasPublic = true
        else if (sector.toLowerCase() === "private") hasPrivate = true
        else if (sector.toLowerCase() === "independent") hasIndependent = true
      })

      markCheckbox(hasPublic, P3.ocupacionPublica, page3)
      markCheckbox(hasPrivate, P3.ocupacionPrivada, page3)
      markCheckbox(hasIndependent, P3.ocupacionIndependiente, page3)

      // Fecha de diligenciamiento
      const today = new Date()
      const city = userData?.residence_city || userData?.city || "Bogotá"
      drawText(
        `${city}, ${today.getDate().toString().padStart(2, "0")}/${(today.getMonth() + 1).toString().padStart(2, "0")}/${today.getFullYear()}`,
        P3.ciudadFecha,
        page3,
      )
    }

    // Guardar el PDF
    const pdfBytes = await pdfDoc.save()
    return pdfBytes
  } catch (error) {
    console.error("Error generando PDF:", error)
    throw error
  }
}

// Función para convertir el nivel educativo a la modalidad académica requerida
function getModalidadAcademica(level: string | undefined): string {
  if (!level) return ""

  switch (level.toLowerCase()) {
    case "technical":
    case "técnica":
    case "tecnica":
      return "TC"
    case "technology":
    case "technological":
    case "tecnológica":
    case "tecnologica":
      return "TL"
    case "professional":
    case "profesional":
    case "pregrado":
      return "UN"
    case "specialization":
    case "especialización":
    case "especializacion":
      return "ES"
    case "master":
    case "maestría":
    case "maestria":
      return "MG"
    case "doctorate":
    case "doctorado":
      return "DOC"
    default:
      return ""
  }
}

// Función para calcular el tiempo total de experiencia
function calculateTotalExperience(experiences: any[]): { years: number; months: number } {
  let totalMonths = 0

  experiences.forEach((exp) => {
    if (exp.start_date) {
      const startDate = new Date(exp.start_date)
      const endDate = exp.current || exp.is_current ? new Date() : exp.end_date ? new Date(exp.end_date) : startDate

      // Calcular diferencia en meses
      const months =
        (endDate.getFullYear() - startDate.getFullYear()) * 12 + (endDate.getMonth() - startDate.getMonth())

      totalMonths += Math.max(0, months)
    }
  })

  const years = Math.floor(totalMonths / 12)
  const months = totalMonths % 12

  return { years, months }
}

// Función para calcular el tiempo de experiencia por sector
function calculateExperienceBySector(experiences: any[], sectorType: string): { years: number; months: number } {
  let totalMonths = 0

  experiences.forEach((exp) => {
    const sector = exp.sector || exp.company_type || ""

    // Solo contar experiencia del sector especificado
    if (sector.toLowerCase() === sectorType.toLowerCase() && exp.start_date) {
      const startDate = new Date(exp.start_date)
      const endDate = exp.current || exp.is_current ? new Date() : exp.end_date ? new Date(exp.end_date) : startDate

      // Calcular diferencia en meses
      const months =
        (endDate.getFullYear() - startDate.getFullYear()) * 12 + (endDate.getMonth() - startDate.getMonth())

      totalMonths += Math.max(0, months)
    }
  })

  const years = Math.floor(totalMonths / 12)
  const months = totalMonths % 12

  return { years, months }
}
