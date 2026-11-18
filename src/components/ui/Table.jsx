import { clsx } from 'clsx'
import {
  createContext,
  useContext,
  useRef,
  useState,
  useEffect,
  useCallback,
  useMemo,
  Children,
} from 'react'
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react'

const TableContext = createContext({
  isSmartScroll: false,
  totalColumns: 0,
  canScrollLeft: false,
  canScrollRight: false,
  scrollLeft: 0,
  toggleRevealColumns: () => {},
  scrollBy: () => {},
  stickyActions: true,
  actionsWidth: 140,
})

// eslint-disable-next-line react-refresh/only-export-components
export function useTableContext() {
  return useContext(TableContext)
}

export function Table({
  children,
  className = '',
  hover = true,
  alignMiddle = true,
  responsive = true,
  smartScroll = 'auto', // 'auto' | true | false
  columnsCount,
  stickyActions = true,
  maxVisibleColumns = 6,
  minColumnWidth = 140,
  actionsWidth = 140,
  checkboxWidth = 48,
  ...props
}) {
  const containerRef = useRef(null)
  const tableRef = useRef(null)
  const wrapperRef = useRef(null)

  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)
  const [scrollLeft, setScrollLeft] = useState(0)
  const [containerWidth, setContainerWidth] = useState(0)
  const [detectedColumns, setDetectedColumns] = useState(0)
  const [detectedHasCheckbox, setDetectedHasCheckbox] = useState(false)

  // Drag-to-scroll interaction refs
  const isDownRef = useRef(false)
  const startXRef = useRef(0)
  const startScrollLeftRef = useRef(0)
  const isDraggingRef = useRef(false)

  // Synchronously estimate column count from children during initial render
  const { childrenColumnCount, childrenHasCheckbox } = useMemo(() => {
    let count = 0
    let checkFound = false

    Children.forEach(children, (child) => {
      if (!child) return
      if (child.type?.name === 'TableHead' || child.type === 'thead') {
        Children.forEach(child.props?.children, (row) => {
          if (!row) return
          if (row.type?.name === 'TableRow' || row.type === 'tr') {
            const cells = Children.toArray(row.props?.children).filter(Boolean)
            if (cells.length > count) {
              count = cells.length
            }
            if (
              cells.some(
                (c) =>
                  c.type?.name === 'TableSelectAll' ||
                  c.props?.className?.includes('w-10')
              )
            ) {
              checkFound = true
            }
          }
        })
      }
    })
    return { childrenColumnCount: count, childrenHasCheckbox: checkFound }
  }, [children])

  const hasCheckbox = detectedHasCheckbox || childrenHasCheckbox
  const totalCols = columnsCount || detectedColumns || childrenColumnCount || 0
  const isSmartScroll =
    responsive &&
    (smartScroll === true || (smartScroll === 'auto' && totalCols > 6))

  // Update scroll boundaries
  const updateScrollState = useCallback(() => {
    const el = containerRef.current
    if (!el) return
    const current = el.scrollLeft
    const max = el.scrollWidth - el.clientWidth
    setCanScrollLeft(current > 4)
    setCanScrollRight(max - current > 4)
    setScrollLeft(current)
  }, [])

  // Inspect DOM for column count & container width
  useEffect(() => {
    if (!responsive) return

    const inspectDOM = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.clientWidth)
      }
      if (tableRef.current) {
        const firstRowCells = tableRef.current.querySelectorAll(
          'thead tr:first-child > th, thead tr:first-child > td'
        )
        if (firstRowCells && firstRowCells.length > 0) {
          setDetectedColumns(firstRowCells.length)
          const firstTh = firstRowCells[0]
          if (
            firstTh &&
            (firstTh.classList.contains('w-10') ||
              firstTh.querySelector('input[type="checkbox"]'))
          ) {
            setDetectedHasCheckbox(true)
          }
        }
      }
      updateScrollState()
    }

    inspectDOM()

    let resizeObserver
    if (typeof window !== 'undefined' && window.ResizeObserver && containerRef.current) {
      resizeObserver = new ResizeObserver(() => {
        inspectDOM()
      })
      resizeObserver.observe(containerRef.current)
    }

    return () => {
      if (resizeObserver) resizeObserver.disconnect()
    }
  }, [responsive, children, updateScrollState])

  // Drag-to-scroll mousedown handler
  const handleMouseDown = useCallback(
    (e) => {
      if (!isSmartScroll) return
      // Ignore interactive elements
      if (
        e.target.closest(
          'button, a, input, select, textarea, label, [role="button"], .table__sort'
        )
      ) {
        return
      }
      if (e.button !== 0) return // only primary left button

      const container = containerRef.current
      if (!container) return

      isDownRef.current = true
      isDraggingRef.current = false
      startXRef.current = e.pageX - container.offsetLeft
      startScrollLeftRef.current = container.scrollLeft
    },
    [isSmartScroll]
  )

  const handleMouseMove = useCallback(
    (e) => {
      if (!isDownRef.current) return
      const container = containerRef.current
      if (!container) return

      const x = e.pageX - container.offsetLeft
      const walk = (x - startXRef.current) * 1.5
      if (Math.abs(walk) > 4) {
        if (!isDraggingRef.current) {
          isDraggingRef.current = true
          container.classList.add('smart-table-scroll--dragging')
        }
        container.scrollLeft = startScrollLeftRef.current - walk
        updateScrollState()
      }
    },
    [updateScrollState]
  )

  const handleMouseUp = useCallback(() => {
    if (!isDownRef.current) return
    isDownRef.current = false
    const container = containerRef.current
    if (container) {
      container.classList.remove('smart-table-scroll--dragging')
    }
    if (isDraggingRef.current) {
      const captureClick = (clickEvent) => {
        clickEvent.stopPropagation()
        clickEvent.preventDefault()
        window.removeEventListener('click', captureClick, true)
      }
      window.addEventListener('click', captureClick, true)
      setTimeout(() => {
        window.removeEventListener('click', captureClick, true)
      }, 60)
    }
  }, [])

  useEffect(() => {
    if (!isSmartScroll) return
    const onGlobalMouseUp = () => handleMouseUp()
    const onGlobalMouseMove = (e) => handleMouseMove(e)

    window.addEventListener('mouseup', onGlobalMouseUp)
    window.addEventListener('mousemove', onGlobalMouseMove)
    return () => {
      window.removeEventListener('mouseup', onGlobalMouseUp)
      window.removeEventListener('mousemove', onGlobalMouseMove)
    }
  }, [isSmartScroll, handleMouseUp, handleMouseMove])

  // Wheel handling: Shift+wheel or trackpad horizontal
  const handleWheel = useCallback(
    (e) => {
      const container = containerRef.current
      if (!container) return

      if (Math.abs(e.deltaX) > 0) {
        // Native trackpad horizontal scroll
        return
      }

      if (e.shiftKey && e.deltaY !== 0) {
        container.scrollLeft += e.deltaY
        e.preventDefault()
        updateScrollState()
      }
    },
    [updateScrollState]
  )

  // Reveal columns toggle (compact header control)
  const toggleRevealColumns = useCallback(() => {
    const container = containerRef.current
    if (!container) return

    const max = container.scrollWidth - container.clientWidth
    if (container.scrollLeft < max - 10) {
      container.scrollTo({ left: max, behavior: 'smooth' })
    } else {
      container.scrollTo({ left: 0, behavior: 'smooth' })
    }
  }, [])

  // Step scroll (floating chevrons)
  const scrollBy = useCallback((offset) => {
    const container = containerRef.current
    if (!container) return
    container.scrollBy({ left: offset, behavior: 'smooth' })
  }, [])

  // Calculate table min-width to ensure the first 6 data columns fill the viewport
  // and additional columns extend into horizontal scroll smoothly
  const computedMinWidth = useMemo(() => {
    if (!isSmartScroll || totalCols <= 6) return undefined

    const fixedWidth =
      (hasCheckbox ? checkboxWidth : 0) + (stickyActions ? actionsWidth : 0)
    const dataCols = Math.max(
      1,
      totalCols - (hasCheckbox ? 1 : 0) - (stickyActions ? 1 : 0)
    )

    if (containerWidth > 0) {
      const availableFor6 = Math.max(0, containerWidth - fixedWidth)
      const colWidth = Math.max(
        minColumnWidth,
        Math.floor(availableFor6 / maxVisibleColumns)
      )
      return fixedWidth + dataCols * colWidth
    }

    return fixedWidth + dataCols * Math.max(minColumnWidth, 160)
  }, [
    isSmartScroll,
    totalCols,
    hasCheckbox,
    checkboxWidth,
    stickyActions,
    actionsWidth,
    containerWidth,
    minColumnWidth,
    maxVisibleColumns,
  ])

  const tableClass = clsx(
    'table',
    {
      'table--hover': hover,
      'table--align-middle': alignMiddle,
      'smart-table--active': isSmartScroll,
      'smart-table--scrolled-end':
        isSmartScroll && !canScrollRight && canScrollLeft,
    },
    className
  )

  const contextValue = useMemo(
    () => ({
      isSmartScroll,
      totalColumns: totalCols,
      canScrollLeft,
      canScrollRight,
      scrollLeft,
      toggleRevealColumns,
      scrollBy,
      stickyActions,
      actionsWidth,
    }),
    [
      isSmartScroll,
      totalCols,
      canScrollLeft,
      canScrollRight,
      scrollLeft,
      toggleRevealColumns,
      scrollBy,
      stickyActions,
      actionsWidth,
    ]
  )

  if (!responsive) {
    return (
      <TableContext.Provider value={contextValue}>
        <table ref={tableRef} className={tableClass} {...props}>
          {children}
        </table>
      </TableContext.Provider>
    )
  }

  // If not large enough for smart scroll (<= 6 columns), standard responsive table
  if (!isSmartScroll) {
    return (
      <TableContext.Provider value={contextValue}>
        <div className="table-responsive" {...props}>
          <table ref={tableRef} className={tableClass}>
            {children}
          </table>
        </div>
      </TableContext.Provider>
    )
  }

  // Smart Scroll Table (> 6 columns)
  return (
    <TableContext.Provider value={contextValue}>
      <div className="smart-table-wrapper" ref={wrapperRef} {...props}>
        {/* Floating Left Scroll Chevron Indicator */}
        <button
          type="button"
          className={clsx('smart-table__scroll-nav smart-table__scroll-nav--left', {
            'smart-table__scroll-nav--visible': canScrollLeft,
          })}
          onClick={() => scrollBy(-280)}
          aria-label="Scroll left to view previous columns"
          title="Scroll left"
          tabIndex={canScrollLeft ? 0 : -1}
        >
          <ChevronLeft className="w-4 h-4" aria-hidden="true" />
        </button>

        {/* Scroll Container with Grab-to-Pan */}
        <div
          ref={containerRef}
          className="table-responsive smart-table-scroll"
          onMouseDown={handleMouseDown}
          onWheel={handleWheel}
          onScroll={updateScrollState}
          role="region"
          aria-label="Scrollable data table"
          tabIndex={0}
        >
          <table
            ref={tableRef}
            className={tableClass}
            style={{
              minWidth: computedMinWidth ? `${computedMinWidth}px` : undefined,
              width: '100%',
            }}
          >
            {children}
          </table>
        </div>

        {/* Floating Right Scroll Chevron Indicator */}
        <button
          type="button"
          className={clsx('smart-table__scroll-nav smart-table__scroll-nav--right', {
            'smart-table__scroll-nav--visible': canScrollRight,
          })}
          onClick={() => scrollBy(280)}
          aria-label="Scroll right to view more columns"
          title="Scroll right"
          tabIndex={canScrollRight ? 0 : -1}
          style={{
            right: stickyActions ? `calc(${actionsWidth}px + 0.5rem)` : '0.5rem',
          }}
        >
          <ChevronRight className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>
    </TableContext.Provider>
  )
}

