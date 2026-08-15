import { useMemo, useState } from "react";
import { Check, Copy, Eye, Pencil, RotateCcw, Trash2 } from "lucide-react";
import { DataTable, type DataTableColumn, type DataTableTheme } from "./lib";
import "./App.css";

type Person = {
  id: number;
  name: string;
  email: string;
  role: string;
  status: "Activo" | "Pausado" | "Invitado";
  joined: string;
  salary: number;
};

const initialPeople: Person[] = Array.from({ length: 37 }, (_, index) => ({
  id: index + 1,
  name: [
    "Ana Torres",
    "Luis Díaz",
    "Marta Silva",
    "Diego Ruiz",
    "Sofía Castro",
    "Carlos Rojas",
  ][index % 6],
  email: `usuario${index + 1}@empresa.com`,
  role: ["Diseño", "Ingeniería", "Producto", "Marketing"][index % 4],
  status: index % 6 === 5 ? "Invitado" : index % 4 === 3 ? "Pausado" : "Activo",
  joined: `2026-${String((index % 8) + 1).padStart(2, "0")}-${String((index % 25) + 1).padStart(2, "0")}`,
  salary: 1800 + (index % 9) * 275,
}));

const themes: Record<string, { label: string; colors: DataTableTheme }> = {
  violet: {
    label: "Violeta",
    colors: {
      primary: "#7c3aed",
      surface: "#ffffff",
      text: "#1e1b2e",
      border: "#ddd7eb",
    },
  },
  ocean: {
    label: "Océano",
    colors: {
      primary: "#0284c7",
      surface: "#ffffff",
      text: "#172554",
      border: "#cbddeb",
    },
  },
  forest: {
    label: "Bosque",
    colors: {
      primary: "#0f766e",
      surface: "#ffffff",
      text: "#16302b",
      border: "#c8ddd8",
    },
  },
  sunset: {
    label: "Atardecer",
    colors: {
      primary: "#ea580c",
      surface: "#fffcf7",
      text: "#431407",
      border: "#fed7aa",
    },
  },
  dark: {
    label: "Oscuro",
    colors: {
      primary: "#a78bfa",
      surface: "#17151f",
      text: "#f5f3ff",
      border: "#393442",
    },
  },
};

const codeExamples = {
  component: {
    label: "Componente",
    language: "tsx",
    code: `import { DataTable } from 'modern-react-table'
import 'modern-react-table/style.css'

export function UsersTable() {
  return (
    <DataTable
      data={users}
      columns={columns}
      getRowId={(user) => user.id}
      rowHeight={42}
      tableHeight={500}
      pageSize={10}
      stickyHeader
      filterMode="menu"
      shape="soft"
      features={{
        sorting: true,
        filtering: true,
        pagination: true,
        resizing: true,
      }}
      selectable
      showRowNumbers
      showTableInfo
      theme={{
        primary: '#7c3aed',
        surface: '#ffffff',
        text: '#1e1b2e',
        border: '#ddd7eb',
      }}
    />
  )
}`,
  },
  columns: {
    label: "Columnas / JSX",
    language: "tsx",
    code: `import type { DataTableColumn } from 'modern-react-table'

const columns: DataTableColumn<User>[] = [
  {
    id: 'name',
    header: 'Nombre',
    accessor: 'name',
    width: 180,
    sortable: true,
    filterable: true,
    resizable: true,
  },
  {
    id: 'role',
    header: 'Rol editable',
    accessor: 'role',
    cell: (_, row) => (
      <select
        value={row.role}
        onChange={(event) => updateRole(row.id, event.target.value)}
      >
        <option>Diseño</option>
        <option>Ingeniería</option>
        <option>Producto</option>
      </select>
    ),
  },
  {
    id: 'status',
    header: 'Estado',
    accessor: 'status',
    cell: (value) => <span className="badge">{String(value)}</span>,
  },
]`,
  },
  data: {
    label: "Estructura de datos",
    language: "tsx",
    code: `type User = {
  id: number
  name: string
  email: string
  role: string
  status: 'Activo' | 'Pausado'
}

const users: User[] = [
  {
    id: 1,
    name: 'Ana Torres',
    email: 'ana@empresa.com',
    role: 'Diseño',
    status: 'Activo',
  },
  {
    id: 2,
    name: 'Luis Díaz',
    email: 'luis@empresa.com',
    role: 'Ingeniería',
    status: 'Pausado',
  },
]

// Cada accessor conecta una columna con una propiedad del objeto.
// getRowId debe devolver un valor único para cada registro.`,
  },
  selection: {
    label: "Selección y acciones",
    language: "tsx",
    code: `const [selectedIds, setSelectedIds] = useState<(string | number)[]>([])

<DataTable
  data={users}
  columns={columns}
  getRowId={(user) => user.id}
  selectable
  selectedRowIds={selectedIds}
  onSelectionChange={(ids, selectedRows) => {
    setSelectedIds(ids)
    console.log('Objetos seleccionados:', selectedRows)
  }}
  actions={[
    {
      id: 'edit',
      label: 'Editar',
      icon: <Pencil size={16} color="#d97706" />,
      onClick: (user) => editUser(user),
    },
    {
      id: 'delete',
      label: 'Eliminar',
      icon: <Trash2 size={16} />,
      variant: 'danger',
      onClick: (user) => deleteUser(user.id),
    },
  ]}
/>`,
  },
} as const;

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="control-toggle">
      <span>{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      <i />
    </label>
  );
}

