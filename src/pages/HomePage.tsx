import {
  ArrowRight,
  CalendarDays,
  Check,
  ChevronDown,
  CircleDot,
  Goal,
  Layers,
  ListOrdered,
  Medal,
  Network,
  QrCode,
  Repeat,
  Share2,
  Shuffle,
  Smartphone,
  Table2,
  Trophy,
  Volleyball,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import { Link, useOutletContext } from 'react-router-dom';
import { LiveBadge } from '../components/LiveBadge.tsx';
import { Button } from '../components/ui/Button.tsx';
import { Card } from '../components/ui/Card.tsx';
import type { AppLayoutContext } from '../layouts/AppLayout.tsx';

// Mockup: informative landing page. The platform is for any sport; the examples
// (hero preview, sample texts) use table tennis. All content is fixed marketing text.

const SPORTS: { name: string; icon: LucideIcon; detail: string }[] = [
  { name: 'Tenis de mesa', icon: Table2, detail: 'Sets al mejor de 5 o 7, singles y dobles' },
  { name: 'Fútbol', icon: Goal, detail: 'Empates y tabla 3 / 1 / 0' },
  { name: 'Baloncesto', icon: CircleDot, detail: 'Puntos por cuarto y prórroga' },
  { name: 'Voleibol', icon: Volleyball, detail: 'Sets con puntuación 3/0 y 2/1' },
];

const FEATURES: { title: string; text: string; icon: LucideIcon; tone: string }[] = [
  {
    title: 'Sorteo con cabezas de serie',
    text: 'Reparte a los participantes en grupos según su ranking para que los mejores no se crucen antes de tiempo.',
    icon: Shuffle,
    tone: 'bg-primary-500/15 text-primary-300',
  },
  {
    title: 'Calendario por canchas o mesas',
    text: 'Asigna cada partido a una cancha o mesa y horario. Ve cuáles están libres y cuáles en juego.',
    icon: CalendarDays,
    tone: 'bg-tertiary-500/15 text-tertiary-400',
  },
  {
    title: 'Resultados en vivo',
    text: 'Carga goles, puntos o el marcador juego a juego (11-8, 9-11…) desde el celular. Tablas y llaves se actualizan solas.',
    icon: Zap,
    tone: 'bg-secondary-500/15 text-secondary-400',
  },
  {
    title: 'Comparte con un link',
    text: 'Cada torneo tiene su página pública con enlace y código QR para la sede. Nadie necesita cuenta.',
    icon: Share2,
    tone: 'bg-primary-500/15 text-primary-300',
  },
];

const STEPS = [
  {
    title: 'Crea el torneo',
    text: 'Elige deporte, formato y fechas. Por ejemplo: tenis de mesa individual con 8 mesas.',
  },
  {
    title: 'Inscribe y sortea',
    text: 'Añade jugadores, parejas o equipos y sortea los grupos con cabezas de serie.',
  },
  {
    title: 'Juega y comparte',
    text: 'Carga los resultados y comparte el link para que todos sigan el torneo en vivo.',
  },
];

const FORMATS: { name: string; text: string; icon: LucideIcon; soon?: boolean }[] = [
  {
    name: 'Grupos + eliminación',
    text: 'Fase de grupos y los mejores pasan al cuadro principal, como en un open de tenis de mesa.',
    icon: ListOrdered,
  },
  {
    name: 'Eliminación directa',
    text: 'Cuadro de 16, 32 o 64 con pases directos (byes) automáticos.',
    icon: Network,
  },
  {
    name: 'Todos contra todos',
    text: 'Liga donde cada participante enfrenta a todos los demás.',
    icon: Repeat,
  },
  {
    name: 'Doble eliminación y suizo',
    text: 'Formatos avanzados para torneos competitivos.',
    icon: Layers,
    soon: true,
  },
];

const FAQS = [
  {
    q: '¿Qué deportes puedo organizar?',
    a: 'Cualquiera: tenis de mesa, fútbol, baloncesto, voleibol, pádel y más. Cada deporte trae su propia forma de puntuar.',
  },
  {
    q: '¿Sirve para jugadores individuales, dobles o equipos?',
    a: 'Sí. Por ejemplo, en tenis de mesa puedes crear torneos individuales, de dobles (incluidos mixtos) o por equipos.',
  },
  {
    q: '¿Cómo se calculan las tablas?',
    a: 'Según las reglas de cada deporte. En tenis de mesa: 2 puntos por victoria y 1 por derrota, con desempate por enfrentamiento directo, sets y puntos. En fútbol: 3 / 1 / 0.',
  },
  {
    q: '¿Los espectadores necesitan una cuenta?',
    a: 'No. Cualquiera con el enlace puede ver los grupos, las llaves y los resultados en vivo.',
  },
];

const GROUP = [
  { player: 'Carlos Silva', won: 3, sets: '9-2', pts: 6, dot: 'bg-primary-400' },
  { player: 'Marcos Ruiz', won: 2, sets: '7-4', pts: 5, dot: 'bg-secondary-500' },
  { player: 'Andrés Peña', won: 1, sets: '4-7', pts: 4, dot: 'bg-tertiary-500' },
  { player: 'Diego Rojas', won: 0, sets: '1-9', pts: 3, dot: 'bg-neutral-400' },
];

const LIVE_GAMES = [
  ['11', '8'],
  ['9', '11'],
  ['11', '6'],
  ['7', '5'],
];

function SectionHeading({
  eyebrow,
  title,
  text,
}: {
  eyebrow: string;
  title: string;
  text?: string;
}) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <p className="font-display text-sm font-semibold tracking-wider text-primary-300 uppercase">
        {eyebrow}
      </p>
      <h2 className="mt-2 text-3xl font-semibold sm:text-4xl">{title}</h2>
      {text && <p className="mt-3 text-neutral-400">{text}</p>}
    </div>
  );
}

