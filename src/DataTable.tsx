import {
  type CSSProperties,
  type DragEvent,
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Tooltip } from '@jzarache/tooltip-react';
import './DataTable.css';

type InternalIconProps = {
  size?: number;
  strokeWidth?: number;
};

function FilterIcon({ size = 24, strokeWidth = 2 }: InternalIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3Z" />
    </svg>
  );
}

function GripVerticalIcon({ size = 24, strokeWidth = 2 }: InternalIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="9" cy="5" r="1" />
      <circle cx="9" cy="12" r="1" />
      <circle cx="9" cy="19" r="1" />
      <circle cx="15" cy="5" r="1" />
      <circle cx="15" cy="12" r="1" />
      <circle cx="15" cy="19" r="1" />
    </svg>
  );
}

function XIcon({ size = 24, strokeWidth = 2 }: InternalIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m18 6-12 12" />
      <path d="m6 6 12 12" />
    </svg>
  );
}

export type SortDirection = 'asc' | 'desc' | 'none';

export type DataTableColumnLayout = {
  id: string;
  width?: number;
  minWidth?: number;
  maxWidth?: number;
  resizable?: boolean;
  align?: 'left' | 'center' | 'right';
  className?: string;
};

export type DataTableValueColumn<T> = DataTableColumnLayout & {
  type?: 'data';
  header: ReactNode;
  accessor?: keyof T | ((row: T) => unknown);
  cell?: (value: unknown, row: T, rowIndex: number) => ReactNode;
  sortable?: boolean;
  filterable?: boolean;
  filterPlaceholder?: string;
  filterFn?: (value: unknown, filter: string, row: T) => boolean;
  sortFn?: (a: T, b: T) => number;
  /** Contenido del tooltip; false lo desactiva. Por defecto usa el valor de la celda. */
  tooltip?: false | ReactNode | ((value: unknown, row: T) => ReactNode);
};

export type DataTableActionsDisplayColumn = DataTableColumnLayout & {
  type: 'actions';
  header?: ReactNode;
};

export type DataTableRowNumberColumn = DataTableColumnLayout & {
  type: 'rowNumber';
  header?: ReactNode;
};

export type DataTableColumn<T> = DataTableValueColumn<T> | DataTableActionsDisplayColumn | DataTableRowNumberColumn;

function isValueColumn<T>(column: DataTableColumn<T>): column is DataTableValueColumn<T> {
  return column.type !== 'actions' && column.type !== 'rowNumber';
}

export type DataTableActionsColumn = {
  width?: number;
  minWidth?: number;
  maxWidth?: number;
  resizable?: boolean;
};

export type DataTableAction<T> = {
  id: string;
  label: string;
  icon?: ReactNode;
  onClick: (row: T) => void;
  hidden?: (row: T) => boolean;
  disabled?: (row: T) => boolean;
  variant?: 'default' | 'danger';
};

export type DataTableFeatures = {
  sorting?: boolean;
  filtering?: boolean;
  pagination?: boolean;
  resizing?: boolean;
  columnReordering?: boolean;
};

export type DataTableTheme = {
  primary?: string;
  surface?: string;
  text?: string;
  border?: string;
};

