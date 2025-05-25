import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { FadeIn } from './components/animations/FadeIn'
import { PageContainer } from './components/layout/PageContainer'

function App(): React.JSX.Element {
  const [activeAppName, setActiveAppName] = useState<string | null>(null)

  useEffect(() => {
    const cleanup = window.api.onActiveWindowChanged((details) => {
      // Assuming details can be ActiveWindowDetails, but check if it can be null from preload
      setActiveAppName(details.ownerName)
    })

    return () => {
      if (typeof cleanup === 'function') {
        cleanup() // Call cleanup if it's a function
      }
    }
  }, [])

  return (
    <PageContainer>
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="text-center max-w-2xl mx-auto px-4"
      >
        <FadeIn delay={0.3}>
          <motion.h1
            className="text-5xl font-bold mb-6 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500 bg-clip-text text-transparent"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            Start Productivity-Maxxing
          </motion.h1>
          {activeAppName && (
            <motion.p
              className="text-lg text-gray-500 mt-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              Currently active: {activeAppName}
            </motion.p>
          )}
        </FadeIn>

        <FadeIn delay={0.5}>
          <motion.p
            className="text-xl text-gray-400 mb-12 leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            Discover and eliminate distractions with intelligent analysis
          </motion.p>
        </FadeIn>

        <FadeIn delay={0.7}>
          <motion.button
            className="group relative px-8 py-4 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 text-white font-medium text-lg overflow-hidden"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            transition={{ duration: 0.2 }}
          >
            <motion.span
              className="relative z-10"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
            >
              Get Started
            </motion.span>
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-purple-500 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              initial={{ x: '-100%' }}
              whileHover={{ x: '0%' }}
              transition={{ duration: 0.3 }}
            />
            <motion.div
              className="absolute inset-0 bg-white/10"
              initial={{ scale: 0 }}
              whileHover={{ scale: 2, opacity: 0 }}
              transition={{ duration: 0.5 }}
            />
          </motion.button>
        </FadeIn>
      </motion.div>
    </PageContainer>
  )
}

export default App
