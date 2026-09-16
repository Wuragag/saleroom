import { describe, expect, it } from "vitest"
import AdmZip from "adm-zip"
import { extractText, isSupportedType } from "../document-parser"

const PPTX = "application/vnd.openxmlformats-officedocument.presentationml.presentation"

/** Build a minimal PPTX-shaped zip: slides with <a:t> runs, deliberately out of order. */
function makePptx(slides: Record<number, string[]>): Buffer {
  const zip = new AdmZip()
  zip.addFile("[Content_Types].xml", Buffer.from('<?xml version="1.0"?><Types/>'))
  for (const [n, runs] of Object.entries(slides)) {
    const body = runs.map((t) => `<a:r><a:t>${t}</a:t></a:r>`).join("")
    zip.addFile(`ppt/slides/slide${n}.xml`, Buffer.from(`<?xml version="1.0"?><p:sld><p:txBody><a:p>${body}</a:p></p:txBody></p:sld>`))
  }
  zip.addFile("ppt/notesSlides/notesSlide1.xml", Buffer.from("<p:notes><a:t>SPEAKER NOTES</a:t></p:notes>"))
  return zip.toBuffer()
}

describe("document-parser (adm-zip integration)", () => {
  it("recognises the Office and PDF types", () => {
    expect(isSupportedType(PPTX)).toBe(true)
    expect(isSupportedType("text/html")).toBe(false)
  })

  it("extracts slide text in slide order and ignores non-slide parts", async () => {
    const buf = makePptx({ 10: ["Ten"], 2: ["Two", "and more"], 1: ["One"] })
    const text = await extractText(buf, PPTX)
    expect(text.indexOf("One")).toBeGreaterThan(-1)
    expect(text.indexOf("One")).toBeLessThan(text.indexOf("Two"))
    expect(text.indexOf("Two")).toBeLessThan(text.indexOf("Ten"))
    expect(text).toContain("and more")
    expect(text).not.toContain("SPEAKER NOTES")
  })

  it("rejects a buffer that is not a zip at all", async () => {
    await expect(extractText(Buffer.from("definitely not a zip"), PPTX)).rejects.toThrow()
  })
})
