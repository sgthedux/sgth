import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

export default function VerifyPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Verifica tu correo electrónico</CardTitle>
          <CardDescription>
            Hemos enviado un enlace de verificación a tu correo electrónico. Por favor, revisa tu bandeja de entrada y
            sigue las instrucciones para completar el registro.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center">
          <p className="mt-4 text-center text-sm text-gray-600">
            ¿Ya verificaste tu cuenta?{" "}
            <Link href="/auth/login" className="font-medium text-primary hover:text-primary/80">
              Iniciar sesión
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
