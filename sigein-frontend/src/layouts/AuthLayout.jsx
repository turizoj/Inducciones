import { CircleCheck } from 'lucide-react'
import Logo from '../components/Logo'

const beneficios = [
  'Programas de inducción por módulos',
  'Evaluaciones y seguimiento en tiempo real',
  'Certificados verificables',
]

// Pantalla dividida: panel corporativo a la izquierda y formulario a la derecha (wireframe 19.2.1)
export default function AuthLayout({ children }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <aside className="hidden flex-col justify-between bg-linear-to-br from-primario to-secundario p-12 text-white lg:flex">
        <Logo claro />
        <div>
          <h2 className="text-3xl font-bold leading-tight">
            Bienvenido a tu proceso
            <br />
            de inducción
          </h2>
          <p className="mt-3 max-w-md text-white/80">
            Conoce la empresa, aprende a tu ritmo y obtén tu certificado desde cualquier lugar.
          </p>
          <ul className="mt-8 space-y-3">
            {beneficios.map((texto) => (
              <li key={texto} className="flex items-center gap-2 text-white/90">
                <CircleCheck className="size-5 text-white/70" aria-hidden="true" />
                {texto}
              </li>
            ))}
          </ul>
        </div>
        <p className="text-sm text-white/60">Sistema Web de Gestión de Inducciones Empresariales</p>
      </aside>

      <main className="flex items-center justify-center px-4 py-12 sm:px-8">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <Logo />
          </div>
          {children}
        </div>
      </main>
    </div>
  )
}
