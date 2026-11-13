import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <section className="grid place-items-center gap-2 py-16 text-center">
      <p className="font-display text-6xl font-bold text-primary-400">404</p>
      <h1 className="text-xl font-semibold">Página no encontrada</h1>
      <p className="text-neutral-400">La página que buscas no existe.</p>
      <Link to="/" className="mt-4 font-medium text-primary-300 hover:underline">
        Volver al inicio
      </Link>
    </section>
  );
}