export function TableHead({
  children,
  className = '',
  variant = 'default',
  ...props
}) {
  const variants = {
    default: 'table__head',
    alt: 'table__head table__head--alt',
  }

  return (
    <thead className={clsx(variants[variant], className)} {...props}>
      {children}
    </thead>
  )
}

export function TableBody({ children, className = '', ...props }) {
  return (
    <tbody className={clsx('table__body', className)} {...props}>
      {children}
    </tbody>
  )
}

export function TableRow({
  children,
  className = '',
  selected = false,
  clickable = false,
  ...props
}) {
  return (
    <tr
      className={clsx(
        'table__row',
        {
          'table__row--selected': selected,
          'table__row--clickable': clickable,
        },
        className
      )}
      {...props}
    >
      {children}
    </tr>
  )
}

export function TableCell({
  children,
  className = '',
  scope,
  align = 'start',
  sticky,
  isAction = false,
  ...props
}) {
  const { isSmartScroll, stickyActions } = useContext(TableContext)

  const alignClasses = {
    start: '',
    center: 'text-center',
    end: 'text-end',
  }

  const isStickyRight =
    sticky === 'right' ||
    isAction ||
    props['data-action-col'] === true ||
    (isSmartScroll && stickyActions && props['data-sticky-action'] === true)

  const isStickyLeft = sticky === 'left'

  return (
    <td
      scope={scope}
      className={clsx(
        'table__cell',
        alignClasses[align],
        {
          'smart-table-sticky-actions': isStickyRight,
          'smart-table-sticky-left': isStickyLeft,
        },
        className
      )}
      {...props}
    >
      {children}
    </td>
  )
}

