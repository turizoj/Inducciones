import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical } from 'lucide-react'

// Mensajes en español para lectores de pantalla
const instrucciones = {
  draggable:
    'Para reordenar, presione espacio o Enter, muévase con las flechas arriba y abajo y presione espacio o Enter para soltar. Escape cancela.',
}

// HU-06: lista que se reordena arrastrando (con mouse, dedo o teclado).
// "children" recibe cada elemento, el botón de arrastre que debe pintar en la fila y su posición (desde 0).
export default function ListaOrdenable({ elementos, onOrdenar, nombre = 'elemento', children }) {
  const sensores = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )
  const posicion = (id) => elementos.findIndex((e) => e.id === id) + 1

  const anuncios = {
    onDragStart: ({ active }) => `Tomó el ${nombre} en la posición ${posicion(active.id)}.`,
    onDragOver: ({ over }) => (over ? `El ${nombre} está ahora sobre la posición ${posicion(over.id)}.` : undefined),
    onDragEnd: ({ over }) => (over ? `Soltó el ${nombre} en la posición ${posicion(over.id)}.` : `Soltó el ${nombre}.`),
    onDragCancel: () => `Se canceló. El ${nombre} volvió a su lugar.`,
  }

  function alSoltar({ active, over }) {
    if (!over || active.id === over.id) return
    const desde = elementos.findIndex((e) => e.id === active.id)
    const hasta = elementos.findIndex((e) => e.id === over.id)
    onOrdenar(arrayMove(elementos, desde, hasta))
  }

  return (
    <DndContext
      sensors={sensores}
      collisionDetection={closestCenter}
      onDragEnd={alSoltar}
      accessibility={{ announcements: anuncios, screenReaderInstructions: instrucciones }}
    >
      <SortableContext items={elementos.map((e) => e.id)} strategy={verticalListSortingStrategy}>
        <ul className="space-y-2">
          {elementos.map((elemento, indice) => (
            <Fila key={elemento.id} id={elemento.id} nombre={nombre}>
              {(asa) => children(elemento, asa, indice)}
            </Fila>
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  )
}

function Fila({ id, nombre, children }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })
  const estilo = { transform: CSS.Translate.toString(transform), transition }

  const asa = (
    <button
      type="button"
      {...attributes}
      {...listeners}
      aria-label={`Arrastrar para reordenar el ${nombre}`}
      title="Arrastrar para reordenar"
      className="grid size-8 shrink-0 cursor-grab touch-none place-items-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-600 active:cursor-grabbing"
    >
      <GripVertical className="size-4" aria-hidden="true" />
    </button>
  )

  return (
    <li ref={setNodeRef} style={estilo} className={isDragging ? 'relative z-10 rounded-xl shadow-lg ring-2 ring-secundario/40' : ''}>
      {children(asa)}
    </li>
  )
}
