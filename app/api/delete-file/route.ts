import { NextResponse } from "next/server"
import { deleteFromR2WithBucket } from "@/lib/r2-direct"

export async function POST(request: Request) {
  try {
    const { filePath } = await request.json()

    if (!filePath) {
      return NextResponse.json({ error: "File path is required" }, { status: 400 })
    }

    console.log(`Deleting file from R2: ${filePath}`)
    
    // Usar la función de eliminación con el bucket de licencias
    await deleteFromR2WithBucket(filePath, process.env.R2_LICENSE_BUCKET)

    console.log(`File ${filePath} deleted successfully from R2`)
    return NextResponse.json({ success: true, message: `File ${filePath} deleted successfully.` })
  } catch (error) {
    console.error("Error deleting file from R2:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: "Failed to delete file from R2", details: errorMessage }, { status: 500 })
  }
}
