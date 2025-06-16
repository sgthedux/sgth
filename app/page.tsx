"use client"
import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { User, FileText, FileCheck, BarChart, LayoutDashboard, Settings, Briefcase, Search } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { LicenseRequestForm } from "@/components/licenses/license-request-form"

export default function Home() {
  const [isLicenseModalOpen, setIsLicenseModalOpen] = useState(false)

  const handleOpenLicenseModal = () => setIsLicenseModalOpen(true)
  const handleCloseLicenseModal = () => setIsLicenseModalOpen(false)

  const handleLicenseRequestSuccess = (result: any) => {
    console.log("Solicitud de licencia enviada con éxito. Radicado:", result.radicado)
    // No cerrar el modal automáticamente para que el usuario vea el radicado
    // setIsLicenseModalOpen(false)
  }

  return (
    <div className="flex flex-col min-h-screen">
      <header className="border-b">
        <div className="container flex h-16 items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-2">
            <Image
              src="/images/logo.png"
              alt="Utedé Logo"
              width={150}
              height={50}
              className="object-contain"
              priority
            />
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Link href="/auth/login">
              <Button variant="outline">Iniciar sesión</Button>
            </Link>
          </div>
        </div>
      </header>
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 bg-background">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 items-center">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none title-text">
                    Sistema de Gestión de Talento Humano
                  </h1>
                  <p className="max-w-[600px] text-muted-foreground md:text-xl subtitle-text">
                    Gestiona eficientemente el talento humano de tu organización con nuestra plataforma integral.
                  </p>
                </div>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Link href="/auth/login">
                    <Button size="lg" className="bg-primary hover:bg-primary/90">
                      Iniciar sesión
                    </Button>
                  </Link>
                  <Link href="/auth/login">
                    <Button size="lg" variant="outline">
                      Registrarse
                    </Button>
                  </Link>
                </div>
              </div>
              <div className="flex justify-center">
                <Image
                  src="/images/team-planning.webp"
                  alt="Equipo planificando gestión de talento"
                  width={600}
                  height={400}
                  className="object-cover rounded-lg shadow-lg"
                  priority
                />
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="w-full py-12 md:py-24 lg:py-32 bg-muted/30 subtle-pattern">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl title-text">
                  Características principales
                </h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed subtitle-text">
                  Nuestra plataforma ofrece todas las herramientas necesarias para una gestión eficiente del talento
                  humano.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 mt-8">
              {[
                {
                  title: "Gestión de perfiles",
                  description: "Administra perfiles completos con información personal, académica y profesional.",
                  icon: <User className="h-10 w-10 text-primary" />,
                },
                {
                  title: "Documentación digital",
                  description: "Almacena y gestiona documentos importantes de manera segura y organizada.",
                  icon: <FileText className="h-10 w-10 text-primary" />,
                },
                {
                  title: "Hojas de vida",
                  description: "Genera y actualiza hojas de vida profesionales con un solo clic.",
                  icon: <FileCheck className="h-10 w-10 text-primary" />,
                },
                {
                  title: "Reportes avanzados",
                  description: "Obtén informes detallados y estadísticas sobre el talento humano.",
                  icon: <BarChart className="h-10 w-10 text-primary" />,
                },
                {
                  title: "Panel administrativo",
                  description: "Controla todos los aspectos del sistema desde un panel intuitivo.",
                  icon: <LayoutDashboard className="h-10 w-10 text-primary" />,
                },
                {
                  title: "Seguridad avanzada",
                  description: "Protección de datos con los más altos estándares de seguridad.",
                  icon: <Settings className="h-10 w-10 text-primary" />,
                },
              ].map((feature, index) => (
                <div
                  key={index}
                  className="flex flex-col items-center space-y-2 rounded-lg border p-6 bg-card shadow-sm card-hover"
                >
                  <div className="p-2 rounded-full bg-primary/10">{feature.icon}</div>
                  <h3 className="text-xl font-bold">{feature.title}</h3>
                  <p className="text-muted-foreground text-center">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="licenses" className="w-full py-12 md:py-24 lg:py-32 bg-background">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <div className="inline-block rounded-lg bg-muted px-3 py-1 text-sm text-primary">Nuevo Módulo</div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl title-text">
                  Sistema de Licencias y Permisos Laborales
                </h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed subtitle-text">
                  Gestiona tus solicitudes de licencias y permisos de manera eficiente. Realiza nuevas solicitudes o
                  consulta el estado de las existentes.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-md gap-6 mt-12">
              <div className="flex flex-col items-center space-y-4">
                <Button size="lg" onClick={handleOpenLicenseModal}>
                  <Briefcase className="mr-2 h-5 w-5" /> Solicitar Licencia o Permiso
                </Button>
                <p className="text-sm text-muted-foreground">Completa el formulario para enviar tu solicitud.</p>
              </div>
              <div className="flex flex-col items-center space-y-4">
                <Link href="/consulta-licencias">
                  <Button size="lg" variant="outline">
                    <Search className="mr-2 h-5 w-5" /> Consultar Estado de Solicitud
                  </Button>
                </Link>
                <p className="text-sm text-muted-foreground">Ingresa tu número de radicado para ver el estado.</p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="border-t py-6 md:py-8">
        <div className="container flex flex-col items-center justify-center gap-4 px-4 md:px-6 md:flex-row md:justify-between">
          <div className="flex items-center gap-2">
            <Image src="/images/logo.png" alt="Utedé Logo" width={120} height={40} className="object-contain" />
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} SGTH. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </footer>

      {/* Modal para solicitud de licencia */}
      <Dialog open={isLicenseModalOpen} onOpenChange={setIsLicenseModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Solicitar Licencia o Permiso</DialogTitle>
          </DialogHeader>
          <LicenseRequestForm onSuccess={handleLicenseRequestSuccess} onClose={handleCloseLicenseModal} />
        </DialogContent>
      </Dialog>
    </div>
  )
}
