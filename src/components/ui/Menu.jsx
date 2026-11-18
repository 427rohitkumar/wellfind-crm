import { clsx } from 'clsx'
import { useState, useRef, useEffect, createContext, useContext } from 'react'
import { ChevronRight, Check } from 'lucide-react'

const MenuContext = createContext(null)

function useMenuContext() {
  const context = useContext(MenuContext)
  if (!context) {
    throw new Error('Menu components must be used within Menu')
  }
  return context
}

export function Menu({ children, className = '', trigger, ...props }) {
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
    <MenuContext.Provider value={{ isOpen, open, close, toggle, triggerRef, contentRef }}>
      <div className={clsx('menu', className)} {...props}>
        {trigger && (
          <button
            ref={triggerRef}
            type="button"
            className="menu__trigger"
            onClick={toggle}
            aria-expanded={isOpen}
            aria-haspopup="menu"
          >
            {trigger}
          </button>
        )}
        {isOpen && (
          <div
            ref={contentRef}
            className="menu__content"
            role="menu"
            aria-orientation="vertical"
          >
            <div className="menu__arrow" data-popper-arrow />
            {children}
          </div>
        )}
      </div>
    </MenuContext.Provider>
  )
}

export function MenuTrigger({ children, className = '', 'aria-label': ariaLabel, ...props }) {
  const { toggle, triggerRef, isOpen } = useMenuContext()

  return (
    <button
      ref={triggerRef}
      type="button"
      className={clsx('menu__trigger', className)}
      onClick={toggle}
      aria-expanded={isOpen}
      aria-haspopup="menu"
      aria-label={ariaLabel}
      {...props}
    >
      {children}
    </button>
  )
}

export function MenuContent({ children, className = '', align = 'end', side = 'bottom', sideOffset = 8, ...props }) {
  const { isOpen, close, contentRef } = useMenuContext()

  if (!isOpen) return null

  return (
    <div
      ref={contentRef}
      className={clsx('menu__content', `menu__content--${align}`, `menu__content--${side}`, className)}
      style={{ '--menu-side-offset': `${sideOffset}px` }}
      role="menu"
      aria-orientation="vertical"
      {...props}
    >
      <div className="menu__arrow" data-popper-arrow />
      {children}
    </div>
  )
}

export function MenuGroup({ children, className = '', label, ...props }) {
  return (
    <div className={clsx('menu__group', className)} role="group" aria-labelledby={label ? `${label}-label` : undefined} {...props}>
      {label && <h4 id={`${label}-label`} className="menu__group-label">{label}</h4>}
      {children}
    </div>
  )
}

export function MenuItem({ children, className = '', disabled = false, onClick, onSelect, value, shortcut, icon, ...props }) {
  const { close } = useMenuContext()

  const handleClick = (e) => {
    if (!disabled) {
      onClick?.(e)
      onSelect?.(value)
      close()
    }
  }

  return (
    <button
      type="button"
      role="menuitem"
      aria-disabled={disabled}
      className={clsx('menu__item', { 'menu__item--disabled': disabled }, className)}
      onClick={handleClick}
      {...props}
    >
      {icon && <span className="menu__item-icon" aria-hidden="true">{icon}</span>}
      <span className="menu__item-content">{children}</span>
      {shortcut && <span className="menu__item-shortcut" aria-hidden="true">{shortcut}</span>}
      {value !== undefined && <Check className="menu__item-check w-4 h-4" aria-hidden="true" />}
    </button>
  )
}

export function MenuSubmenu({ children, className = '', label, icon, ...props }) {
  const [isOpen, setIsOpen] = useState(false)
  const submenuRef = useRef(null)

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      setIsOpen(!isOpen)
    } else if (e.key === 'Escape') {
      setIsOpen(false)
    }
  }

  return (
    <div className={clsx('menu__submenu', className)} {...props}>
      <button
        ref={submenuRef}
        type="button"
        role="menuitem"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        className="menu__submenu-trigger"
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
      >
        {icon && <span className="menu__item-icon" aria-hidden="true">{icon}</span>}
        <span className="menu__item-content">{label}</span>
        <ChevronRight className={clsx('menu__submenu-chevron', { 'menu__submenu-chevron--open': isOpen })} aria-hidden="true" />
      </button>
      {isOpen && (
        <div className="menu__submenu-content" role="menu" aria-orientation="vertical">
          {children}
        </div>
      )}
    </div>
  )
}

export function MenuSeparator({ className = '', ...props }) {
  return <hr className={clsx('menu__separator', className)} role="separator" {...props} />
}

export function MenuLabel({ children, className = '', ...props }) {
  return <div className={clsx('menu__label', className)} {...props}>{children}</div>
}