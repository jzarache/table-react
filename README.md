# @jzarache/table-react

Tabla de datos reutilizable para React y TypeScript. Incluye ordenamiento, filtros, paginación, selección, redimensionamiento, reordenamiento de columnas, acciones por fila y personalización visual.

## Demo

https://table-react-jz.vercel.app

## Características

- API genérica y completamente tipada con TypeScript.
- Ordenamiento ascendente, descendente y sin orden.
- Filtros por columna en menú o fila visible.
- Paginación y selector de filas por página.
- Selección individual y selección de la página visible.
- Redimensionamiento de columnas con puntero o teclado.
- Reordenamiento de columnas con arrastre o teclado.
- Celdas personalizadas mediante componentes React.
- Columna de acciones ubicable en cualquier posición.
- Tooltips automáticos para contenido truncado.
- Encabezado fijo y área de desplazamiento configurable.
- Temas mediante variables y colores semánticos.
- Salidas ESM, CommonJS, CSS y declaraciones TypeScript.

## Requisitos

- React 19.
- React DOM 19.

## Instalación

Con pnpm:

```bash
pnpm add @jzarache/table-react
```

Con npm:

```bash
npm install @jzarache/table-react
```

## Uso básico

```tsx
import { DataTable, type DataTableColumn } from "@jzarache/table-react";

type User = {
  id: number;
  name: string;
  email: string;
  status: "Activo" | "Inactivo";
};

const columns: DataTableColumn<User>[] = [
  {
    id: "name",
    header: "Nombre",
    accessor: "name",
    sortable: true,
    filterable: true,
  },
  {
    id: "actions",
    type: "actions",
    header: "Acciones",
    width: 140,
  },
  {
    id: "email",
    header: "Correo",
    accessor: "email",
    filterable: true,
  },
  {
    id: "status",
    header: "Estado",
    accessor: "status",
  },
];

export function UsersTable({ users }: { users: User[] }) {
  return (
    <DataTable
      data={users}
      columns={columns}
      getRowId={(user) => user.id}
      features={{
        sorting: true,
        filtering: true,
        pagination: true,
        resizing: true,
        columnReordering: true,
      }}
      selectable
      stickyHeader
      tableHeight={500}
      actions={[
        {
          id: "edit",
          label: "Editar",
          onClick: (user) => console.log("Editar", user),
        },
      ]}
    />
  );
}
```

`getRowId` identifica internamente cada fila, pero no crea una columna visible. Cuando `selectable` está activo, el checkbox permanece fijo al inicio.

## Definición y orden de columnas

El orden del arreglo `columns` determina el orden visual inicial de la tabla.

### Columna de datos

```tsx
{
  id: "email",
  header: "Correo",
  accessor: "email",
  sortable: true,
  filterable: true,
  width: 240,
  minWidth: 140,
  maxWidth: 400,
}
```

`accessor` puede ser una propiedad del registro o una función:

```tsx
{
  id: "fullName",
  header: "Nombre completo",
  accessor: (user) => `${user.name} ${user.lastName}`,
}
```

Para renderizar contenido React personalizado usa `cell`:

```tsx
{
  id: "status",
  header: "Estado",
  accessor: "status",
  cell: (value, user) => (
    <span data-user-id={user.id}>{String(value)}</span>
  ),
}
```

### Columna de acciones

Declara `type: "actions"` dentro de `columns` para colocar las acciones en cualquier posición:

```tsx
{ id: "actions", type: "actions", header: "Opciones", width: 140 }
```

Luego proporciona las acciones al componente:

```tsx
<DataTable
  actions={[
    {
      id: "edit",
      label: "Editar",
      icon: <Pencil size={16} />,
      onClick: (row) => editUser(row),
    },
    {
      id: "delete",
      label: "Eliminar",
      variant: "danger",
      disabled: (row) => row.status === "Inactivo",
      hidden: (row) => !canDelete(row),
      onClick: (row) => deleteUser(row),
    },
  ]}
/>
```

Si proporcionas `actions` sin declarar la columna especial, la tabla conserva compatibilidad y agrega las acciones al final.

### Número de fila

Puedes agregarlo automáticamente:

```tsx
<DataTable showRowNumbers />
```

También puedes controlar su posición desde `columns`:

```tsx
{ id: "rowNumber", type: "rowNumber", header: "#", width: 56 }
```

## Reordenamiento de columnas

