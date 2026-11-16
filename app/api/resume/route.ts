import mammoth from "mammoth"
import { extractText, getDocumentProxy } from "unpdf"

// Reads the text out of an uploaded resume (PDF, Word .docx or plain text) so the
// setup page can put it in the resume box. Multipart form: file. The file is read
// in memory and never stored.
const MAX_BYTES = 5 * 1024 * 1024

export async function POST(req: Request) {
  const form = await req.formData().catch(() => null)
  const file = form?.get("file")
  if (!(file instanceof File) || file.size === 0) return Response.json({ error: "no_file", message: "Send a file." }, { status: 400 })
  if (file.size > MAX_BYTES) return Response.json({ error: "too_large", message: "The file is larger than 5 MB." }, { status: 413 })

  const name = file.name.toLowerCase()
  let text: string
  try {
    if (name.endsWith(".pdf") || file.type === "application/pdf") {
      const pdf = await getDocumentProxy(new Uint8Array(await file.arrayBuffer()))
      text = (await extractText(pdf, { mergePages: true })).text
    } else if (name.endsWith(".docx")) {
      text = (await mammoth.extractRawText({ buffer: Buffer.from(await file.arrayBuffer()) })).value
    } else if (name.endsWith(".txt") || file.type.startsWith("text/")) {
      text = await file.text()
    } else {
      return Response.json({ error: "unsupported_type", message: "Send a PDF, a Word .docx file or a text file." }, { status: 415 })
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "could not read the file"
    return Response.json({ error: "unreadable", message }, { status: 422 })
  }

  text = text.replace(/\r/g, "").replace(/\n{3,}/g, "\n\n").trim()
  // A scanned resume is a picture of text, so there is nothing to read.
  if (!text) return Response.json({ error: "no_text", message: "No text was found in the file." }, { status: 422 })
  return Response.json({ text })
}
