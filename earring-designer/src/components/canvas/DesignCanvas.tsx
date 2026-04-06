import { useRef, useCallback, useEffect } from 'react'
import { useDesignStore } from '../../store/designStore.ts'
import { usePaletteStore } from '../../store/paletteStore.ts'
import { getShapeCells } from '../../lib/shapeUtils.ts'
import { buildFringeLayout, maxFringeHeight } from '../../lib/fringeUtils.ts'
import { BrickStitchBody, getBodySvgDimensions, getBodyBottomY, getAnchorPositions, svgCoordsToCell, PADDING } from './BrickStitchBody.tsx'
import { FringeStrands } from './FringeStrands.tsx'

interface Props {
  svgRef: React.RefObject<SVGSVGElement | null>
}

export function DesignCanvas({ svgRef }: Props) {
  const shapeConfig = useDesignStore(s => s.shapeConfig)
  const fringeConfig = useDesignStore(s => s.fringeConfig)
  const paintCells = useDesignStore(s => s.paintCells)
  const paintFringeCells = useDesignStore(s => s.paintFringeCells)
  const selectedBeadId = usePaletteStore(s => s.selectedBeadId)

  // Track pointer state for drag-paint
  const isPointerDown = useRef(false)
  const pendingBodyKeys = useRef<Set<string>>(new Set())
  const pendingFringeKeys = useRef<Set<string>>(new Set())

  // Compute layout
  const activeCells = getShapeCells(shapeConfig)
  const bodyDims = getBodySvgDimensions(shapeConfig)
  const bodyBottomY = getBodyBottomY(shapeConfig.rows)
  const anchors = getAnchorPositions(activeCells, shapeConfig.rows)
  const anchorXs = anchors.map(a => a.x)
  const strands = buildFringeLayout(anchorXs, fringeConfig, bodyBottomY)
  const fringeH = maxFringeHeight(strands)

  const svgWidth = bodyDims.width + PADDING
  const svgHeight = bodyDims.height + fringeH + PADDING

  const commitPending = useCallback(() => {
    if (pendingBodyKeys.current.size > 0) {
      paintCells(Array.from(pendingBodyKeys.current), selectedBeadId)
      pendingBodyKeys.current = new Set()
    }
    if (pendingFringeKeys.current.size > 0) {
      paintFringeCells(Array.from(pendingFringeKeys.current), selectedBeadId)
      pendingFringeKeys.current = new Set()
    }
  }, [paintCells, paintFringeCells, selectedBeadId])

  const handlePointerDown = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    if (!selectedBeadId && selectedBeadId !== null) return
    e.currentTarget.setPointerCapture(e.pointerId)
    isPointerDown.current = true
    pendingBodyKeys.current = new Set()
    pendingFringeKeys.current = new Set()

    // Hit-test body
    const rect = e.currentTarget.getBoundingClientRect()
    const vb = e.currentTarget.viewBox.baseVal
    const scaleX = vb.width / rect.width
    const scaleY = vb.height / rect.height
    const svgX = (e.clientX - rect.left) * scaleX
    const svgY = (e.clientY - rect.top) * scaleY

    const [row, col] = svgCoordsToCell(svgX, svgY)
    const key = `${row},${col}`
    if (activeCells.has(key)) {
      pendingBodyKeys.current.add(key)
    }
  }, [selectedBeadId, activeCells])

  const handlePointerUp = useCallback(() => {
    if (!isPointerDown.current) return
    isPointerDown.current = false
    commitPending()
  }, [commitPending])

  const handleBodyCellEnter = useCallback((key: string) => {
    if (!isPointerDown.current) return
    pendingBodyKeys.current.add(key)
  }, [])

  const handleFringeCellEnter = useCallback((key: string) => {
    if (!isPointerDown.current) return
    pendingFringeKeys.current.add(key)
  }, [])

  // Ensure pointer up fires even outside SVG
  useEffect(() => {
    const up = () => {
      if (isPointerDown.current) {
        isPointerDown.current = false
        commitPending()
      }
    }
    window.addEventListener('pointerup', up)
    return () => window.removeEventListener('pointerup', up)
  }, [commitPending])

  return (
    <svg
      ref={svgRef as React.RefObject<SVGSVGElement>}
      viewBox={`0 0 ${svgWidth} ${svgHeight}`}
      width={svgWidth * 2}
      height={svgHeight * 2}
      style={{ background: '#ffffff', display: 'block', touchAction: 'none', maxWidth: '100%' }}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
    >
      <BrickStitchBody onCellEnter={handleBodyCellEnter} />
      <FringeStrands strands={strands} onSegmentEnter={handleFringeCellEnter} />
    </svg>
  )
}
