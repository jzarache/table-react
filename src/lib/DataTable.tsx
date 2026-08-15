import {
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Filter, X } from "lucide-react";
import { Tooltip } from "@jzarache/tooltip-react";
import "./DataTable.css";

export type SortDirection = "asc" | "desc" | "none";

export type DataTableColumn<T> = {
  id: string;
  header: ReactNode;
  accessor?: keyof T | ((row: T) => unknown);
  cell?: (value: unknown, row: T, rowIndex: number) => ReactNode;
  sortable?: boolean;
  filterable?: boolean;
  filterPlaceholder?: string;
  filterFn?: (value: unknown, filter: string, row: T) => boolean;
  sortFn?: (a: T, b: T) => number;
  resizable?: boolean;
  width?: number;
  minWidth?: number;
  maxWidth?: number;
  align?: "left" | "center" | "right";
  className?: string;
  /** Contenido del tooltip; false lo desactiva. Por defecto usa el valor de la celda. */
  tooltip?: false | ReactNode | ((value: unknown, row: T) => ReactNode);
};

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
  variant?: "default" | "danger";
};

export type DataTableFeatures = {
  sorting?: boolean;
  filtering?: boolean;
  pagination?: boolean;
  resizing?: boolean;
};

export type DataTableTheme = {
  primary?: string;
  surface?: string;
  text?: string;
  border?: string;
};

export type DataTableProps<T> = {
  data: T[];
  columns: DataTableColumn<T>[];
  getRowId: (row: T) => string | number;
  actions?: DataTableAction<T>[];
  features?: DataTableFeatures;
  pageSize?: number;
  pageSizeOptions?: number[];
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
  filterMode?: "menu" | "row";
  /** Cuatro colores semánticos; los tonos secundarios se generan automáticamente. */
  theme?: DataTableTheme;
  /** Agrega una columna de selección múltiple. */
  selectable?: boolean;
  /** IDs seleccionados para uso controlado. */
  selectedRowIds?: Array<string | number>;
  /** Selección inicial para uso no controlado. */
  defaultSelectedRowIds?: Array<string | number>;
  onSelectionChange?: (ids: Array<string | number>, rows: T[]) => void;
  /** Muestra una columna con el número absoluto de cada registro. */
  showRowNumbers?: boolean;
  /** Muestra cantidad de registros, columnas y coordenada de la celda activa. */
  showTableInfo?: boolean;
  /** Resalta con borde y fondo la última celda pulsada. */
  highlightActiveCell?: boolean;
  /** Configura el ancho y redimensionado de la columna de acciones. */
  actionsColumn?: DataTableActionsColumn;
  /** Muestra tooltips únicamente cuando el contenido está truncado. */
  cellTooltips?: boolean;
  /** Lenguaje de bordes global para tabla, controles y tooltips. */
  shape?: "soft" | "square";
  /** Sobrescribe estilos del tooltip después de aplicar la paleta. */
  tooltipStyle?: CSSProperties;
};

const defaultFeatures: Required<DataTableFeatures> = {
  sorting: true,
  filtering: true,
  pagination: true,
  resizing: true,
};

function valueOf<T>(column: DataTableColumn<T>, row: T): unknown {
  if (typeof column.accessor === "function") return column.accessor(row);
  if (column.accessor) return row[column.accessor];
  return undefined;
}

function compareValues(a: unknown, b: unknown): number {
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  if (typeof a === "number" && typeof b === "number") return a - b;
  if (a instanceof Date && b instanceof Date) return a.getTime() - b.getTime();
  return String(a).localeCompare(String(b), undefined, {
    numeric: true,
    sensitivity: "base",
  });
}

function getTooltipStyle(
  theme: DataTableTheme | undefined,
  shape: "soft" | "square",
  customStyle?: CSSProperties,
): CSSProperties {
  const primary = theme?.primary ?? "#2563eb";
  const surface = theme?.surface ?? "#ffffff";
  const border = theme?.border ?? primary;
  return {
    backgroundColor: primary,
    color: surface,
    border: `1px solid ${border}`,
    borderRadius: shape === "square" ? "0" : "8px",
    padding: "8px 11px",
    boxShadow: `0 8px 24px ${theme?.text ?? "#172033"}33`,
    fontSize: "12px",
    fontWeight: 600,
    lineHeight: 1.4,
    maxWidth: "320px",
    whiteSpace: "normal",
    overflowWrap: "anywhere",
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
  align: "left" | "center" | "right";
  shape: "soft" | "square";
  theme?: DataTableTheme;
  tooltipStyle?: CSSProperties;
}) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [truncated, setTruncated] = useState(false);

  useEffect(() => {
    const content = contentRef.current;
    if (!content) return;
    const measure = () =>
      setTruncated(
        content.scrollWidth > content.clientWidth ||
          content.scrollHeight > content.clientHeight,
      );
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
      <div
        ref={contentRef}
        className={`dt-cell-content dt-cell-content--${align}`}
      >
        {children}
      </div>
    </Tooltip>
  );
}

