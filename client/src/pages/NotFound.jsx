import { Link } from 'react-router-dom';
import PageShell from '../components/PageShell';

export default function NotFound() {
  return (
    <PageShell>
      <div className="py-20 text-center"><p className="text-sm font-semibold text-brand-600">404</p><h1 className="mt-2 text-3xl font-extrabold">We couldn't find that page</h1><p className="muted mt-2">The link may be old, or the page may have moved.</p><Link to="/" className="btn btn-primary mt-6">Back to home</Link></div>
    </PageShell>
  );
}