export type DataTableProps<T> = {
  data: readonly T[];
  columns: readonly DataTableColumn<T>[];
  /** Orden controlado de las columnas declaradas, expresado mediante sus IDs. */
  columnOrder?: readonly string[];
  /** Orden inicial para uso no controlado. Si se omite, se respeta `columns`. */
  defaultColumnOrder?: readonly string[];
  /** Informa el nuevo orden completo después de mover una columna. */
  onColumnOrderChange?: (columnIds: string[]) => void;
  getRowId: (row: T) => string | number;
  actions?: readonly DataTableAction<T>[];
  features?: DataTableFeatures;
  pageSize?: number;
  pageSizeOptions?: readonly number[];
  emptyMessage?: ReactNode;
  className?: string;
  ariaLabel?: string;
  onRowClick?: (row: T) => void;
  /** Alto mínimo de cada fila, en píxeles. */
  rowHeight?: number;
  /** Alto del área visible. Usa un número (px), una medida CSS o "auto". */
  tableHeight?: number | string;
  /** Mantiene la cabecera visible durante el scroll vertical. */
  stickyHeader?: boolean;
  /** "menu" muestra un botón compacto; "row" mantiene los campos visibles. */
  filterMode?: 'menu' | 'row';
  /** Cuatro colores semánticos; los tonos secundarios se generan automáticamente. */
  theme?: DataTableTheme;
  /** Agrega una columna de selección múltiple. */
  selectable?: boolean;
  /** IDs seleccionados para uso controlado. */
  selectedRowIds?: readonly (string | number)[];
  /** Selección inicial para uso no controlado. */
  defaultSelectedRowIds?: readonly (string | number)[];
  onSelectionChange?: (ids: Array<string | number>, rows: T[]) => void;
  /** Muestra una columna con el número absoluto de cada registro. */
  showRowNumbers?: boolean;
  /** Resalta con borde y fondo la última celda pulsada. */
  highlightActiveCell?: boolean;
  /** Configura el ancho y redimensionado de la columna de acciones. */
  actionsColumn?: DataTableActionsColumn;
  /** Muestra tooltips únicamente cuando el contenido está truncado. */
  cellTooltips?: boolean;
  /** Lenguaje de bordes global para tabla, controles y tooltips. */
  shape?: 'soft' | 'square';
  /** Sobrescribe estilos del tooltip después de aplicar la paleta. */
  tooltipStyle?: CSSProperties;
};

const defaultFeatures: Required<DataTableFeatures> = {
  sorting: true,
  filtering: true,
  pagination: true,
  resizing: true,
  columnReordering: false,
};

function valueOf<T>(column: DataTableValueColumn<T>, row: T): unknown {
  if (typeof column.accessor === 'function') return column.accessor(row);
  if (column.accessor) return row[column.accessor];
  return undefined;
}

function compareValues(a: unknown, b: unknown): number {
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  if (a instanceof Date && b instanceof Date) return a.getTime() - b.getTime();
  return String(a).localeCompare(String(b), undefined, {
    numeric: true,
    sensitivity: 'base',
  });
}

function getTooltipStyle(
  theme: DataTableTheme | undefined,
  shape: 'soft' | 'square',
  customStyle?: CSSProperties
): CSSProperties {
  const primary = theme?.primary ?? '#2563eb';
  const surface = theme?.surface ?? '#ffffff';
  const border = theme?.border ?? primary;
  return {
    backgroundColor: primary,
    color: surface,
    border: `1px solid ${border}`,
    borderRadius: shape === 'square' ? '0' : '8px',
    padding: '8px 11px',
    boxShadow: `0 8px 24px ${theme?.text ?? '#172033'}33`,
    fontSize: '12px',
    fontWeight: 600,
    lineHeight: 1.4,
    maxWidth: '320px',
    whiteSpace: 'normal',
    overflowWrap: 'anywhere',
    ...customStyle,
  };
}

function TruncatedCell({
  children,
  label,
  align,
  shape,
  theme,
  tooltipStyle,
}: {
  children: ReactNode;
  label: ReactNode;
  align: 'left' | 'center' | 'right';
  shape: 'soft' | 'square';
  theme?: DataTableTheme;
  tooltipStyle?: CSSProperties;
}) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [truncated, setTruncated] = useState(false);

  useEffect(() => {
    const content = contentRef.current;
    if (!content) return;
    const measure = () =>
      setTruncated(content.scrollWidth > content.clientWidth || content.scrollHeight > content.clientHeight);
    const observer = new ResizeObserver(measure);
    observer.observe(content);
    return () => observer.disconnect();
  }, [children]);

  return (
    <Tooltip
      label={label}
      position="top"
      disabled={!truncated || label == null}
      containerClassName="dt-tooltip-container"
      style={getTooltipStyle(theme, shape, tooltipStyle)}
    >
      <div ref={contentRef} className={`dt-cell-content dt-cell-content--${align}`}>
        {children}
      </div>
    </Tooltip>
  );
}

const nextSort: Record<SortDirection, SortDirection> = {
  none: 'asc',
  asc: 'desc',
  desc: 'none',
};