const nextSort: Record<SortDirection, SortDirection> = {
  none: "asc",
  asc: "desc",
  desc: "none",
};

export function DataTable<T>({
  data,
  columns,
  getRowId,
  actions = [],
  features: featureOverrides,
  pageSize: initialPageSize = 10,
  pageSizeOptions = [5, 10, 20, 50],
  emptyMessage = "No hay datos para mostrar",
  className = "",
  ariaLabel = "Tabla de datos",
  onRowClick,
  rowHeight = 48,
  tableHeight = "auto",
  stickyHeader = false,
  filterMode = "menu",
  theme,
  selectable = false,
  selectedRowIds,
  defaultSelectedRowIds = [],
  onSelectionChange,
  showRowNumbers = false,
  showTableInfo = false,
  highlightActiveCell = false,
  actionsColumn,
  cellTooltips = true,
  shape = "soft",
  tooltipStyle,
}: DataTableProps<T>) {
  const features = { ...defaultFeatures, ...featureOverrides };
  const [sort, setSort] = useState<{
    columnId: string | null;
    direction: SortDirection;
  }>({
    columnId: null,
    direction: "none",
  });
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [openFilterId, setOpenFilterId] = useState<string | null>(null);
  const filterMenuRef = useRef<HTMLDivElement>(null);
  const headerTableRef = useRef<HTMLTableElement>(null);
  const bodyScrollRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [internalSelectedIds, setInternalSelectedIds] = useState<
    Array<string | number>
  >(defaultSelectedRowIds);
  const [activeCell, setActiveCell] = useState<{
    row: number;
    column: number;
    label: ReactNode;
  } | null>(null);
  const [actionsWidth, setActionsWidth] = useState(actionsColumn?.width ?? 120);
  const [widths, setWidths] = useState<Record<string, number>>(() =>
    Object.fromEntries(
      columns.map((column) => [column.id, column.width ?? 180]),
    ),
  );

  useEffect(() => {
    if (!openFilterId) return;
    const closeOutside = (event: PointerEvent) => {
      if (!filterMenuRef.current?.contains(event.target as Node))
        setOpenFilterId(null);
    };
    const closeWithEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") setOpenFilterId(null);
    };
    document.addEventListener("pointerdown", closeOutside);
    document.addEventListener("keydown", closeWithEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOutside);
      document.removeEventListener("keydown", closeWithEscape);
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
          const filter = filters[column.id]?.trim();
          if (!filter || column.filterable === false) return true;
          const value = valueOf(column, row);
          return column.filterFn
            ? column.filterFn(value, filter, row)
            : String(value ?? "")
                .toLocaleLowerCase()
                .includes(filter.toLocaleLowerCase());
        }),
      );
    }
    if (features.sorting && sort.columnId && sort.direction !== "none") {
      const column = columns.find((item) => item.id === sort.columnId);
      if (column) {
        rows.sort((a, b) => {
          const result = column.sortFn
            ? column.sortFn(a, b)
            : compareValues(valueOf(column, a), valueOf(column, b));
          return sort.direction === "asc" ? result : -result;
        });
      }
    }
    return rows;
  }, [columns, data, features.filtering, features.sorting, filters, sort]);

  const pageCount = features.pagination
    ? Math.max(1, Math.ceil(processedRows.length / pageSize))
    : 1;
  const safePage = Math.min(page, pageCount);
  const visibleRows = features.pagination
    ? processedRows.slice((safePage - 1) * pageSize, safePage * pageSize)
    : processedRows;

  const toggleSort = (column: DataTableColumn<T>) => {
    if (!features.sorting || column.sortable === false) return;
    setSort((current) => {
      const direction =
        current.columnId === column.id ? nextSort[current.direction] : "asc";
      return { columnId: direction === "none" ? null : column.id, direction };
    });
    setPage(1);
  };

  const resize = (column: DataTableColumn<T>, movement: number) => {
    setWidths((current) => ({
      ...current,
      [column.id]: Math.min(
        column.maxWidth ?? 600,
        Math.max(
          column.minWidth ?? 80,
          (current[column.id] ?? column.width ?? 180) + movement,
        ),
      ),
    }));
  };

  const startResize = (
    event: ReactPointerEvent,
    column: DataTableColumn<T>,
  ) => {
    event.preventDefault();
    const startX = event.clientX;
    const startWidth = widths[column.id] ?? column.width ?? 180;
    const onMove = (moveEvent: PointerEvent) => {
      const next = Math.min(
        column.maxWidth ?? 600,
        Math.max(
          column.minWidth ?? 80,
          startWidth + moveEvent.clientX - startX,
        ),
      );
      setWidths((current) => ({ ...current, [column.id]: next }));
    };
    const onUp = () => {
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerup", onUp);
      document.body.classList.remove("dt-resizing");
    };
    document.body.classList.add("dt-resizing");
    document.addEventListener("pointermove", onMove);
    document.addEventListener("pointerup", onUp);
  };

  const resizeWithKeyboard = (
    event: KeyboardEvent,
    column: DataTableColumn<T>,
  ) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    resize(column, event.key === "ArrowLeft" ? -10 : 10);
  };

  const resizeActions = (movement: number) =>
    setActionsWidth((current) =>
      Math.min(
        actionsColumn?.maxWidth ?? 360,
        Math.max(actionsColumn?.minWidth ?? 90, current + movement),
      ),
    );
  const startActionsResize = (event: ReactPointerEvent) => {
    event.preventDefault();
    const startX = event.clientX;
    const startWidth = actionsWidth;
    const onMove = (moveEvent: PointerEvent) =>
      setActionsWidth(
        Math.min(
          actionsColumn?.maxWidth ?? 360,
          Math.max(
            actionsColumn?.minWidth ?? 90,
            startWidth + moveEvent.clientX - startX,
          ),
        ),
      );
    const onUp = () => {
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerup", onUp);
      document.body.classList.remove("dt-resizing");
    };
    document.body.classList.add("dt-resizing");
    document.addEventListener("pointermove", onMove);
    document.addEventListener("pointerup", onUp);
  };
  const resizeActionsWithKeyboard = (event: KeyboardEvent) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    resizeActions(event.key === "ArrowLeft" ? -10 : 10);
  };

  const allPageSizes = [...new Set([...pageSizeOptions, initialPageSize])].sort(
    (a, b) => a - b,
  );
  const start = processedRows.length === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const end = Math.min(safePage * pageSize, processedRows.length);
  const columnsWidth =
    columns.reduce(
      (total, column) => total + (widths[column.id] ?? column.width ?? 180),
      0,
    ) +
    (selectable ? 48 : 0) +
    (showRowNumbers ? 56 : 0) +
    (actions.length ? actionsWidth : 0);
  const sharedTableWidth = Math.max(columnsWidth, containerWidth);
  const effectiveSelectedIds = selectedRowIds ?? internalSelectedIds;
  const selectedSet = new Set(effectiveSelectedIds);
  const visibleIds = visibleRows.map(getRowId);
  const selectedVisibleCount = visibleIds.filter((id) =>
    selectedSet.has(id),
  ).length;

  const updateSelection = (nextIds: Array<string | number>) => {
    if (selectedRowIds === undefined) setInternalSelectedIds(nextIds);
    onSelectionChange?.(
      nextIds,
      data.filter((row) => nextIds.includes(getRowId(row))),
    );
  };

  const toggleRow = (row: T) => {
    const id = getRowId(row);
    updateSelection(
      selectedSet.has(id)
        ? effectiveSelectedIds.filter((item) => item !== id)
        : [...effectiveSelectedIds, id],
    );
  };

  const toggleVisibleRows = () => {
    const next = new Set(effectiveSelectedIds);
    if (selectedVisibleCount === visibleIds.length)
      visibleIds.forEach((id) => next.delete(id));
    else visibleIds.forEach((id) => next.add(id));
    updateSelection([...next]);
  };
  const rootStyle = {
    "--dt-row-height": `${Math.max(32, rowHeight)}px`,
    "--dt-table-height":
      typeof tableHeight === "number" ? `${tableHeight}px` : tableHeight,
    ...(theme?.primary ? { "--dt-primary": theme.primary } : {}),
    ...(theme?.surface ? { "--dt-surface": theme.surface } : {}),
    ...(theme?.text ? { "--dt-text": theme.text } : {}),
    ...(theme?.border ? { "--dt-border": theme.border } : {}),
  } as CSSProperties;

  const filterControl = (column: DataTableColumn<T>) => (
    <input
      type="search"
      value={filters[column.id] ?? ""}
      placeholder={
        column.filterPlaceholder ?? `Filtrar ${String(column.header)}`
      }
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
      className={`dt-root dt-shape--${shape} ${stickyHeader ? "dt-sticky" : ""} ${className}`.trim()}
      style={rootStyle}
    >
      <div className="dt-header-scroll">
        <table
          ref={headerTableRef}
          aria-label={`${ariaLabel}, cabecera`}
          style={{ width: sharedTableWidth }}
        >
          <colgroup>
            {selectable && <col style={{ width: 48 }} />}
            {showRowNumbers && <col style={{ width: 56 }} />}
            {columns.map((column) => (
              <col
                key={column.id}
                style={{ width: widths[column.id] ?? column.width ?? 180 }}
              />
            ))}
            {actions.length > 0 && <col style={{ width: actionsWidth }} />}
          </colgroup>
          <thead>
            <tr>
              {selectable && (
                <th className="dt-select-column">
                  <input
                    type="checkbox"
                    aria-label="Seleccionar filas visibles"
                    checked={
                      visibleIds.length > 0 &&
                      selectedVisibleCount === visibleIds.length
                    }
                    ref={(element) => {
                      if (element)
                        element.indeterminate =
                          selectedVisibleCount > 0 &&
                          selectedVisibleCount < visibleIds.length;
                    }}
                    onChange={toggleVisibleRows}
                  />
                </th>
              )}
              {showRowNumbers && <th className="dt-row-number-heading">#</th>}
              {columns.map((column) => {
                const sortable = features.sorting && column.sortable !== false;
                const direction =
                  sort.columnId === column.id ? sort.direction : "none";
                return (
                  <th
                    key={column.id}
                    className={column.className}
                    style={{ textAlign: column.align }}
                    aria-sort={
                      direction === "none"
                        ? "none"
                        : direction === "asc"
                          ? "ascending"
                          : "descending"
                    }
                  >
                    <div className="dt-header-content">
                      <span className="dt-header-label">{column.header}</span>
                      {features.filtering &&
                        filterMode === "menu" &&
                        column.filterable !== false && (
                          <div
                            className={`dt-filter-menu ${openFilterId === column.id ? "dt-filter-menu--open" : ""}`}
                            ref={
                              openFilterId === column.id
                                ? filterMenuRef
                                : undefined
                            }
                          >
                            <button
                              type="button"
                              className="dt-filter-trigger"
                              aria-label={`Filtrar ${String(column.header)}`}
                              title={`Filtrar ${String(column.header)}`}
                              aria-expanded={openFilterId === column.id}
                              onClick={() =>
                                setOpenFilterId((current) =>
                                  current === column.id ? null : column.id,
                                )
                              }
                            >
                              <Filter
                                size={14}
                                strokeWidth={2}
                                aria-hidden="true"
                              />
                              {filters[column.id] && <i />}
                            </button>
                            {openFilterId === column.id && (
                              <div className="dt-filter-popover">
                                <div className="dt-filter-title">
                                  <span>Filtrar por {column.header}</span>
                                  <button
                                    type="button"
                                    aria-label="Cerrar filtro"
                                    onClick={() => setOpenFilterId(null)}
                                  >
                                    <X size={16} aria-hidden="true" />
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
                                        [column.id]: "",
                                      }));
                                      setPage(1);
                                    }}
                                  >
                                    <X size={13} aria-hidden="true" /> Limpiar
                                  </button>
                                  <button
                                    type="button"
                                    className="dt-filter-done"
                                    onClick={() => setOpenFilterId(null)}
                                  >
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
                          aria-label={`Ordenar por ${String(column.header)}${direction === "none" ? "" : `, orden ${direction}`}`}
                          onClick={() => toggleSort(column)}
                        >
                          <span
                            className={`dt-sort dt-sort--${direction}`}
                            aria-hidden="true"
                          />
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
              {actions.length > 0 && (
                <th className="dt-actions-heading">
                  Acciones
                  {features.resizing && actionsColumn?.resizable !== false && (
                    <span
                      className="dt-resizer dt-resizer--inset"
                      role="separator"
                      aria-label="Redimensionar Acciones"
                      aria-orientation="vertical"
                      tabIndex={0}
                      onPointerDown={startActionsResize}
                      onKeyDown={resizeActionsWithKeyboard}
                    />
                  )}
                </th>
              )}
            </tr>
            {features.filtering &&
              filterMode === "row" &&
              columns.some((column) => column.filterable !== false) && (
                <tr className="dt-filters">
                  {selectable && <th />}
                  {showRowNumbers && <th />}
                  {columns.map((column) => (
                    <th key={column.id}>
                      {column.filterable !== false && filterControl(column)}
                    </th>
                  ))}
                  {actions.length > 0 && <th />}
                </tr>
              )}
          </thead>
        </table>
      </div>
      <div
        ref={bodyScrollRef}
        className="dt-body-scroll"
        style={{
          height:
            stickyHeader && tableHeight !== "auto"
              ? "var(--dt-table-height)"
              : "auto",
        }}
        onScroll={(event) => {
          if (headerTableRef.current)
            headerTableRef.current.style.transform = `translateX(${-event.currentTarget.scrollLeft}px)`;
        }}
      >
        <table aria-label={ariaLabel} style={{ width: sharedTableWidth }}>
          <colgroup>
            {selectable && <col style={{ width: 48 }} />}
            {showRowNumbers && <col style={{ width: 56 }} />}
            {columns.map((column) => (
              <col
                key={column.id}
                style={{ width: widths[column.id] ?? column.width ?? 180 }}
              />
            ))}
            {actions.length > 0 && <col style={{ width: actionsWidth }} />}
          </colgroup>
          <tbody>
            {visibleRows.map((row, rowIndex) => (
              <tr
                key={getRowId(row)}
                className={onRowClick ? "dt-clickable" : undefined}
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
                {showRowNumbers && (
                  <td className="dt-row-number">
                    <div className="dt-cell-content dt-cell-content--center">
                      {start + rowIndex}
                    </div>
                  </td>
                )}
                {columns.map((column) => {
                  const value = valueOf(column, row);
                  const columnIndex = columns.indexOf(column);
                  const absoluteRow = start + rowIndex;
                  const isActive =
                    highlightActiveCell &&
                    activeCell?.row === absoluteRow &&
                    activeCell.column === columnIndex + 1;
                  const content = column.cell
                    ? column.cell(value, row, rowIndex)
                    : String(value ?? "");
                  const tooltipLabel =
                    column.tooltip === false
                      ? null
                      : typeof column.tooltip === "function"
                        ? column.tooltip(value, row)
                        : (column.tooltip ?? String(value ?? ""));
                  return (
                    <td
                      key={column.id}
                      className={`${column.className ?? ""} ${isActive ? "dt-active-cell" : ""}`.trim()}
                      style={{ textAlign: column.align } as CSSProperties}
                      onClick={() => {
                        if (showTableInfo || highlightActiveCell)
                          setActiveCell({
                            row: absoluteRow,
                            column: columnIndex + 1,
                            label: column.header,
                          });
                      }}
                    >
                      {cellTooltips && column.tooltip !== false ? (
                        <TruncatedCell
                          label={tooltipLabel}
                          align={column.align ?? "left"}
                          shape={shape}
                          theme={theme}
                          tooltipStyle={tooltipStyle}
                        >
                          {content}
                        </TruncatedCell>
                      ) : (
                        <div
                          className={`dt-cell-content dt-cell-content--${column.align ?? "left"}`}
                        >
                          {content}
                        </div>
                      )}
                    </td>
                  );
                })}
                {actions.length > 0 && (
                  <td className="dt-actions">
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
                              className={
                                action.variant === "danger"
                                  ? "dt-action dt-action--danger"
                                  : "dt-action"
                              }
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
                )}
              </tr>
            ))}
            {visibleRows.length === 0 && (
              <tr>
                <td
                  className="dt-empty"
                  colSpan={
                    columns.length +
                    (selectable ? 1 : 0) +
                    (showRowNumbers ? 1 : 0) +
                    (actions.length ? 1 : 0)
                  }
                >
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {showTableInfo && (
        <div className="dt-table-info">
          <span>
            <strong>{processedRows.length}</strong> registros ·{" "}
            <strong>{columns.length}</strong> columnas
          </span>
          <span>
            {selectable && `${effectiveSelectedIds.length} seleccionados`}
            {selectable && activeCell && " · "}
            {activeCell && (
              <>
                Celda{" "}
                <strong>
                  F{activeCell.row}:C{activeCell.column}
                </strong>{" "}
                ({activeCell.label})
              </>
            )}
          </span>
        </div>
      )}
      {features.pagination && (
        <nav className="dt-pagination" aria-label="Paginación de la tabla">
          <span>
            {start}–{end} de {processedRows.length}
          </span>
          <label>
            Filas{" "}
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
            <button
              type="button"
              onClick={() => setPage(1)}
              disabled={safePage === 1}
              aria-label="Primera página"
            >
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
              onClick={() =>
                setPage((current) => Math.min(pageCount, current + 1))
              }
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
