# modern-react-table

Tabla moderna para React 18+ con TypeScript, sin dependencias de ejecución adicionales.

## Características

- Funciones activables globalmente con `features` y por columna.
- Orden ascendente, descendente y sin orden.
- Filtros por columna, incluidos filtros personalizados.
- Redimensionado con puntero y teclado.
- Paginación y selector de filas por página.
- Celdas React personalizadas y columna de acciones.
- API genérica, accesible y completamente tipada.

## Instalación

```bash
npm install modern-react-table
```

```tsx
import { DataTable, type DataTableColumn } from 'modern-react-table'
import 'modern-react-table/style.css'

type User = { id: number; name: string; role: string }

const columns: DataTableColumn<User>[] = [
  { id: 'name', header: 'Nombre', accessor: 'name', filterable: true },
  {
    id: 'role',
    header: 'Rol',
    accessor: 'role',
    cell: (value, row) => <select defaultValue={String(value)}>{/* opciones */}</select>,
  },
]

<DataTable
  data={users}
  columns={columns}
  getRowId={(user) => user.id}
  features={{ sorting: true, filtering: true, pagination: true, resizing: true }}
  rowHeight={42}
  tableHeight={500}
  stickyHeader
  filterMode="menu"
  theme={{ primary: '#7c3aed', surface: '#ffffff', text: '#1e1b2e', border: '#ddd7eb' }}
  selectable
  showRowNumbers
  showTableInfo
  actions={[{ id: 'edit', label: 'Editar', onClick: (user) => edit(user) }]}
/>
```

En cada columna se pueden usar `sortable`, `filterable` y `resizable` para sobrescribir las funciones globales. También admite `filterFn`, `sortFn`, anchos mínimo/máximo, alineación y renderizado mediante `cell`.

### Presentación

- `rowHeight={40}` controla la altura exacta de todas las filas (mínimo admitido: 32 px). El contenido y los componentes personalizados se limitan automáticamente a ese espacio.
- `tableHeight={500}` define el área con scroll; también admite medidas CSS como `"70vh"` o `"auto"`.
- `stickyHeader` mantiene la cabecera fuera del área desplazable. La barra vertical aparece únicamente en el cuerpo de la tabla.
- `filterMode="menu"` usa filtros desplegables compactos en cada cabecera.
- `filterMode="row"` muestra la fila tradicional de campos de filtro.

### Colores y temas

`theme` acepta cuatro colores semánticos: `primary`, `surface`, `text` y `border`. La tabla deriva automáticamente los fondos de cabecera, hover, foco, filtros y paginación. Todos son opcionales; por ejemplo, `theme={{ primary: '#0f766e' }}` cambia únicamente el color de marca.

### Selección e información

- `selectable` agrega checkboxes por fila y selección de toda la página visible.
- `selectedRowIds` y `onSelectionChange` permiten controlar la selección desde la aplicación.
- `showRowNumbers` agrega la numeración absoluta de los registros.
- `showTableInfo` muestra cantidades, selección actual y la coordenada de la última celda pulsada.
- `highlightActiveCell` resalta visualmente la última celda pulsada. Está desactivado por defecto y no es necesario para mostrar su coordenada en la barra informativa.
- `actionsColumn={{ width: 140, minWidth: 90, maxWidth: 360 }}` configura la columna de acciones, que es redimensionable por defecto.
- `cellTooltips` activa tooltips automáticos solo cuando el contenido está truncado. Cada columna admite `tooltip: false`, un nodo React o una función personalizada.
- `shape="soft" | "square"` aplica globalmente bordes suaves o cuadrados a la tabla, controles, filtros, acciones y tooltips.
- Los tooltips heredan `primary`, `surface`, `text` y `border` del tema. `tooltipStyle` permite sobrescribir cualquier estilo para un diseño particular.
- Las acciones usan el mismo componente global de tooltip y la misma configuración visual; ya no dependen del `title` nativo del navegador.

## Publicación

Actualiza el nombre del paquete si ya existe en npm, inicia sesión y publica:

```bash
pnpm build
npm publish
```
