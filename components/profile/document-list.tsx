"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, ExternalLink, Trash2, FileText, CheckCircle, XCircle, Clock } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { formatDate } from "@/lib/utils"

interface Document {
  id: string
  name: string
  type: string
  url: string
  status: string
  created_at: string
}

interface DocumentListProps {
  userId: string
  documents: Document[]
  isAdmin?: boolean
}

export function DocumentList({ userId, documents, isAdmin = false }: DocumentListProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [documentToDelete, setDocumentToDelete] = useState<string | null>(null)
  const supabase = createClient()

  const handleDelete = async (id: string) => {
    setLoading(true)
    setError(null)

    try {
      const { error } = await supabase.from("documents").delete().eq("id", id)
      if (error) throw error

      router.refresh()
    } catch (error: any) {
      setError(error.message || "Error al eliminar el documento")
    } finally {
      setLoading(false)
      setDocumentToDelete(null)
    }
  }

  const handleStatusChange = async (id: string, status: string) => {
    setLoading(true)
    setError(null)

    try {
      const { error } = await supabase.from("documents").update({ status }).eq("id", id)
      if (error) throw error

      router.refresh()
    } catch (error: any) {
      setError(error.message || "Error al actualizar el estado del documento")
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Aprobado":
        return (
          <Badge className="bg-green-500">
            <CheckCircle className="h-3 w-3 mr-1" /> Aprobado
          </Badge>
        )
      case "Rechazado":
        return (
          <Badge variant="destructive">
            <XCircle className="h-3 w-3 mr-1" /> Rechazado
          </Badge>
        )
      default:
        return (
          <Badge variant="outline">
            <Clock className="h-3 w-3 mr-1" /> Pendiente
          </Badge>
        )
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Documentos</CardTitle>
        <CardDescription>Lista de documentos subidos</CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {documents.length === 0 ? (
          <div className="text-center py-6">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground" />
            <p className="mt-2 text-muted-foreground">No hay documentos subidos</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {documents.map((doc) => (
                <TableRow key={doc.id}>
                  <TableCell className="font-medium">{doc.name}</TableCell>
                  <TableCell>{doc.type}</TableCell>
                  <TableCell>{formatDate(new Date(doc.created_at))}</TableCell>
                  <TableCell>{getStatusBadge(doc.status)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <a href={doc.url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>

                      {isAdmin ? (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleStatusChange(doc.id, "Aprobado")}
                            disabled={doc.status === "Aprobado" || loading}
                          >
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleStatusChange(doc.id, "Rechazado")}
                            disabled={doc.status === "Rechazado" || loading}
                          >
                            <XCircle className="h-4 w-4 text-red-500" />
                          </Button>
                        </>
                      ) : (
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" onClick={() => setDocumentToDelete(doc.id)}>
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Eliminar Documento</DialogTitle>
                              <DialogDescription>
                                ¿Estás seguro de que deseas eliminar este documento? Esta acción no se puede deshacer.
                              </DialogDescription>
                            </DialogHeader>
                            <DialogFooter>
                              <Button variant="outline" onClick={() => setDocumentToDelete(null)}>
                                Cancelar
                              </Button>
                              <Button
                                variant="destructive"
                                onClick={() => documentToDelete && handleDelete(documentToDelete)}
                                disabled={loading}
                              >
                                {loading ? "Eliminando..." : "Eliminar"}
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
