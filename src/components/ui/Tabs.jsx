import { useCallback, useId, useState, createContext, useContext } from 'react';
import { clsx } from 'clsx';

const TabsContext = createContext(null);

/**
 * Tabs provider — holds the active tab value and change handler.
 * Supports both controlled (`value`/`onValueChange`) and uncontrolled usage.
 */
export function Tabs({
  children,
  defaultValue,
  value,
  onValueChange,
  className = '',
}) {
  const [internalValue, setInternalValue] = useState(defaultValue);
  const currentValue = value !== undefined ? value : internalValue;

  const handleValueChange = useCallback(
    (next) => {
      if (internalValue !== next) {
        setInternalValue(next);
        onValueChange?.(next);
      }
    },
    [internalValue, onValueChange],
  );

  return (
    <TabsContext.Provider value={{ value: currentValue, onValueChange: handleValueChange }}>
      <div className={clsx('tabs-root', className)}>{children}</div>
    </TabsContext.Provider>
  );
}

/**
 * TabsList — the tablist container holding the triggers.
 */
export function TabsList({ children, className = '' }) {
  return (
    <div
      role="tablist"
      aria-orientation="horizontal"
      className={clsx(
        'tabs-list inline-flex flex-wrap gap-0.5 border-b border-border px-1',
        className,
      )}
    >
      {children}
    </div>
  );
}

/**
 * TabsTrigger — an individual tab button.
 */
export function TabsTrigger({ children, value, className = '', disabled = false, ...props }) {
  const { value: activeValue, onValueChange } = useContext(TabsContext);
  const id = useId();
  const isActive = activeValue === value;

  const handleClick = () => {
    if (!disabled && onValueChange) {
      onValueChange(value);
    }
  };

  return (
    <button
      role="tab"
      aria-selected={isActive}
      aria-controls={isActive ? `tabs-panel-${id}` : undefined}
      id={`tabs-trigger-${id}`}
      data-state={isActive ? 'active' : 'inactive'}
      disabled={disabled}
      onClick={handleClick}
      className={clsx(
        'tabs-trigger inline-flex items-center justify-center whitespace-nowrap',
        'rounded-t-lg border border-transparent px-3 py-2 text-sm font-medium transition-colors',
        'data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:text-primary data-[state=inactive]:hover:border-primary/30',
        'data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary',
        disabled && 'opacity-50 cursor-not-allowed pointer-events-none',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

/**
 * TabsContent — the tab panel associated with a trigger.
 */
export function TabsContent({ children, value, className = '', ...props }) {
  const { value: activeValue } = useContext(TabsContext);
  const id = useId();
  const isActive = activeValue === value;

  return (
    <div
      role="tabpanel"
      id={`tabs-panel-${id}`}
      aria-labelledby={`tabs-trigger-${id}`}
      data-state={isActive ? 'active' : 'inactive'}
      hidden={!isActive}
      className={clsx('tabs-content', className)}
      {...props}
    >
      {isActive ? children : null}
    </div>
  );
}

Tabs.displayName = 'Tabs';
TabsList.displayName = 'TabsList';
TabsTrigger.displayName = 'TabsTrigger';
TabsContent.displayName = 'TabsContent';