function App() {
  const [rows, setRows] = useState(initialPeople);
  const [selectedIds, setSelectedIds] = useState<Array<string | number>>([]);
  const [sorting, setSorting] = useState(true);
  const [filtering, setFiltering] = useState(true);
  const [pagination, setPagination] = useState(true);
  const [resizing, setResizing] = useState(true);
  const [selectable, setSelectable] = useState(true);
  const [rowNumbers, setRowNumbers] = useState(true);
  const [tableInfo, setTableInfo] = useState(true);
  const [highlightCell, setHighlightCell] = useState(false);
  const [cellTooltips, setCellTooltips] = useState(true);
  const [shape, setShape] = useState<"soft" | "square">("soft");
  const [sticky, setSticky] = useState(true);
  const [actionsEnabled, setActionsEnabled] = useState(true);
  const [rowHeight, setRowHeight] = useState(42);
  const [tableHeight, setTableHeight] = useState(420);
  const [pageSize, setPageSize] = useState(10);
  const [filterMode, setFilterMode] = useState<"menu" | "row">("menu");
  const [themeName, setThemeName] = useState("violet");
  const [lastEvent, setLastEvent] = useState(
    "La demo está lista. Interactúa con la tabla.",
  );
  const [activeCode, setActiveCode] =
    useState<keyof typeof codeExamples>("component");
  const [copied, setCopied] = useState(false);

  const columns = useMemo<DataTableColumn<Person>[]>(
    () => [
      {
        id: "name",
        header: "Nombre",
        accessor: "name",
        width: 180,
        minWidth: 130,
        filterable: true,
      },
      {
        id: "email",
        header: "Correo",
        accessor: "email",
        width: 235,
        filterable: true,
      },
      {
        id: "role",
        header: "Rol editable",
        accessor: "role",
        width: 170,
        filterable: true,
        cell: (_, row) => (
          <select
            aria-label={`Rol de ${row.name}`}
            value={row.role}
            onClick={(event) => event.stopPropagation()}
            onChange={(event) =>
              setRows((current) =>
                current.map((item) =>
                  item.id === row.id
                    ? { ...item, role: event.target.value }
                    : item,
                ),
              )
            }
          >
            <option>Diseño</option>
            <option>Ingeniería</option>
            <option>Producto</option>
            <option>Marketing</option>
          </select>
        ),
      },
      {
        id: "status",
        header: "Estado",
        accessor: "status",
        width: 130,
        filterable: true,
        cell: (value) => (
          <span className={`badge badge--${String(value).toLowerCase()}`}>
            {String(value)}
          </span>
        ),
      },
      {
        id: "salary",
        header: "Salario",
        accessor: "salary",
        width: 135,
        align: "right",
        filterable: true,
        filterFn: (value, filter) => Number(value) >= Number(filter || 0),
        cell: (value) =>
          new Intl.NumberFormat("es-CO", {
            style: "currency",
            currency: "USD",
            maximumFractionDigits: 0,
          }).format(Number(value)),
      },
      {
        id: "joined",
        header: "Ingreso",
        accessor: "joined",
        width: 135,
        filterable: false,
      },
    ],
    [],
  );

  const resetDemo = () => {
    setRows(initialPeople);
    setSelectedIds([]);
    setSorting(true);
    setFiltering(true);
    setPagination(true);
    setResizing(true);
    setSelectable(true);
    setRowNumbers(true);
    setTableInfo(true);
    setHighlightCell(false);
    setCellTooltips(true);
    setShape("soft");
    setSticky(true);
    setActionsEnabled(true);
    setRowHeight(42);
    setTableHeight(420);
    setPageSize(10);
    setFilterMode("menu");
    setThemeName("violet");
    setLastEvent("Configuración restablecida.");
  };

  const copyCurrentCode = async () => {
    await navigator.clipboard.writeText(codeExamples[activeCode].code);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  return (
    <main className="demo-shell">
      <header className="demo-header">
        <div>
          <span className="eyebrow">MODERN REACT TABLE · PLAYGROUND</span>
          <h1>Prueba cada detalle.</h1>
          <p>
            Activa funciones, cambia la apariencia e interactúa con datos reales
            desde un solo lugar.
          </p>
        </div>
        <button className="reset-button" type="button" onClick={resetDemo}>
          <RotateCcw size={16} /> Restablecer
        </button>
      </header>

      <section className="playground">
        <aside className="control-panel">
          <div className="control-heading">
            <span>Configuración</span>
            <small>Todo se actualiza en vivo</small>
          </div>
          <fieldset>
            <legend>Funciones</legend>
            <Toggle
              label="Ordenamiento"
              checked={sorting}
              onChange={setSorting}
            />
            <Toggle
              label="Filtros"
              checked={filtering}
              onChange={setFiltering}
            />
            <Toggle
              label="Paginación"
              checked={pagination}
              onChange={setPagination}
            />
            <Toggle
              label="Redimensionar"
              checked={resizing}
              onChange={setResizing}
            />
            <Toggle
              label="Cabecera fija"
              checked={sticky}
              onChange={setSticky}
            />
            <Toggle
              label="Tooltips truncados"
              checked={cellTooltips}
              onChange={setCellTooltips}
            />
          </fieldset>
          <fieldset>
            <legend>Columnas opcionales</legend>
            <Toggle
              label="Selección"
              checked={selectable}
              onChange={setSelectable}
            />
            <Toggle
              label="Número de fila"
              checked={rowNumbers}
              onChange={setRowNumbers}
            />
            <Toggle
              label="Barra informativa"
              checked={tableInfo}
              onChange={setTableInfo}
            />
            <Toggle
              label="Resaltar celda"
              checked={highlightCell}
              onChange={setHighlightCell}
            />
            <Toggle
              label="Acciones"
              checked={actionsEnabled}
              onChange={setActionsEnabled}
            />
          </fieldset>
          <fieldset className="control-fields">
            <legend>Presentación</legend>
            <label>
              Tema
              <select
                value={themeName}
                onChange={(event) => setThemeName(event.target.value)}
              >
                {Object.entries(themes).map(([key, theme]) => (
                  <option key={key} value={key}>
                    {theme.label}
                  </option>
                ))}
              </select>
            </label>
            <div className="palette" aria-label="Colores del tema">
              {Object.values(themes[themeName].colors).map((color) => (
                <i key={color} style={{ background: color }} />
              ))}
            </div>
            <label>
              Estilo de bordes
              <select
                value={shape}
                onChange={(event) =>
                  setShape(event.target.value as "soft" | "square")
                }
              >
                <option value="soft">Suave</option>
                <option value="square">Cuadrado</option>
              </select>
            </label>
            <label>
              Modo de filtro
              <select
                value={filterMode}
                onChange={(event) =>
                  setFilterMode(event.target.value as "menu" | "row")
                }
              >
                <option value="menu">Menú compacto</option>
                <option value="row">Fila visible</option>
              </select>
            </label>
            <label>
              Filas por página
              <select
                value={pageSize}
                onChange={(event) => setPageSize(Number(event.target.value))}
              >
                <option>5</option>
                <option>10</option>
                <option>20</option>
              </select>
            </label>
            <label>
              Alto de fila <strong>{rowHeight}px</strong>
              <input
                type="range"
                min="32"
                max="64"
                value={rowHeight}
                onChange={(event) => setRowHeight(Number(event.target.value))}
              />
            </label>
            <label>
              Alto del cuerpo <strong>{tableHeight}px</strong>
              <input
                type="range"
                min="240"
                max="620"
                step="20"
                value={tableHeight}
                onChange={(event) => setTableHeight(Number(event.target.value))}
              />
            </label>
          </fieldset>
        </aside>

        <div className="preview-area">
          <div className="preview-bar">
            <div>
              <i />
              <span>Vista previa</span>
            </div>
            <code>{rows.length} datos cargados</code>
          </div>
          <DataTable
            data={rows}
            columns={columns}
            getRowId={(row) => row.id}
            pageSize={pageSize}
            rowHeight={rowHeight}
            tableHeight={tableHeight}
            stickyHeader={sticky}
            filterMode={filterMode}
            shape={shape}
            theme={themes[themeName].colors}
            selectable={selectable}
            selectedRowIds={selectedIds}
            onSelectionChange={(ids) => {
              setSelectedIds(ids);
              setLastEvent(`${ids.length} fila(s) seleccionada(s).`);
            }}
            showRowNumbers={rowNumbers}
            showTableInfo={tableInfo}
            highlightActiveCell={highlightCell}
            cellTooltips={cellTooltips}
            actionsColumn={{ width: 140, minWidth: 105, maxWidth: 260 }}
            features={{ sorting, filtering, pagination, resizing }}
            onRowClick={(row) =>
              setLastEvent(`Fila pulsada: ${row.name} (#${row.id}).`)
            }
            actions={
              actionsEnabled
                ? [
                    {
                      id: "view",
                      label: "Ver",
                      icon: <Eye size={16} color="#0284c7" />,
                      onClick: (row) => setLastEvent(`Viendo a ${row.name}.`),
                    },
                    {
                      id: "edit",
                      label: "Editar",
                      icon: <Pencil size={16} color="#d97706" />,
                      onClick: (row) => setLastEvent(`Editando a ${row.name}.`),
                    },
                    {
                      id: "delete",
                      label: "Eliminar",
                      icon: <Trash2 size={16} />,
                      variant: "danger",
                      onClick: (row) => {
                        setRows((current) =>
                          current.filter((item) => item.id !== row.id),
                        );
                        setLastEvent(`${row.name} fue eliminado de la demo.`);
                      },
                    },
                  ]
                : []
            }
          />
          <div className="event-console">
            <span>Último evento</span>
            <p>{lastEvent}</p>
            <code>selectedRowIds: [{selectedIds.join(", ")}]</code>
          </div>
        </div>
      </section>

      <section className="code-docs">
        <div className="code-docs-heading">
          <div>
            <span className="eyebrow">GUÍA DE USO</span>
            <h2>Del dato al componente.</h2>
            <p>
              Copia estos templates y reemplaza el tipo y los campos por los de
              tu aplicación.
            </p>
          </div>
        </div>
        <div className="code-window">
          <div
            className="code-tabs"
            role="tablist"
            aria-label="Ejemplos de código"
          >
            <div>
              {Object.entries(codeExamples).map(([key, example]) => (
                <button
                  key={key}
                  type="button"
                  role="tab"
                  aria-selected={activeCode === key}
                  className={activeCode === key ? "active" : ""}
                  onClick={() => {
                    setActiveCode(key as keyof typeof codeExamples);
                    setCopied(false);
                  }}
                >
                  {example.label}
                </button>
              ))}
            </div>
            <button
              type="button"
              className="copy-button"
              onClick={copyCurrentCode}
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? "Copiado" : "Copiar"}
            </button>
          </div>
          <div className="code-meta">
            <span>{codeExamples[activeCode].language}</span>
            <span>
              {codeExamples[activeCode].code.split("\n").length} líneas
            </span>
          </div>
          <pre>
            <code>{codeExamples[activeCode].code}</code>
          </pre>
        </div>
        <div className="data-flow">
          <div>
            <strong>1</strong>
            <span>
              <b>Datos</b>Un arreglo de objetos tipados.
            </span>
          </div>
          <i>→</i>
          <div>
            <strong>2</strong>
            <span>
              <b>Columnas</b>Definen cómo leer y renderizar.
            </span>
          </div>
          <i>→</i>
          <div>
            <strong>3</strong>
            <span>
              <b>DataTable</b>Recibe datos, columnas y opciones.
            </span>
          </div>
        </div>
      </section>
    </main>
  );
}

export default App;