Actívalo mediante `features.columnReordering`:

```tsx
<DataTable features={{ columnReordering: true }} />
```

El usuario puede arrastrar el asa del encabezado o enfocarla y utilizar las flechas izquierda y derecha.

Para controlar y persistir el orden desde la aplicación:

```tsx
const [columnOrder, setColumnOrder] = useState([
  "name",
  "actions",
  "email",
  "status",
])

<DataTable
  data={users}
  columns={columns}
  getRowId={(user) => user.id}
  features={{ columnReordering: true }}
  columnOrder={columnOrder}
  onColumnOrderChange={setColumnOrder}
/>
```

Usa `defaultColumnOrder` si solo necesitas establecer un orden inicial no controlado. Los IDs nuevos u omitidos se incorporan automáticamente al final.

El checkbox de selección permanece fijo. Para mover acciones o numeración, sus columnas deben estar declaradas explícitamente dentro de `columns`.

## Selección

Uso no controlado:

```tsx
<DataTable selectable defaultSelectedRowIds={[1, 2]} />
```

Uso controlado:

```tsx
const [selectedIds, setSelectedIds] = useState<Array<string | number>>([])

<DataTable
  selectable
  selectedRowIds={selectedIds}
  onSelectionChange={(ids, selectedRows) => {
    setSelectedIds(ids)
    console.log(selectedRows)
  }}
/>
```

## Filtros y ordenamiento personalizados

```tsx
{
  id: "salary",
  header: "Salario",
  accessor: "salary",
  filterable: true,
  sortable: true,
  filterFn: (value, filter) => Number(value) >= Number(filter || 0),
  sortFn: (a, b) => a.salary - b.salary,
}
```

Las propiedades `sortable`, `filterable` y `resizable` de cada columna permiten sobrescribir las funciones globales.

## Presentación

```tsx
<DataTable
  rowHeight={42}
  tableHeight="70vh"
  stickyHeader
  filterMode="menu"
  shape="soft"
  cellTooltips
  highlightActiveCell
/>
```

- `rowHeight` controla el alto de las filas, con un mínimo de 32 px.
- `tableHeight` acepta píxeles, cualquier medida CSS o `"auto"`.
- `stickyHeader` mantiene la cabecera fuera del área desplazable.
- `filterMode="menu"` muestra filtros desplegables compactos.
- `filterMode="row"` muestra una fila permanente de filtros.
- `shape="soft" | "square"` controla el estilo global de los bordes.
- `cellTooltips` muestra tooltips cuando el contenido está truncado.
- `highlightActiveCell` resalta la última celda seleccionada.

## Temas

```tsx
<DataTable
  theme={{
    primary: "#7c3aed",
    surface: "#ffffff",
    text: "#1e1b2e",
    border: "#ddd7eb",
  }}
/>
```

Todos los colores son opcionales. `tooltipStyle` permite sobrescribir estilos específicos de los tooltips.

## Funcionalidades globales

```tsx
features={{
  sorting: true,
  filtering: true,
  pagination: true,
  resizing: true,
  columnReordering: true,
}}
```

`sorting`, `filtering`, `pagination` y `resizing` están activos por defecto. `columnReordering` debe activarse explícitamente.

## API de `DataTable`

