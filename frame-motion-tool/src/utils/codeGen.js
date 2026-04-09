/**
 * Generates a production-ready Framer Motion JSX component string.
 */
export function generateFramerCode(config) {
  if (config.splitType !== 'none') {
    return generateSplitCode(config)
  }
  return generateSimpleCode(config)
}

// --- Simple (no text split) ---

function generateSimpleCode(config) {
  const animateProps = buildAnimateProps(config)
  const transitionStr = buildTransitionStr(config)

  const initialAttr = config.triggerOnMount
    ? `initial={{ opacity: 0, scale: 0.8, y: 20 }}`
    : `initial={false}`

  const animateAttr = config.triggerOnMount
    ? `\n      animate={${serializeProps(animateProps)}}`
    : ''

  const hoverAttr = config.triggerOnHover
    ? `\n      whileHover={{ scale: ${round(config.scale * 1.05)} }}`
    : ''

  const tapAttr = config.triggerOnTap
    ? `\n      whileTap={{ scale: ${round(config.scale * 0.95)} }}`
    : ''

  return `import { motion } from "framer-motion";

export const MyComponent = () => {
  return (
    <motion.div
      ${initialAttr}${animateAttr}${hoverAttr}${tapAttr}
      transition={{
        ${transitionStr}
      }}
    >
      {/* Your content here */}
    </motion.div>
  );
};`
}

// --- Split (word or char) ---

function generateSplitCode(config) {
  const animateProps = buildAnimateProps(config)
  const transitionStr = buildTransitionStr(config)
  const animateStr = serializeProps(animateProps)
  const escapedText = config.text.replace(/"/g, '\\"')

  return `import { motion } from "framer-motion";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: ${config.stagger} },
  },
};

const childVariants = {
  hidden: { opacity: 0, y: 20, filter: "blur(8px)" },
  visible: {
    ...${animateStr},
    filter: "blur(0px)",
    transition: { ${transitionStr} },
  },
};

export const AnimatedText = () => {
  const text = "${escapedText}";
  const items = text.split(${config.splitType === 'word' ? '" "' : '""'});

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}
    >
      {items.map((item, i) => (
        <motion.span key={i} variants={childVariants} style={{ display: "inline-block" }}>
          {item}
        </motion.span>
      ))}
    </motion.div>
  );
};`
}

// --- Helpers ---

function buildAnimateProps(config) {
  const props = { opacity: config.opacity } // opacity is never pruned

  if (config.x !== 0) props.x = config.x
  if (config.y !== 0) props.y = config.y
  if (config.scale !== 1) props.scale = config.scale
  if (config.rotate !== 0) props.rotate = config.rotate
  if (config.blur > 0) props.filter = `blur(${config.blur}px)`

  return props
}

function buildTransitionStr(config) {
  if (config.type === 'spring') {
    return `type: "spring", stiffness: ${config.stiffness}, damping: ${config.damping}, mass: ${config.mass}`
  }
  return `duration: ${config.duration}, ease: "${config.ease}"`
}

function round(n) {
  return Math.round(n * 100) / 100
}

function serializeProps(props) {
  const parts = Object.entries(props).map(([k, v]) => {
    const val = typeof v === 'string' ? `"${v}"` : v
    return `${k}: ${val}`
  })
  return `{ ${parts.join(', ')} }`
}