export function TableHeaderCell({
  children,
  className = '',
  scope = 'col',
  align = 'start',
  sortable = false,
  sortDirection,
  onSort,
  sticky,
  isAction = false,
  showExpandControl = 'auto',
  ...props
}) {
  const {
    isSmartScroll,
    canScrollRight,
    toggleRevealColumns,
    stickyActions,
  } = useContext(TableContext)

  const alignClasses = {
    start: '',
    center: 'text-center',
    end: 'text-end',
  }

  const isStickyRight =
    sticky === 'right' ||
    isAction ||
    props['data-action-col'] === true ||
    (isSmartScroll && stickyActions && props['data-sticky-action'] === true)

  const isStickyLeft = sticky === 'left'

  const ariaSort = sortable
    ? sortDirection === 'asc'
      ? 'ascending'
      : sortDirection === 'desc'
        ? 'descending'
        : 'none'
    : undefined

  const cellClasses = clsx(
    alignClasses[align],
    'whitespace-nowrap',
    {
      'smart-table-sticky-actions smart-table-sticky-actions-head': isStickyRight,
      'smart-table-sticky-left': isStickyLeft,
    },
    className
  )

  const shouldRenderExpandControl =
    isSmartScroll &&
    isStickyRight &&
    (showExpandControl === true || showExpandControl === 'auto')

  const headerContent = (
    <div
      className={clsx(
        'flex items-center gap-1.5',
        align === 'center' && 'justify-center',
        (align === 'end' || isStickyRight) && 'justify-end ms-auto'
      )}
    >
      {sortable ? (
        <button
          type="button"
          className={clsx(
            'table__sort',
            align === 'center' && 'justify-center',
            align === 'end' && 'justify-end ms-auto'
          )}
          data-state={sortDirection || undefined}
          onClick={onSort}
        >
          {children}
        </button>
      ) : (
        children
      )}

      {shouldRenderExpandControl && (
        <button
          type="button"
          className="smart-table__header-reveal-btn"
          onClick={(e) => {
            e.stopPropagation()
            toggleRevealColumns?.()
          }}
          title={
            canScrollRight
              ? 'Reveal more columns'
              : 'Return to initial columns'
          }
          aria-label={
            canScrollRight
              ? 'Reveal more columns'
              : 'Return to initial columns'
          }
        >
          <span className="smart-table__header-reveal-text">
            {canScrollRight ? 'More cols' : 'First cols'}
          </span>
          <ChevronRight
            className={clsx(
              'w-3.5 h-3.5 transition-transform duration-200',
              !canScrollRight && 'rotate-180'
            )}
            aria-hidden="true"
          />
        </button>
      )}
    </div>
  )

  return (
    <th
      scope={scope}
      className={cellClasses}
      aria-sort={ariaSort}
      {...props}
    >
      {headerContent}
    </th>
  )
}