/** Decorative product preview for the hero: a group table and a live match. */
function HeroPreview() {
  return (
    <div className="relative" aria-hidden="true">
      <div className="absolute -inset-6 rounded-[2rem] bg-primary-600/20 blur-3xl" />
      <Card className="relative flex flex-col gap-4 p-0">
        <div className="flex items-center justify-between border-b border-neutral-800 px-5 py-4">
          <div>
            <p className="font-display font-semibold text-white">Open Nacional 2026</p>
            <p className="text-xs text-neutral-400">Individual masculino · Grupo A</p>
          </div>
          <LiveBadge />
        </div>

        <table className="mx-5 text-sm">
          <thead>
            <tr className="text-left text-xs text-neutral-500">
              <th className="pb-2 font-medium">#</th>
              <th className="pb-2 font-medium">Jugador</th>
              <th className="pb-2 text-right font-medium">G</th>
              <th className="pb-2 text-right font-medium">Sets</th>
              <th className="pb-2 text-right font-medium">Pts</th>
            </tr>
          </thead>
          <tbody>
            {GROUP.map((row, index) => (
              <tr key={row.player} className="border-t border-neutral-800">
                <td className="py-2 text-neutral-500">{index + 1}</td>
                <td className="py-2">
                  <span className="flex items-center gap-2 text-neutral-100">
                    <span className={`size-2 rounded-full ${row.dot}`} />
                    {row.player}
                  </span>
                </td>
                <td className="py-2 text-right text-neutral-400 tabular-nums">{row.won}</td>
                <td className="py-2 text-right text-neutral-400 tabular-nums">{row.sets}</td>
                <td className="py-2 text-right font-semibold text-white tabular-nums">{row.pts}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="m-5 mt-0 rounded-xl bg-neutral-850 px-4 py-3">
          <div className="flex items-center justify-between text-xs text-neutral-400">
            <span className="flex items-center gap-1.5">
              <Table2 className="size-3.5" />
              Mesa 3
            </span>
            <span className="text-secondary-400">4.º juego</span>
          </div>
          <div className="mt-2 grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1 text-sm">
            <span className="text-white">Carlos Silva</span>
            <span className="flex gap-3 font-display tabular-nums">
              {LIVE_GAMES.map(([home], i) => (
                <span key={i} className="w-5 text-center text-neutral-200">
                  {home}
                </span>
              ))}
              <span className="w-5 text-center font-bold text-white">2</span>
            </span>
            <span className="text-neutral-300">Marcos Ruiz</span>
            <span className="flex gap-3 font-display tabular-nums">
              {LIVE_GAMES.map(([, away], i) => (
                <span key={i} className="w-5 text-center text-neutral-400">
                  {away}
                </span>
              ))}
              <span className="w-5 text-center font-bold text-neutral-400">1</span>
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
}

export function HomePage() {
  const { openCreateTournament } = useOutletContext<AppLayoutContext>();

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-neutral-800">
        <div className="absolute inset-x-0 top-0 h-96 bg-linear-to-b from-primary-950/70 to-transparent" />
        <div className="page-container relative grid items-center gap-12 py-16 lg:grid-cols-2 lg:py-24 2xl:gap-20">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-neutral-800 bg-neutral-900 px-3 py-1 text-xs text-neutral-300">
              <span className="size-1.5 rounded-full bg-secondary-500" aria-hidden="true" />
              Tenis de mesa · Fútbol · Baloncesto · Voleibol y más
            </p>
            <h1 className="mt-5 text-4xl leading-tight font-bold sm:text-5xl 2xl:text-6xl">
              Organiza tu torneo: <span className="text-primary-300">grupos</span>, llaves y{' '}
              <span className="text-secondary-400">resultados en vivo</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg text-neutral-400">
              Del sorteo a la final en un solo lugar, para cualquier deporte. Inscribe a los
              participantes, sortea los grupos, asigna canchas o mesas, carga resultados desde el
              celular y comparte todo con un enlace.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button onClick={openCreateTournament} className="h-11 px-5 text-base">
                Crear mi torneo
                <ArrowRight className="size-4" aria-hidden="true" />
              </Button>
              <Link
                to="/mis-torneos"
                className="inline-flex h-11 items-center rounded-lg border border-neutral-700 px-5 font-display font-medium text-neutral-100 hover:bg-neutral-800"
              >
                Ver mis torneos
              </Link>
            </div>
            <p className="mt-6 text-sm text-neutral-500">
              Para clubes, ligas, colegios, federaciones y torneos abiertos.
            </p>
          </div>

          <HeroPreview />
        </div>
      </section>

      {/* Sports */}
      <section aria-label="Deportes" className="border-b border-neutral-800 bg-neutral-900/50">
        <ul className="page-container grid grid-cols-2 gap-px lg:grid-cols-4">
          {SPORTS.map(({ name, icon: Icon, detail }) => (
            <li key={name} className="flex items-center gap-3 py-6">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-neutral-800 text-neutral-200">
                <Icon className="size-5" aria-hidden="true" />
              </span>
              <div>
                <p className="font-display font-semibold text-white">{name}</p>
                <p className="text-xs text-neutral-400">{detail}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* Features */}
      <section className="page-container py-20">
        <SectionHeading
          eyebrow="Funciones"
          title="Todo lo que necesita tu torneo"
          text="Olvídate de las planillas: la plataforma calcula grupos, desempates y cruces por ti."
        />
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map(({ title, text, icon: Icon, tone }) => (
            <Card key={title} className="flex flex-col gap-3">
              <span className={`grid size-10 place-items-center rounded-xl ${tone}`}>
                <Icon className="size-5" aria-hidden="true" />
              </span>
              <h3 className="font-semibold">{title}</h3>
              <p className="text-sm text-neutral-400">{text}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="border-y border-neutral-800 bg-neutral-900/50">
        <div className="page-container py-20">
          <SectionHeading eyebrow="Cómo funciona" title="Tu torneo listo en tres pasos" />
          <ol className="mt-12 grid gap-6 md:grid-cols-3">
            {STEPS.map((step, index) => (
              <li key={step.title} className="flex gap-4">
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary-600 font-display font-bold text-white">
                  {index + 1}
                </span>
                <div>
                  <h3 className="font-semibold">{step.title}</h3>
                  <p className="mt-1 text-sm text-neutral-400">{step.text}</p>
                </div>
              </li>
            ))}
          </ol>
          <div className="mt-12 flex flex-wrap justify-center gap-6 text-sm text-neutral-400">
            <span className="flex items-center gap-2">
              <Smartphone className="size-4 text-secondary-400" aria-hidden="true" />
              Resultados desde el celular
            </span>
            <span className="flex items-center gap-2">
              <QrCode className="size-4 text-secondary-400" aria-hidden="true" />
              Código QR para la sede
            </span>
            <span className="flex items-center gap-2">
              <Medal className="size-4 text-secondary-400" aria-hidden="true" />
              Reglas de puntuación por deporte
            </span>
          </div>
        </div>
      </section>

      {/* Formats */}
      <section className="page-container py-20">
        <SectionHeading
          eyebrow="Formatos"
          title="El formato que tu torneo necesita"
          text="Combina fases y deja que el sistema arme los cruces y desempates."
        />
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FORMATS.map(({ name, text, icon: Icon, soon }) => (
            <Card key={name} className={`flex flex-col gap-3 ${soon ? 'border-dashed' : ''}`}>
              <div className="flex items-center justify-between">
                <Icon className="size-6 text-primary-300" aria-hidden="true" />
                {soon && (
                  <span className="rounded-full bg-tertiary-500/15 px-2 py-0.5 text-xs font-medium text-tertiary-400">
                    Próximamente
                  </span>
                )}
              </div>
              <h3 className="font-semibold">{name}</h3>
              <p className="text-sm text-neutral-400">{text}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t border-neutral-800">
        <div className="mx-auto max-w-3xl px-4 py-20 sm:px-6">
          <SectionHeading eyebrow="Preguntas frecuentes" title="¿Tienes dudas?" />
          <div className="mt-10 flex flex-col gap-3">
            {FAQS.map(({ q, a }) => (
              <details
                key={q}
                className="group rounded-xl border border-neutral-800 bg-neutral-900 px-5 py-4"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-display font-medium text-white">
                  {q}
                  <ChevronDown
                    className="size-5 shrink-0 text-neutral-500 transition-transform group-open:rotate-180"
                    aria-hidden="true"
                  />
                </summary>
                <p className="mt-3 text-sm text-neutral-400">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="page-container pb-20">
        <div className="rounded-3xl bg-primary-600 px-6 py-14 text-center 2xl:py-20">
          <h2 className="text-3xl font-semibold text-white sm:text-4xl">
            Grupos, llaves y resultados en vivo en un solo lugar
          </h2>
          <ul className="mt-5 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-primary-100">
            <li className="flex items-center gap-1.5">
              <Check className="size-4" aria-hidden="true" />
              Gratis para empezar
            </li>
            <li className="flex items-center gap-1.5">
              <Check className="size-4" aria-hidden="true" />
              Listo en menos de 2 minutos
            </li>
          </ul>
          <Button
            variant="soft"
            onClick={openCreateTournament}
            className="mt-8 h-11 px-6 text-base"
          >
            Crear mi torneo
          </Button>
        </div>
      </section>

      <footer className="border-t border-neutral-800">
        <div className="page-container flex flex-wrap items-center justify-between gap-4 py-8 text-sm text-neutral-500">
          <span className="flex items-center gap-2 font-display text-neutral-300">
            <Trophy className="size-4 text-primary-400" aria-hidden="true" />
            Tournament System
          </span>
          <span>© 2026 Tournament System</span>
        </div>
      </footer>
    </>
  );
}
