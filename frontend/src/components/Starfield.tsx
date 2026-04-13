import React, { useEffect, useRef } from 'react'

const Starfield: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size
    let width = window.innerWidth
    let height = window.innerHeight
    let dpr = Math.min(window.devicePixelRatio || 1, 2)

    const updateSize = () => {
      width = window.innerWidth
      height = window.innerHeight
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.floor(width * dpr)
      canvas.height = Math.floor(height * dpr)
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    updateSize()
    window.addEventListener('resize', updateSize)

    // Create stars
    const stars: Array<{
      x: number
      y: number
      radius: number
      baseOpacity: number
      twinklePhase: number
      twinkleSpeed: number
      driftSpeed: number
      driftAxis: number
      color: string
      hasSpikes: boolean
    }> = []

    const starPalette = ['#f5f7ff', '#dce8ff', '#ffe9c8', '#f7ddff', '#d8fbff']
    const starCount = Math.max(180, Math.min(320, Math.floor((width * height) / 9000)))

    for (let i = 0; i < starCount; i++) {
      const radius = Math.random() * 1.8 + 0.35
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius,
        baseOpacity: Math.random() * 0.55 + 0.2,
        twinklePhase: Math.random() * Math.PI * 2,
        twinkleSpeed: Math.random() * 1.8 + 0.4,
        driftSpeed: Math.random() * 0.12 + 0.03,
        driftAxis: Math.random() * Math.PI * 2,
        color: starPalette[Math.floor(Math.random() * starPalette.length)],
        hasSpikes: radius > 1.4 && Math.random() > 0.2
      })
    }

    const nebulae = Array.from({ length: 3 }).map(() => ({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 260 + 180
    }))

    let animationFrame: number
    const startTime = performance.now()

    const animate = () => {
      const elapsed = (performance.now() - startTime) / 1000
      ctx.clearRect(0, 0, width, height)

      nebulae.forEach((cloud, idx) => {
        const driftX = Math.sin(elapsed * 0.04 + idx) * 12
        const driftY = Math.cos(elapsed * 0.05 + idx * 0.7) * 9
        const gradient = ctx.createRadialGradient(
          cloud.x + driftX,
          cloud.y + driftY,
          0,
          cloud.x + driftX,
          cloud.y + driftY,
          cloud.radius
        )
        gradient.addColorStop(0, 'rgba(117, 66, 210, 0.12)')
        gradient.addColorStop(1, 'rgba(117, 66, 210, 0)')
        ctx.fillStyle = gradient
        ctx.beginPath()
        ctx.arc(cloud.x + driftX, cloud.y + driftY, cloud.radius, 0, Math.PI * 2)
        ctx.fill()
      })

      stars.forEach((star) => {
        const twinkle = 0.82 + Math.sin(elapsed * star.twinkleSpeed + star.twinklePhase) * 0.18
        const opacity = Math.max(0.08, Math.min(1, star.baseOpacity * twinkle))

        // Slow drift
        star.x += Math.sin(elapsed * 0.08 + star.driftAxis) * star.driftSpeed
        star.y += Math.cos(elapsed * 0.08 + star.driftAxis) * star.driftSpeed

        // Wrap around screen
        if (star.x < 0) star.x = width
        if (star.x > width) star.x = 0
        if (star.y < 0) star.y = height
        if (star.y > height) star.y = 0

        // Draw star
        ctx.save()
        ctx.globalAlpha = opacity

        const glow = ctx.createRadialGradient(star.x, star.y, 0, star.x, star.y, star.radius * 6)
        glow.addColorStop(0, star.color)
        glow.addColorStop(1, 'rgba(255,255,255,0)')
        ctx.fillStyle = glow
        ctx.beginPath()
        ctx.arc(star.x, star.y, star.radius * 6, 0, Math.PI * 2)
        ctx.fill()

        ctx.fillStyle = '#ffffff'
        ctx.beginPath()
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2)
        ctx.fill()

        if (star.hasSpikes) {
          ctx.strokeStyle = star.color
          ctx.globalAlpha = opacity * 0.55
          ctx.lineWidth = 0.9
          const arm = star.radius * 6
          ctx.beginPath()
          ctx.moveTo(star.x - arm, star.y)
          ctx.lineTo(star.x + arm, star.y)
          ctx.moveTo(star.x, star.y - arm)
          ctx.lineTo(star.x, star.y + arm)
          ctx.stroke()
        }

        ctx.restore()
      })

      animationFrame = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener('resize', updateSize)
      if (animationFrame) {
        cancelAnimationFrame(animationFrame)
      }
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ background: 'transparent' }}
    />
  )
}

export default Starfield