import { useEffect } from 'react'
import './Toast.css'

interface ToastProps {
  message: string
  type?: 'success' | 'info' | 'warning'
  onClose: () => void
  duration?: number
}

export default function Toast({ message, type = 'info', onClose, duration = 3000 }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, duration)
    return () => clearTimeout(timer)
  }, [duration, onClose])

  return (
    <div className={`toast toast-${type}`}>
      <div className="toast-content">
        <div className="toast-icon">
          {type === 'success' && '✓'}
          {type === 'info' && 'ℹ'}
          {type === 'warning' && '⚠'}
        </div>
        <span className="toast-message">{message}</span>
      </div>
    </div>
  )
}