| Propiedad               | Tipo                            | Valor inicial                 | Descripción                                                  |
| ----------------------- | ------------------------------- | ----------------------------- | ------------------------------------------------------------ |
| `data`                  | `readonly T[]`                  | Requerida                     | Registros que mostrará la tabla.                             |
| `columns`               | `readonly DataTableColumn<T>[]` | Requerida                     | Definición y orden inicial de las columnas.                  |
| `getRowId`              | `(row: T) => string \| number`  | Requerida                     | Devuelve un identificador único por fila.                    |
| `actions`               | `readonly DataTableAction<T>[]` | `[]`                          | Acciones disponibles para cada fila.                         |
| `features`              | `DataTableFeatures`             | Funciones principales activas | Activa o desactiva funciones globales.                       |
| `pageSize`              | `number`                        | `10`                          | Cantidad inicial de filas por página.                        |
| `pageSizeOptions`       | `readonly number[]`             | `[5, 10, 20, 50]`             | Opciones del selector de filas.                              |
| `emptyMessage`          | `ReactNode`                     | `"No hay datos para mostrar"` | Contenido mostrado sin resultados.                           |
| `className`             | `string`                        | `""`                          | Clase adicional para el contenedor raíz.                     |
| `ariaLabel`             | `string`                        | `"Tabla de datos"`            | Nombre accesible de la tabla.                                |
| `onRowClick`            | `(row: T) => void`              | —                             | Evento al pulsar una fila.                                   |
| `rowHeight`             | `number`                        | `48`                          | Alto de cada fila en píxeles.                                |
| `tableHeight`           | `number \| string`              | `"auto"`                      | Alto del área desplazable.                                   |
| `stickyHeader`          | `boolean`                       | `false`                       | Mantiene visible el encabezado.                              |
| `filterMode`            | `"menu" \| "row"`               | `"menu"`                      | Presentación de los filtros.                                 |
| `theme`                 | `DataTableTheme`                | Tema predeterminado           | Colores semánticos del componente.                           |
| `selectable`            | `boolean`                       | `false`                       | Activa la selección de filas.                                |
| `selectedRowIds`        | `readonly (string \| number)[]` | —                             | Selección controlada.                                        |
| `defaultSelectedRowIds` | `readonly (string \| number)[]` | `[]`                          | Selección inicial no controlada.                             |
| `onSelectionChange`     | `(ids, rows) => void`           | —                             | Informa cambios de selección.                                |
| `showRowNumbers`        | `boolean`                       | `false`                       | Agrega numeración automática.                                |
| `highlightActiveCell`   | `boolean`                       | `false`                       | Resalta la última celda pulsada.                             |
| `actionsColumn`         | `DataTableActionsColumn`        | —                             | Configuración heredada de la columna automática de acciones. |
| `cellTooltips`          | `boolean`                       | `true`                        | Activa tooltips para contenido truncado.                     |
| `shape`                 | `"soft" \| "square"`            | `"soft"`                      | Estilo global de los bordes.                                 |
| `tooltipStyle`          | `CSSProperties`                 | —                             | Sobrescribe los estilos del tooltip.                         |
| `columnOrder`           | `readonly string[]`             | —                             | Orden controlado de columnas.                                |
| `defaultColumnOrder`    | `readonly string[]`             | Orden de `columns`            | Orden inicial no controlado.                                 |
| `onColumnOrderChange`   | `(columnIds: string[]) => void` | —                             | Informa cambios en el orden.                                 |

## API de columnas

Una columna de datos admite:

| Propiedad           | Descripción                                            |
| ------------------- | ------------------------------------------------------ |
| `id`                | Identificador único de la columna.                     |
| `header`            | Contenido React del encabezado.                        |
| `accessor`          | Propiedad del registro o función que obtiene el valor. |
| `cell`              | Renderizador personalizado de la celda.                |
| `sortable`          | Activa o desactiva el ordenamiento de esa columna.     |
| `filterable`        | Activa o desactiva su filtro.                          |
| `filterPlaceholder` | Texto del campo de filtro.                             |
| `filterFn`          | Comparador personalizado para el filtro.               |
| `sortFn`            | Comparador personalizado para el ordenamiento.         |
| `resizable`         | Activa o desactiva su redimensionamiento.              |
| `width`             | Ancho inicial en píxeles.                              |
| `minWidth`          | Ancho mínimo.                                          |
| `maxWidth`          | Ancho máximo.                                          |
| `align`             | Alineación `left`, `center` o `right`.                 |
| `className`         | Clase adicional para encabezado y celdas.              |
| `tooltip`           | Contenido personalizado o `false` para desactivarlo.   |

Las columnas especiales utilizan `type: "actions"` o `type: "rowNumber"` y admiten configuración de encabezado, tamaño, alineación, clase y redimensionamiento.

## API de acciones

| Propiedad  | Tipo                    | Descripción                               |
| ---------- | ----------------------- | ----------------------------------------- |
| `id`       | `string`                | Identificador único de la acción.         |
| `label`    | `string`                | Nombre accesible y contenido alternativo. |
| `icon`     | `ReactNode`             | Icono o contenido visual opcional.        |
| `onClick`  | `(row: T) => void`      | Función ejecutada con el registro.        |
| `hidden`   | `(row: T) => boolean`   | Oculta la acción según el registro.       |
| `disabled` | `(row: T) => boolean`   | Deshabilita la acción según el registro.  |
| `variant`  | `"default" \| "danger"` | Apariencia visual de la acción.           |
