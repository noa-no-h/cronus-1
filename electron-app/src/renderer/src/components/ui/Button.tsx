import { motion } from 'framer-motion'
import { ReactNode } from 'react'

interface ButtonProps {
  children: ReactNode
  onClick?: () => void
  href?: string
  className?: string
  variant?: 'primary' | 'secondary'
}

export function Button({
  children,
  onClick,
  href,
  className = '',
  variant = 'primary'
}: ButtonProps): React.JSX.Element {
  const baseClasses = 'px-5 py-2 rounded-full border transition-colors'
  const variantClasses = {
    primary: 'border-gray-700 hover:bg-gray-800',
    secondary: 'border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white'
  }

  const Component = href ? 'a' : 'button'
  const props = href ? { href, target: '_blank', rel: 'noreferrer' } : { onClick }

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2 }}
    >
      <Component {...props} className={`${baseClasses} ${variantClasses[variant]} ${className}`}>
        {children}
      </Component>
    </motion.div>
  )
}
