import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

type ServiceManageShellProps = {
  title: string;
  description: string;
  children?: ReactNode;
};

export default function ServiceManageShell({
  title,
  description,
  children,
}: ServiceManageShellProps) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-1 text-sm font-medium text-slate-500 transition hover:text-brand-600"
        >
          ← 대시보드
        </button>

        <header className="mt-4 mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{title}</h1>
          <p className="mt-2 text-slate-600">{description}</p>
        </header>

        {children}
      </div>
    </div>
  );
}
