import { EditorContent, useEditor, useEditorState } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Bold, Heading2, Heading3, Italic, Link2, List, ListOrdered, Quote, Redo2, Underline, Undo2 } from 'lucide-react'

// Editor de texto enriquecido para los contenidos de tipo texto (RF-10).
// El HTML que produce se limpia otra vez en el backend antes de guardarlo.
export default function EditorTexto({ valor, onCambiar, error, etiqueta = 'Texto' }) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        link: { openOnClick: false, autolink: true, defaultProtocol: 'https' },
      }),
    ],
    content: valor,
    onUpdate: ({ editor }) => onCambiar(editor.isEmpty ? '' : editor.getHTML()),
    editorProps: {
      attributes: {
        class: 'contenido-html min-h-48 px-3 py-2.5 text-sm outline-none',
        'aria-label': etiqueta,
        'aria-multiline': 'true',
      },
    },
  })

  // Qué botones están activos según dónde está el cursor
  const activo = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      bold: e.isActive('bold'),
      italic: e.isActive('italic'),
      underline: e.isActive('underline'),
      h2: e.isActive('heading', { level: 2 }),
      h3: e.isActive('heading', { level: 3 }),
      bulletList: e.isActive('bulletList'),
      orderedList: e.isActive('orderedList'),
      blockquote: e.isActive('blockquote'),
      link: e.isActive('link'),
    }),
  })

  function enlace() {
    if (activo.link) return editor.chain().focus().unsetLink().run()
    const url = window.prompt('Escriba la dirección del enlace (https://…)')
    if (url) editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }

  const botones = [
    { icono: Bold, texto: 'Negrita', activo: activo.bold, accion: () => editor.chain().focus().toggleBold().run() },
    { icono: Italic, texto: 'Cursiva', activo: activo.italic, accion: () => editor.chain().focus().toggleItalic().run() },
    { icono: Underline, texto: 'Subrayado', activo: activo.underline, accion: () => editor.chain().focus().toggleUnderline().run() },
    { separador: true },
    { icono: Heading2, texto: 'Título', activo: activo.h2, accion: () => editor.chain().focus().toggleHeading({ level: 2 }).run() },
    { icono: Heading3, texto: 'Subtítulo', activo: activo.h3, accion: () => editor.chain().focus().toggleHeading({ level: 3 }).run() },
    { icono: List, texto: 'Lista con viñetas', activo: activo.bulletList, accion: () => editor.chain().focus().toggleBulletList().run() },
    { icono: ListOrdered, texto: 'Lista numerada', activo: activo.orderedList, accion: () => editor.chain().focus().toggleOrderedList().run() },
    { icono: Quote, texto: 'Cita', activo: activo.blockquote, accion: () => editor.chain().focus().toggleBlockquote().run() },
    { icono: Link2, texto: activo.link ? 'Quitar enlace' : 'Enlace', activo: activo.link, accion: enlace },
    { separador: true },
    { icono: Undo2, texto: 'Deshacer', accion: () => editor.chain().focus().undo().run() },
    { icono: Redo2, texto: 'Rehacer', accion: () => editor.chain().focus().redo().run() },
  ]

  return (
    <div>
      <p className="mb-1.5 text-sm font-medium text-slate-700">{etiqueta}</p>
      <div
        className={`overflow-hidden rounded-lg border bg-white focus-within:border-secundario focus-within:ring-2 focus-within:ring-secundario/20 ${error ? 'border-error' : 'border-slate-300'}`}
      >
        <div className="flex flex-wrap items-center gap-0.5 border-b border-slate-200 bg-slate-50 p-1" role="toolbar" aria-label="Formato del texto">
          {botones.map((b, i) =>
            b.separador ? (
              <span key={i} className="mx-1 h-5 w-px bg-slate-200" aria-hidden="true" />
            ) : (
              <button
                key={b.texto}
                type="button"
                onClick={b.accion}
                title={b.texto}
                aria-label={b.texto}
                aria-pressed={b.activo ?? undefined}
                className={`grid size-8 place-items-center rounded-md transition-colors ${b.activo ? 'bg-primario text-white' : 'text-slate-600 hover:bg-slate-200'}`}
              >
                <b.icono className="size-4" aria-hidden="true" />
              </button>
            ),
          )}
        </div>
        <EditorContent editor={editor} />
      </div>
      {error && <p className="mt-1 text-xs text-error">{error}</p>}
    </div>
  )
}
