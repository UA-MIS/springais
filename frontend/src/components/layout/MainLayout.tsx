import { Outlet, useLocation } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';

export default function MainLayout() {
  const location = useLocation();
  const variant = location.pathname.startsWith('/success-patterns') ? 'dark' : 'default';

  return (
    <div className="relative min-h-screen">
      {variant === 'dark' && (
        <>
          <div className="pointer-events-none absolute inset-0 bg-zinc-950" />
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(24,24,27,0.70)_0%,rgba(9,9,11,0.45)_40%,rgba(0,0,0,0.70)_80%,rgba(0,0,0,1)_100%)]" />
          <div className="pointer-events-none absolute inset-0 backdrop-blur-[1px]" />
        </>
      )}

      <div className="relative z-10 min-h-screen flex flex-col">
        <Header variant={variant} />
        <div className="flex flex-1">
          <Sidebar variant={variant} />
          <main className={variant === 'dark' ? 'flex-1 p-6 bg-transparent' : 'flex-1 p-6 bg-white'}>
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