export function DataTable<T>({
  data,
  columns,
  columnOrder,
  defaultColumnOrder,
  onColumnOrderChange,
  getRowId,
  actions = [],
  features: featureOverrides,
  pageSize: initialPageSize = 10,
  pageSizeOptions = [5, 10, 20, 50],
  emptyMessage = 'No hay datos para mostrar',
  className = '',
  ariaLabel = 'Tabla de datos',
  onRowClick,
  rowHeight = 48,
  tableHeight = 'auto',
  stickyHeader = false,
  filterMode = 'menu',
  theme,
  selectable = false,
  selectedRowIds,
  defaultSelectedRowIds = [],
  onSelectionChange,
  showRowNumbers = false,
  highlightActiveCell = false,
  actionsColumn,
  cellTooltips = true,
  shape = 'soft',
  tooltipStyle,
}: DataTableProps<T>) {
  const features = { ...defaultFeatures, ...featureOverrides };
  const [sort, setSort] = useState<{
    columnId: string | null;
    direction: SortDirection;
  }>({
    columnId: null,
    direction: 'none',
  });
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [openFilterId, setOpenFilterId] = useState<string | null>(null);
  const filterMenuRef = useRef<HTMLDivElement>(null);
  const headerTableRef = useRef<HTMLTableElement>(null);
  const bodyScrollRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [internalSelectedIds, setInternalSelectedIds] = useState<Array<string | number>>([...defaultSelectedRowIds]);
  const [activeCell, setActiveCell] = useState<{
    row: number;
    column: number;
  } | null>(null);
  const declaredActionsColumn = columns.find((column) => column.type === 'actions');
  const [actionsWidth, setActionsWidth] = useState(declaredActionsColumn?.width ?? actionsColumn?.width ?? 120);
  const [widths, setWidths] = useState<Record<string, number>>(() =>
    Object.fromEntries(columns.map((column) => [column.id, column.width ?? 180]))
  );
  const [internalColumnOrder, setInternalColumnOrder] = useState<string[]>(() => [
    ...(defaultColumnOrder ?? columns.map((column) => column.id)),
  ]);
  const [draggedColumnId, setDraggedColumnId] = useState<string | null>(null);

  const layoutColumns = useMemo(() => {
    const requestedOrder = columnOrder ?? internalColumnOrder;
    const byId = new Map(columns.map((column) => [column.id, column]));
    const next = requestedOrder
      .map((id) => byId.get(id))
      .filter((column): column is DataTableColumn<T> => column !== undefined);
    columns.forEach((column) => {
      if (!requestedOrder.includes(column.id)) next.push(column);
    });
    if (showRowNumbers && !next.some((column) => column.type === 'rowNumber'))
      next.unshift({ id: '__rowNumber', type: 'rowNumber', header: '#' });
    if (actions.length > 0 && !next.some((column) => column.type === 'actions'))
      next.push({
        id: '__actions',
        type: 'actions',
        header: 'Acciones',
        ...actionsColumn,
      });
    return next.filter((column) => column.type !== 'actions' || actions.length > 0);
  }, [actions.length, actionsColumn, columnOrder, columns, internalColumnOrder, showRowNumbers]);

  const columnWidth = (column: DataTableColumn<T>) => {
    if (column.type === 'rowNumber') return column.width ?? 56;
    if (column.type === 'actions') return actionsWidth;
    return widths[column.id] ?? column.width ?? 180;
  };

  useEffect(() => {
    if (!openFilterId) return;
    const closeOutside = (event: PointerEvent) => {
      if (!filterMenuRef.current?.contains(event.target as Node)) setOpenFilterId(null);
    };
    const closeWithEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') setOpenFilterId(null);
    };
    document.addEventListener('pointerdown', closeOutside);
    document.addEventListener('keydown', closeWithEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOutside);
      document.removeEventListener('keydown', closeWithEscape);
    };
  }, [openFilterId]);

  useEffect(() => {
    const body = bodyScrollRef.current;
    if (!body) return;
    const updateWidth = () => setContainerWidth(body.clientWidth);
    const observer = new ResizeObserver(updateWidth);
    observer.observe(body);
    return () => observer.disconnect();
  }, []);

  const processedRows = useMemo(() => {
    let rows = [...data];
    if (features.filtering) {
      rows = rows.filter((row) =>
        columns.every((column) => {
          if (!isValueColumn(column)) return true;
          const filter = filters[column.id]?.trim();
          if (!filter || column.filterable === false) return true;
          const value = valueOf(column, row);
          return column.filterFn
            ? column.filterFn(value, filter, row)
            : String(value ?? '')
                .toLocaleLowerCase()
                .includes(filter.toLocaleLowerCase());
        })
      );
    }
    if (features.sorting && sort.columnId && sort.direction !== 'none') {
      const column = columns.find(
        (item): item is DataTableValueColumn<T> => item.id === sort.columnId && isValueColumn(item)
      );
      if (column) {
        rows.sort((a, b) => {
          const result = column.sortFn ? column.sortFn(a, b) : compareValues(valueOf(column, a), valueOf(column, b));
          return sort.direction === 'asc' ? result : -result;
        });
      }
    }
    return rows;
  }, [columns, data, features.filtering, features.sorting, filters, sort]);

  const pageCount = features.pagination ? Math.max(1, Math.ceil(processedRows.length / pageSize)) : 1;
  const safePage = Math.min(page, pageCount);
  const visibleRows = features.pagination
    ? processedRows.slice((safePage - 1) * pageSize, safePage * pageSize)
    : processedRows;

  const toggleSort = (column: DataTableValueColumn<T>) => {
    if (!features.sorting || column.sortable === false) return;
    setSort((current) => {
      const direction = current.columnId === column.id ? nextSort[current.direction] : 'asc';
      return { columnId: direction === 'none' ? null : column.id, direction };
    });
    setPage(1);
  };

  const declaredColumnIds = columns.map((column) => column.id);
  const normalizedColumnOrder = [
    ...(columnOrder ?? internalColumnOrder).filter((id) => declaredColumnIds.includes(id)),
    ...declaredColumnIds.filter((id) => !(columnOrder ?? internalColumnOrder).includes(id)),
  ];

  const moveColumn = (sourceId: string, targetId: string) => {
    if (sourceId === targetId) return;
    const sourceIndex = normalizedColumnOrder.indexOf(sourceId);
    const targetIndex = normalizedColumnOrder.indexOf(targetId);
    if (sourceIndex < 0 || targetIndex < 0) return;
    const next = [...normalizedColumnOrder];
    const [moved] = next.splice(sourceIndex, 1);
    next.splice(targetIndex, 0, moved);
    if (columnOrder === undefined) setInternalColumnOrder(next);
    onColumnOrderChange?.(next);
  };

  const moveColumnWithKeyboard = (event: KeyboardEvent, columnId: string) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    const currentIndex = normalizedColumnOrder.indexOf(columnId);
    const targetIndex = currentIndex + (event.key === 'ArrowLeft' ? -1 : 1);
    if (targetIndex < 0 || targetIndex >= normalizedColumnOrder.length) return;
    moveColumn(columnId, normalizedColumnOrder[targetIndex]);
  };

  const reorderHandle = (column: DataTableColumn<T>) => {
    if (!features.columnReordering || !declaredColumnIds.includes(column.id)) return null;
    return (
      <button
        type="button"
        className="dt-reorder-handle"
        draggable
        aria-label={`Mover columna ${String(column.header ?? column.id)}. Usa las flechas izquierda y derecha para cambiar su posición.`}
        onClick={(event) => event.stopPropagation()}
        onKeyDown={(event) => moveColumnWithKeyboard(event, column.id)}
        onDragStart={(event: DragEvent<HTMLButtonElement>) => {
          event.dataTransfer.effectAllowed = 'move';
          event.dataTransfer.setData('text/plain', column.id);
          setDraggedColumnId(column.id);
        }}
        onDragEnd={() => setDraggedColumnId(null)}
      >
        <GripVerticalIcon size={14} />
      </button>
    );
  };

  const resize = (column: DataTableColumn<T>, movement: number) => {
    setWidths((current) => ({
      ...current,
      [column.id]: Math.min(
        column.maxWidth ?? 600,
        Math.max(column.minWidth ?? 80, (current[column.id] ?? column.width ?? 180) + movement)
      ),
    }));
  };

  const startResize = (event: ReactPointerEvent, column: DataTableColumn<T>) => {
    event.preventDefault();
    const startX = event.clientX;
    const startWidth = widths[column.id] ?? column.width ?? 180;
    const onMove = (moveEvent: PointerEvent) => {
      const next = Math.min(
        column.maxWidth ?? 600,
        Math.max(column.minWidth ?? 80, startWidth + moveEvent.clientX - startX)
      );
      setWidths((current) => ({ ...current, [column.id]: next }));
    };
    const onUp = () => {
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerup', onUp);
      document.body.classList.remove('dt-resizing');
    };
    document.body.classList.add('dt-resizing');
    document.addEventListener('pointermove', onMove);
    document.addEventListener('pointerup', onUp);
  };

  const resizeWithKeyboard = (event: KeyboardEvent, column: DataTableColumn<T>) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    resize(column, event.key === 'ArrowLeft' ? -10 : 10);
  };

  const resizeActions = (movement: number) =>
    setActionsWidth((current) =>
      Math.min(
        declaredActionsColumn?.maxWidth ?? actionsColumn?.maxWidth ?? 360,
        Math.max(declaredActionsColumn?.minWidth ?? actionsColumn?.minWidth ?? 90, current + movement)
      )
    );
  const startActionsResize = (event: ReactPointerEvent) => {
    event.preventDefault();
    const startX = event.clientX;
    const startWidth = actionsWidth;
    const onMove = (moveEvent: PointerEvent) =>
      setActionsWidth(
        Math.min(
          declaredActionsColumn?.maxWidth ?? actionsColumn?.maxWidth ?? 360,
          Math.max(
            declaredActionsColumn?.minWidth ?? actionsColumn?.minWidth ?? 90,
            startWidth + moveEvent.clientX - startX
          )
        )
      );
    const onUp = () => {
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerup', onUp);
      document.body.classList.remove('dt-resizing');
    };
    document.body.classList.add('dt-resizing');
    document.addEventListener('pointermove', onMove);
    document.addEventListener('pointerup', onUp);
  };
  const resizeActionsWithKeyboard = (event: KeyboardEvent) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    resizeActions(event.key === 'ArrowLeft' ? -10 : 10);
  };

  const allPageSizes = [...new Set([...pageSizeOptions, initialPageSize])].sort((a, b) => a - b);
  const start = processedRows.length === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const end = Math.min(safePage * pageSize, processedRows.length);
  const columnsWidth = layoutColumns.reduce((total, column) => total + columnWidth(column), 0) + (selectable ? 48 : 0);
  const sharedTableWidth = Math.max(columnsWidth, containerWidth);
  const effectiveSelectedIds = selectedRowIds ?? internalSelectedIds;
  const selectedSet = new Set(effectiveSelectedIds);
  const visibleIds = visibleRows.map(getRowId);
  const selectedVisibleCount = visibleIds.filter((id) => selectedSet.has(id)).length;

  const updateSelection = (nextIds: Array<string | number>) => {
    if (selectedRowIds === undefined) setInternalSelectedIds(nextIds);
    onSelectionChange?.(
      nextIds,
      data.filter((row) => nextIds.includes(getRowId(row)))
    );
  };

  const toggleRow = (row: T) => {
    const id = getRowId(row);
    updateSelection(
      selectedSet.has(id) ? effectiveSelectedIds.filter((item) => item !== id) : [...effectiveSelectedIds, id]
    );
  };

  const toggleVisibleRows = () => {
    const next = new Set(effectiveSelectedIds);
    if (selectedVisibleCount === visibleIds.length) visibleIds.forEach((id) => next.delete(id));
    else visibleIds.forEach((id) => next.add(id));
    updateSelection([...next]);
  };
  const rootStyle = {
    '--dt-row-height': `${Math.max(32, rowHeight)}px`,
    '--dt-table-height': typeof tableHeight === 'number' ? `${tableHeight}px` : tableHeight,
    ...(theme?.primary ? { '--dt-primary': theme.primary } : {}),
    ...(theme?.surface ? { '--dt-surface': theme.surface } : {}),
    ...(theme?.text ? { '--dt-text': theme.text } : {}),
    ...(theme?.border ? { '--dt-border': theme.border } : {}),
  } as CSSProperties;

  const filterControl = (column: DataTableValueColumn<T>) => (
    <input
      type="search"
      value={filters[column.id] ?? ''}
      placeholder={column.filterPlaceholder ?? `Filtrar ${String(column.header)}`}
      aria-label={`Filtrar ${String(column.header)}`}
      onChange={(event) => {
        setFilters((current) => ({
          ...current,
          [column.id]: event.target.value,
        }));
        setPage(1);
      }}
    />
  );

  return (
    <div
      className={`dt-root dt-shape--${shape} ${stickyHeader ? 'dt-sticky' : ''} ${className}`.trim()}
      style={rootStyle}
    >
      <div className="dt-header-scroll">
        <table ref={headerTableRef} aria-label={`${ariaLabel}, cabecera`} style={{ width: sharedTableWidth }}>
          <colgroup>
            {selectable && <col style={{ width: 48 }} />}
            {layoutColumns.map((column) => (
              <col key={column.id} style={{ width: columnWidth(column) }} />
            ))}
          </colgroup>
          <thead>
            <tr>
              {selectable && (
                <th className="dt-select-column">
                  <input
                    type="checkbox"
                    aria-label="Seleccionar filas visibles"
                    checked={visibleIds.length > 0 && selectedVisibleCount === visibleIds.length}
                    ref={(element) => {
                      if (element)
                        element.indeterminate = selectedVisibleCount > 0 && selectedVisibleCount < visibleIds.length;
                    }}
                    onChange={toggleVisibleRows}
                  />
                </th>
              )}
              {layoutColumns.map((column) => {
                if (column.type === 'rowNumber')
                  return (
                    <th
                      key={column.id}
                      className={`dt-row-number-heading ${draggedColumnId === column.id ? 'dt-column--dragging' : ''}`.trim()}
                      onDragOver={(event) => {
                        if (declaredColumnIds.includes(column.id)) event.preventDefault();
                      }}
                      onDrop={() => {
                        if (draggedColumnId) moveColumn(draggedColumnId, column.id);
                        setDraggedColumnId(null);
                      }}
                    >
                      <div className="dt-header-content">
                        {reorderHandle(column)}
                        <span className="dt-header-label">{column.header ?? '#'}</span>
                      </div>
                    </th>
                  );
                if (column.type === 'actions')
                  return (
                    <th
                      key={column.id}
                      className={`dt-actions-heading ${draggedColumnId === column.id ? 'dt-column--dragging' : ''}`.trim()}
                      onDragOver={(event) => {
                        if (declaredColumnIds.includes(column.id)) event.preventDefault();
                      }}
                      onDrop={() => {
                        if (draggedColumnId) moveColumn(draggedColumnId, column.id);
                        setDraggedColumnId(null);
                      }}
                    >
                      <div className="dt-header-content dt-header-content--center">
                        {reorderHandle(column)}
                        <span className="dt-header-label">{column.header ?? 'Acciones'}</span>
                      </div>
                      {features.resizing && column.resizable !== false && (
                        <span
                          className="dt-resizer"
                          role="separator"
                          aria-label={`Redimensionar ${String(column.header ?? 'Acciones')}`}
                          aria-orientation="vertical"
                          tabIndex={0}
                          onPointerDown={startActionsResize}
                          onKeyDown={resizeActionsWithKeyboard}
                        />
                      )}
                    </th>
                  );
                const sortable = features.sorting && column.sortable !== false;
                const direction = sort.columnId === column.id ? sort.direction : 'none';
                return (
                  <th
                    key={column.id}
                    className={`${column.className ?? ''} ${draggedColumnId === column.id ? 'dt-column--dragging' : ''}`.trim()}
                    style={{ textAlign: column.align }}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={() => {
                      if (draggedColumnId) moveColumn(draggedColumnId, column.id);
                      setDraggedColumnId(null);
                    }}
                    aria-sort={direction === 'none' ? 'none' : direction === 'asc' ? 'ascending' : 'descending'}
                  >
                    <div className="dt-header-content">
                      {reorderHandle(column)}
                      <span className="dt-header-label">{column.header}</span>
                      {features.filtering && filterMode === 'menu' && column.filterable !== false && (
                        <div
                          className={`dt-filter-menu ${openFilterId === column.id ? 'dt-filter-menu--open' : ''}`}
                          ref={openFilterId === column.id ? filterMenuRef : undefined}
                        >
                          <button
                            type="button"
                            className="dt-filter-trigger"
                            aria-label={`Filtrar ${String(column.header)}`}
                            title={`Filtrar ${String(column.header)}`}
                            aria-expanded={openFilterId === column.id}
                            onClick={() => setOpenFilterId((current) => (current === column.id ? null : column.id))}
                          >
                            <FilterIcon size={14} strokeWidth={2} />
                            {filters[column.id] && <i />}
                          </button>
                          {openFilterId === column.id && (
                            <div className="dt-filter-popover">
                              <div className="dt-filter-title">
                                <span>Filtrar por {column.header}</span>
                                <button type="button" aria-label="Cerrar filtro" onClick={() => setOpenFilterId(null)}>
                                  <XIcon size={16} />
                                </button>
                              </div>
                              {filterControl(column)}
                              <div className="dt-filter-footer">
                                <button
                                  type="button"
                                  className="dt-filter-clear"
                                  disabled={!filters[column.id]}
                                  onClick={() => {
                                    setFilters((current) => ({
                                      ...current,
                                      [column.id]: '',
                                    }));
                                    setPage(1);
                                  }}
                                >
                                  <XIcon size={13} /> Limpiar
                                </button>
                                <button type="button" className="dt-filter-done" onClick={() => setOpenFilterId(null)}>
                                  Listo
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                      {sortable && (
                        <button
                          type="button"
                          className="dt-sort-button"
                          aria-label={`Ordenar por ${String(column.header)}${direction === 'none' ? '' : `, orden ${direction}`}`}
                          onClick={() => toggleSort(column)}
                        >
                          <span className={`dt-sort dt-sort--${direction}`} aria-hidden="true" />
                        </button>
                      )}
                    </div>
                    {features.resizing && column.resizable !== false && (
                      <span
                        className="dt-resizer"
                        role="separator"
                        aria-label={`Redimensionar ${String(column.header)}`}
                        aria-orientation="vertical"
                        tabIndex={0}
                        onPointerDown={(event) => startResize(event, column)}
                        onKeyDown={(event) => resizeWithKeyboard(event, column)}
                      />
                    )}
                  </th>
                );
              })}
            </tr>
            {features.filtering &&
              filterMode === 'row' &&
              layoutColumns.some(
                (column) => column.type !== 'actions' && column.type !== 'rowNumber' && column.filterable !== false
              ) && (
                <tr className="dt-filters">
                  {selectable && <th />}
                  {layoutColumns.map((column) => (
                    <th key={column.id}>
                      {column.type !== 'actions' &&
                        column.type !== 'rowNumber' &&
                        column.filterable !== false &&
                        filterControl(column)}
                    </th>
                  ))}
                </tr>
              )}
          </thead>
        </table>
      </div>
      <div
        ref={bodyScrollRef}
        className="dt-body-scroll"
        style={{
          height: stickyHeader && tableHeight !== 'auto' ? 'var(--dt-table-height)' : 'auto',
        }}
        onScroll={(event) => {
          if (headerTableRef.current)
            headerTableRef.current.style.transform = `translateX(${-event.currentTarget.scrollLeft}px)`;
        }}
      >
        <table aria-label={ariaLabel} style={{ width: sharedTableWidth }}>
          <colgroup>
            {selectable && <col style={{ width: 48 }} />}
            {layoutColumns.map((column) => (
              <col key={column.id} style={{ width: columnWidth(column) }} />
            ))}
          </colgroup>
          <tbody>
            {visibleRows.map((row, rowIndex) => (
              <tr
                key={getRowId(row)}
                className={onRowClick ? 'dt-clickable' : undefined}
                onClick={() => onRowClick?.(row)}
              >
                {selectable && (
                  <td className="dt-select-column">
                    <div className="dt-cell-content dt-cell-content--center">
                      <input
                        type="checkbox"
                        aria-label={`Seleccionar fila ${start + rowIndex}`}
                        checked={selectedSet.has(getRowId(row))}
                        onChange={() => toggleRow(row)}
                        onClick={(event) => event.stopPropagation()}
                      />
                    </div>
                  </td>
                )}
                {layoutColumns.map((column, layoutIndex) => {
                  if (column.type === 'rowNumber')
                    return (
                      <td key={column.id} className="dt-row-number">
                        <div className="dt-cell-content dt-cell-content--center">{start + rowIndex}</div>
                      </td>
                    );
                  if (column.type === 'actions')
                    return (
                      <td key={column.id} className="dt-actions">
                        <div className="dt-cell-content dt-cell-content--center">
                          {actions
                            .filter((action) => !action.hidden?.(row))
                            .map((action) => (
                              <Tooltip
                                key={action.id}
                                label={action.label}
                                position="top"
                                containerClassName="dt-action-tooltip-container"
                                style={getTooltipStyle(theme, shape, tooltipStyle)}
                              >
                                <button
                                  type="button"
                                  className={action.variant === 'danger' ? 'dt-action dt-action--danger' : 'dt-action'}
                                  disabled={action.disabled?.(row)}
                                  aria-label={action.label}
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    action.onClick(row);
                                  }}
                                >
                                  {action.icon ?? action.label}
                                </button>
                              </Tooltip>
                            ))}
                        </div>
                      </td>
                    );
                  const value = valueOf(column, row);
                  const absoluteRow = start + rowIndex;
                  const isActive =
                    highlightActiveCell && activeCell?.row === absoluteRow && activeCell.column === layoutIndex + 1;
                  const content = column.cell ? column.cell(value, row, rowIndex) : String(value ?? '');
                  const tooltipLabel =
                    column.tooltip === false
                      ? null
                      : typeof column.tooltip === 'function'
                        ? column.tooltip(value, row)
                        : (column.tooltip ?? String(value ?? ''));
                  return (
                    <td
                      key={column.id}
                      className={`${column.className ?? ''} ${isActive ? 'dt-active-cell' : ''}`.trim()}
                      style={{ textAlign: column.align } as CSSProperties}
                      onClick={() => {
                        if (highlightActiveCell)
                          setActiveCell({
                            row: absoluteRow,
                            column: layoutIndex + 1,
                          });
                      }}
                    >
                      {cellTooltips && column.tooltip !== false ? (
                        <TruncatedCell
                          label={tooltipLabel}
                          align={column.align ?? 'left'}
                          shape={shape}
                          theme={theme}
                          tooltipStyle={tooltipStyle}
                        >
                          {content}
                        </TruncatedCell>
                      ) : (
                        <div className={`dt-cell-content dt-cell-content--${column.align ?? 'left'}`}>{content}</div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
            {visibleRows.length === 0 && (
              <tr>
                <td className="dt-empty" colSpan={layoutColumns.length + (selectable ? 1 : 0)}>
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {features.pagination && (
        <nav className="dt-pagination" aria-label="Paginación de la tabla">
          <span>
            {start}–{end} de {processedRows.length}
          </span>
          <label>
            Filas{' '}
            <select
              value={pageSize}
              onChange={(event) => {
                setPageSize(Number(event.target.value));
                setPage(1);
              }}
            >
              {allPageSizes.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </label>
          <div className="dt-page-buttons">
            <button type="button" onClick={() => setPage(1)} disabled={safePage === 1} aria-label="Primera página">
              «
            </button>
            <button
              type="button"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={safePage === 1}
              aria-label="Página anterior"
            >
              ‹
            </button>
            <span>
              Página {safePage} de {pageCount}
            </span>
            <button
              type="button"
              onClick={() => setPage((current) => Math.min(pageCount, current + 1))}
              disabled={safePage === pageCount}
              aria-label="Página siguiente"
            >
              ›
            </button>
            <button
              type="button"
              onClick={() => setPage(pageCount)}
              disabled={safePage === pageCount}
              aria-label="Última página"
            >
              »
            </button>
          </div>
        </nav>
      )}
    </div>
  );
}
