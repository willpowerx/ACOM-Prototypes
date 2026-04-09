import { motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'

export default function PreviewCanvas({ config, replayKey, viewMode }) {
  const blurStyle = config.blur > 0 ? `blur(${config.blur}px)` : undefined

  const transitionProps = config.type === 'spring'
    ? { type: 'spring', stiffness: config.stiffness, damping: config.damping, mass: config.mass }
    : { duration: config.duration, ease: config.ease }

  const animateTarget = {
    opacity: config.opacity,
    ...(config.x !== 0 && { x: config.x }),
    ...(config.y !== 0 && { y: config.y }),
    ...(config.scale !== 1 && { scale: config.scale }),
    ...(config.rotate !== 0 && { rotate: config.rotate }),
  }

  return (
    <div
      className={`relative bg-[#121212] border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden transition-all duration-500 flex items-center justify-center ${
        viewMode === 'mobile' ? 'w-[375px] h-[667px]' : 'w-full h-full max-w-4xl max-h-[600px]'
      }`}
    >
      {/* Dot grid */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #1a1a1a 1px, transparent 0)', backgroundSize: '32px 32px' }}
      />
      {/* Ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-indigo-500/8 blur-[100px] pointer-events-none rounded-full" />

      {/* Content */}
      <div className="relative z-10 flex items-center justify-center w-full px-8">
        {config.splitType === 'none' ? (
          <SimplePreview
            config={config}
            replayKey={replayKey}
            blurStyle={blurStyle}
            animateTarget={animateTarget}
            transitionProps={transitionProps}
          />
        ) : (
          <SplitPreview
            config={config}
            replayKey={replayKey}
            blurStyle={blurStyle}
            transitionProps={transitionProps}
          />
        )}
      </div>
    </div>
  )
}

function SimplePreview({ config, replayKey, blurStyle, animateTarget, transitionProps }) {
  return (
    <div style={{ filter: blurStyle }}>
      <motion.div
        key={replayKey}
        initial={config.triggerOnMount ? { opacity: 0, scale: 0.8, y: 20 } : false}
        animate={config.triggerOnMount ? { ...animateTarget, transition: transitionProps } : undefined}
        whileHover={config.triggerOnHover ? { scale: config.scale * 1.05, filter: 'brightness(1.15)' } : undefined}
        whileTap={config.triggerOnTap ? { scale: config.scale * 0.95, filter: 'brightness(0.9)' } : undefined}
        className="p-8 bg-zinc-900/60 backdrop-blur-sm border border-zinc-800/60 rounded-2xl shadow-inner text-center max-w-sm"
      >
        <div className="w-14 h-14 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg shadow-indigo-500/30">
          <Sparkles className="text-white w-7 h-7" />
        </div>
        <h2 className="text-2xl font-bold mb-2 text-white leading-tight">{config.text}</h2>
        <p className="text-zinc-500 text-sm">High-performance React Motion</p>
      </motion.div>
    </div>
  )
}

function SplitPreview({ config, replayKey, blurStyle, transitionProps }) {
  const items = config.text.split(config.splitType === 'word' ? ' ' : '')

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: config.stagger },
    },
  }

  const childVariants = {
    hidden: { opacity: 0, y: 20, filter: 'blur(8px)' },
    visible: {
      opacity: config.opacity,
      y: config.y,
      scale: config.scale,
      rotate: config.rotate,
      filter: 'blur(0px)',
      transition: transitionProps,
    },
  }

  return (
    <div style={{ filter: blurStyle }}>
      <motion.div
        key={replayKey}
        variants={containerVariants}
        initial={config.triggerOnMount ? 'hidden' : 'visible'}
        animate="visible"
        whileHover={config.triggerOnHover ? { scale: 1.02 } : undefined}
        whileTap={config.triggerOnTap ? { scale: 0.98 } : undefined}
        className="flex flex-wrap justify-center gap-x-3 gap-y-1 max-w-2xl"
      >
        {items.map((item, i) => (
          <motion.span
            key={i}
            variants={childVariants}
            className="inline-block text-4xl font-black text-white leading-tight tracking-tighter"
          >
            {item || '\u00A0'}
          </motion.span>
        ))}
      </motion.div>
    </div>
  )
}
