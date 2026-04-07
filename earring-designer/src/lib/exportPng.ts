/**
 * Exports an SVG element as a PNG download.
 * The SVG must use only inline attributes (no Tailwind classes) for correct export.
 */
export async function exportSvgAsPng(svgEl: SVGSVGElement, filename = 'earring-pattern.png', scale = 3): Promise<void> {
  const svgData = new XMLSerializer().serializeToString(svgEl)
  const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
  const url = URL.createObjectURL(svgBlob)

  const viewBox = svgEl.viewBox.baseVal
  const width = viewBox.width || svgEl.clientWidth
  const height = viewBox.height || svgEl.clientHeight

  const canvas = document.createElement('canvas')
  canvas.width = width * scale
  canvas.height = height * scale

  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Could not get canvas context')

  const img = new Image()
  img.width = width * scale
  img.height = height * scale

  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve()
    img.onerror = reject
    img.src = url
  })

  ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
  URL.revokeObjectURL(url)

  const pngUrl = canvas.toDataURL('image/png')
  const a = document.createElement('a')
  a.href = pngUrl
  a.download = filename
  a.click()
}
