import { describe, it, expect } from 'vitest'
import { generateFramerCode } from './codeGen'

const BASE = {
  opacity: 1, x: 0, y: 0, scale: 1, rotate: 0, blur: 0,
  type: 'spring', stiffness: 100, damping: 10, mass: 1,
  duration: 0.5, ease: 'easeInOut',
  triggerOnMount: true, triggerOnHover: false, triggerOnTap: false,
  text: 'Hello', splitType: 'none', stagger: 0.05,
}

describe('generateFramerCode', () => {
  it('always emits opacity in animate even when opacity is 1', () => {
    const code = generateFramerCode(BASE)
    expect(code).toContain('opacity: 1')
  })

  it('omits x when x is 0', () => {
    const code = generateFramerCode(BASE)
    expect(code).not.toMatch(/\bx:\s*0\b/)
  })

  it('omits y when y is 0', () => {
    const code = generateFramerCode(BASE)
    expect(code).not.toMatch(/\by:\s*0\b/)
  })

  it('omits rotate when rotate is 0', () => {
    const code = generateFramerCode(BASE)
    expect(code).not.toMatch(/\brotate:\s*0\b/)
  })

  it('omits scale when scale is 1', () => {
    const code = generateFramerCode(BASE)
    expect(code).not.toMatch(/\bscale:\s*1\b/)
  })

  it('omits filter when blur is 0', () => {
    const code = generateFramerCode(BASE)
    expect(code).not.toContain('filter')
  })

  it('emits filter in animate when blur > 0', () => {
    const code = generateFramerCode({ ...BASE, blur: 5 })
    expect(code).toContain('filter: "blur(5px)"')
  })

  it('emits spring transition props', () => {
    const code = generateFramerCode(BASE)
    expect(code).toContain('type: "spring"')
    expect(code).toContain('stiffness: 100')
    expect(code).toContain('damping: 10')
    expect(code).toContain('mass: 1')
  })

  it('emits tween transition when type is tween', () => {
    const code = generateFramerCode({ ...BASE, type: 'tween', duration: 0.8, ease: 'easeOut' })
    expect(code).toContain('duration: 0.8')
    expect(code).toContain('ease: "easeOut"')
    expect(code).not.toContain('type: "spring"')
  })

  it('emits initial={false} when triggerOnMount is false', () => {
    const code = generateFramerCode({ ...BASE, triggerOnMount: false })
    expect(code).toContain('initial={false}')
    expect(code).not.toContain('animate=')
  })

  it('emits whileHover when triggerOnHover is true', () => {
    const code = generateFramerCode({ ...BASE, triggerOnHover: true })
    expect(code).toContain('whileHover=')
  })

  it('does not emit whileHover when triggerOnHover is false', () => {
    const code = generateFramerCode(BASE)
    expect(code).not.toContain('whileHover')
  })

  it('emits whileTap when triggerOnTap is true', () => {
    const code = generateFramerCode({ ...BASE, triggerOnTap: true })
    expect(code).toContain('whileTap=')
  })

  it('emits containerVariants and childVariants for word split', () => {
    const code = generateFramerCode({ ...BASE, splitType: 'word' })
    expect(code).toContain('containerVariants')
    expect(code).toContain('childVariants')
    expect(code).toContain('staggerChildren')
  })

  it('emits containerVariants and childVariants for char split', () => {
    const code = generateFramerCode({ ...BASE, splitType: 'char' })
    expect(code).toContain('containerVariants')
    expect(code).toContain('childVariants')
  })

  it('includes framer-motion import', () => {
    const code = generateFramerCode(BASE)
    expect(code).toContain('from "framer-motion"')
  })

  it('escapes double quotes in text for split mode', () => {
    const code = generateFramerCode({ ...BASE, splitType: 'word', text: 'Say "hello" world' })
    expect(code).toContain('const text = "Say \\"hello\\" world"')
  })
})
