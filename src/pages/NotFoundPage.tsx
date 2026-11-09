import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <section className="text-center">
      <h1 className="text-3xl font-bold">404</h1>
      <p className="mt-2 text-slate-600">La página que buscas no existe.</p>
      <Link to="/" className="mt-4 inline-block text-blue-600 hover:underline">
        Volver al inicio
      </Link>
    </section>
  );
}