export function TableSelectAll({
  checked = false,
  indeterminate = false,
  onChange,
  className = '',
  ...props
}) {
  return (
    <th
      scope="col"
      className={clsx('w-10 smart-table-col-checkbox', className)}
      {...props}
    >
      <input
        type="checkbox"
        className="checkbox"
        checked={checked}
        ref={(el) => {
          if (el) el.indeterminate = indeterminate
        }}
        onChange={onChange}
        aria-label="Select all rows"
      />
    </th>
  )
}

export function TableSelectRow({
  checked = false,
  onChange,
  className = '',
  ...props
}) {
  return (
    <td
      className={clsx('w-10 smart-table-col-checkbox', className)}
      {...props}
    >
      <input
        type="checkbox"
        className="checkbox"
        checked={checked}
        onChange={onChange}
        aria-label="Select row"
      />
    </td>
  )
}

export function TablePagination({
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  className = '',
  showFirstLast = true,
  showPrevNext = true,
  maxVisiblePages = 5,
  ...props
}) {
  const pages = []

  if (totalPages <= maxVisiblePages) {
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i)
    }
  } else {
    pages.push(1)
    if (currentPage > 3) pages.push('...')

    const start = Math.max(2, currentPage - 1)
    const end = Math.min(totalPages - 1, currentPage + 1)

    for (let i = start; i <= end; i++) {
      pages.push(i)
    }

    if (currentPage < totalPages - 2) pages.push('...')
    pages.push(totalPages)
  }

  return (
    <nav
      className={clsx('ms-auto', className)}
      aria-label="Pagination"
      {...props}
    >
      <ul className="pagination">
        {showFirstLast && (
          <li>
            <button
              type="button"
              className={clsx('pagination__button', {
                'pagination__button--disabled': currentPage === 1,
              })}
              onClick={() => onPageChange?.(1)}
              disabled={currentPage === 1}
              aria-label="First page"
              aria-disabled={currentPage === 1}
            >
              <ChevronsLeft className="w-4 h-4" aria-hidden="true" />
            </button>
          </li>
        )}

        {showPrevNext && (
          <li>
            <button
              type="button"
              className={clsx('pagination__button', {
                'pagination__button--disabled': currentPage === 1,
              })}
              onClick={() => onPageChange?.(currentPage - 1)}
              disabled={currentPage === 1}
              aria-label="Previous page"
              aria-disabled={currentPage === 1}
            >
              <ChevronLeft className="w-4 h-4" aria-hidden="true" />
            </button>
          </li>
        )}

        {pages.map((page, index) => (
          <li key={index}>
            {page === '...' ? (
              <span className="pagination__ellipsis" aria-hidden="true">
                ...
              </span>
            ) : (
              <button
                type="button"
                className={clsx('pagination__button', {
                  'pagination__button--active': currentPage === page,
                })}
                data-state={currentPage === page ? 'active' : undefined}
                aria-current={currentPage === page ? 'page' : undefined}
                onClick={() => onPageChange?.(page)}
                aria-label={'Page ' + page}
              >
                {page}
              </button>
            )}
          </li>
        ))}

        {showPrevNext && (
          <li>
            <button
              type="button"
              className={clsx('pagination__button', {
                'pagination__button--disabled': currentPage === totalPages,
              })}
              onClick={() => onPageChange?.(currentPage + 1)}
              disabled={currentPage === totalPages}
              aria-label="Next page"
              aria-disabled={currentPage === totalPages}
            >
              <ChevronRight className="w-4 h-4" aria-hidden="true" />
            </button>
          </li>
        )}

        {showFirstLast && (
          <li>
            <button
              type="button"
              className={clsx('pagination__button', {
                'pagination__button--disabled': currentPage === totalPages,
              })}
              onClick={() => onPageChange?.(totalPages)}
              disabled={currentPage === totalPages}
              aria-label="Last page"
              aria-disabled={currentPage === totalPages}
            >
              <ChevronsRight className="w-4 h-4" aria-hidden="true" />
            </button>
          </li>
        )}
      </ul>
    </nav>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTableSelection(rows) {
  const [selectedRows, setSelectedRows] = useState(new Set())
  const [selectAll, setSelectAll] = useState(false)

  const toggleRow = useCallback((id) => {
    setSelectedRows((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }, [])

  const toggleAll = useCallback(() => {
    if (selectAll) {
      setSelectedRows(new Set())
      setSelectAll(false)
    } else {
      setSelectedRows(new Set(rows.map((row) => row.id)))
      setSelectAll(true)
    }
  }, [rows, selectAll])

  const isSelected = useCallback((id) => selectedRows.has(id), [selectedRows])
  const selectedCount = selectedRows.size
  const isIndeterminate = selectedCount > 0 && selectedCount < rows.length

  return {
    selectedRows,
    selectAll,
    isIndeterminate,
    toggleRow,
    toggleAll,
    isSelected,
    selectedCount,
    clearSelection: () => {
      setSelectedRows(new Set())
      setSelectAll(false)
    },
  }
}
