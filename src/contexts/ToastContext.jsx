import { createContext, useCallback, useContext, useRef, useState } from 'react'

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const idRef = useRef(0)

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  // options: { actionLabel, onAction, duration }
  const showToast = useCallback(
    (message, options = {}) => {
      const id = ++idRef.current
      const duration = options.duration ?? (options.actionLabel ? 10000 : 2500)
      setToasts((prev) => [
        ...prev,
        { id, message, actionLabel: options.actionLabel, onAction: options.onAction },
      ])
      window.setTimeout(() => dismiss(id), duration)
      return id
    },
    [dismiss],
  )

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="toast-container">
        {toasts.map((t) => (
          <div className="toast" key={t.id}>
            <span>{t.message}</span>
            {t.actionLabel && (
              <button
                type="button"
                className="toast-action"
                onClick={() => {
                  t.onAction?.()
                  dismiss(t.id)
                }}
              >
                {t.actionLabel}
              </button>
            )}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  return useContext(ToastContext)
}
