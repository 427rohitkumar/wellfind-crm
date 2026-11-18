import { clsx } from 'clsx'
import { useState, useRef, useEffect, createContext, useContext } from 'react'
import { X } from 'lucide-react'

const PopoverContext = createContext(null)

function usePopoverContext() {
  const context = useContext(PopoverContext)
  if (!context) {
    throw new Error('Popover components must be used within Popover')
  }
  return context
}

export function Popover({ children, className = '', ...props }) {
  const [isOpen, setIsOpen] = useState(false)
  const triggerRef = useRef(null)
  const contentRef = useRef(null)

  const open = () => setIsOpen(true)
  const close = () => setIsOpen(false)
  const toggle = () => setIsOpen((prev) => !prev)

  useEffect(() => {
    function handleClickOutside(event) {
      if (contentRef.current && !contentRef.current.contains(event.target)) {
        if (triggerRef.current && !triggerRef.current.contains(event.target)) {
          close()
        }
      }
    }

    function handleEscape(event) {
      if (event.key === 'Escape') {
        close()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleEscape)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen])

  return (
    <PopoverContext.Provider value={{ isOpen, open, close, toggle, triggerRef, contentRef }}>
      <div className={clsx('popover', className)} {...props}>
        {children}
      </div>
    </PopoverContext.Provider>
  )
}

export function PopoverTrigger({ children, className = '', 'aria-label': ariaLabel, ...props }) {
  const { isOpen, toggle, triggerRef } = usePopoverContext()

  return (
    <button
      ref={triggerRef}
      type="button"
      className={clsx('popover__trigger', className)}
      onClick={toggle}
      aria-expanded={isOpen}
      aria-haspopup="dialog"
      aria-label={ariaLabel}
      {...props}
    >
      {children}
    </button>
  )
}

export function PopoverContent({ children, className = '', align = 'end', side = 'bottom', sideOffset = 8, ...props }) {
  const { isOpen, close, contentRef } = usePopoverContext()

  if (!isOpen) return null

  return (
    <div
      ref={contentRef}
      className={clsx('popover__content', `popover__content--${align}`, `popover__content--${side}`, className)}
      style={{ '--popover-side-offset': `${sideOffset}px` }}
      role="dialog"
      aria-modal="true"
      {...props}
    >
      <div className="popover__arrow" data-popper-arrow />
      {children}
    </div>
  )
}

export function PopoverHeader({ children, className = '', title, action, ...props }) {
  return (
    <div className={clsx('popover__header', className)} {...props}>
      <div className="popover__header-content">
        {title && <h3 className="popover__title">{title}</h3>}
      </div>
      {action && <div className="popover__action">{action}</div>}
    </div>
  )
}

export function PopoverBody({ children, className = '', ...props }) {
  return (
    <div className={clsx('popover__body', className)} {...props}>
      {children}
    </div>
  )
}

export function PopoverFooter({ children, className = '', ...props }) {
  return (
    <div className={clsx('popover__footer', className)} {...props}>
      {children}
    </div>
  )
}

export function PopoverClose({ className = '', 'aria-label': ariaLabel = 'Close', ...props }) {
  const { close } = usePopoverContext()

  return (
    <button
      type="button"
      className={clsx('popover__close button button--ghost button--icon button--sm', className)}
      onClick={close}
      aria-label={ariaLabel}
      {...props}
    >
      <X className="w-4 h-4" aria-hidden="true" />
    </button>
  )
}