import { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { supabase } from '../lib/supabase';

const NAV = [
  { to: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
  { to: '/applications', label: 'Applications', icon: 'work_outline' },
  { to: '/profile', label: 'Profile', icon: 'person' },
];

export default function AppLayout() {
  const { user, signOut } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);

  // Pull the app-level profile row (name/avatar) created by the signup trigger.
  useEffect(() => {
    if (!user) return;
    let active = true;
    supabase
      .from('profiles')
      .select('name, email, avatar_url')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        if (active) setProfile(data);
      });
    return () => {
      active = false;
    };
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    toast.success('Signed out');
    navigate('/login', { replace: true });
  };

  const displayName =
    profile?.name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'there';
  const email = profile?.email || user?.email || '';
  const initials = displayName
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile backdrop */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-50 bg-on-surface/40 backdrop-blur-sm lg:hidden"
          onClick={() => setMenuOpen(false)}
        />
      )}

      {/* ── Sidebar ── */}
      <aside
        className={`fixed left-0 top-0 z-[60] flex h-full w-sidebar-width flex-col border-r border-outline-variant bg-surface-container py-6 transition-transform duration-300 lg:translate-x-0 ${
          menuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="mb-8 flex items-start justify-between px-6">
          <div>
            <h1 className="text-headline-md font-bold text-primary">JobTrack</h1>
            <p className="text-label-sm text-on-surface-variant">Career Manager</p>
          </div>
          <button
            onClick={() => setMenuOpen(false)}
            className="rounded-lg p-1 text-on-surface-variant hover:bg-surface-container-high lg:hidden"
            aria-label="Close menu"
          >
            <span className="material-symbols-outlined text-[22px]">close</span>
          </button>
        </div>

        <div className="mb-6 px-4">
          <button
            onClick={() => {
              setMenuOpen(false);
              navigate('/applications/new');
            }}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-label-md font-semibold text-on-primary shadow-sm transition-all hover:opacity-90 active:scale-95"
          >
            <span className="material-symbols-outlined text-[20px]">add</span>
            Add Application
          </button>
        </div>

        <nav className="flex-1 space-y-1">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setMenuOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 transition-all duration-200 ${
                  isActive
                    ? 'border-l-4 border-primary bg-surface-container-high text-primary'
                    : 'border-l-4 border-transparent text-on-surface-variant hover:bg-surface-container-high'
                }`
              }
            >
              <span className="material-symbols-outlined text-[22px]">
                {item.icon}
              </span>
              <span className="text-body-md">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="px-4">
          <button
            onClick={handleSignOut}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-error"
          >
            <span className="material-symbols-outlined text-[22px]">logout</span>
            <span className="text-body-md">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* ── Main column ── */}
      <div className="min-h-screen lg:ml-sidebar-width">
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between gap-3 border-b border-outline-variant bg-surface px-4 sm:px-stack-lg">
          <button
            onClick={() => setMenuOpen(true)}
            className="shrink-0 rounded-lg p-1 text-on-surface-variant transition-colors hover:text-primary lg:hidden"
            aria-label="Open menu"
          >
            <span className="material-symbols-outlined text-[26px]">menu</span>
          </button>

          <div className="relative min-w-0 flex-1 sm:max-w-md">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">
              search
            </span>
            <input
              type="text"
              placeholder="Search applications..."
              className="w-full rounded-full border-none bg-surface-container-low py-2 pl-10 pr-4 text-body-md text-on-surface transition-all focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="flex items-center gap-3 sm:gap-6">
            <button
              onClick={toggleTheme}
              className="text-on-surface-variant transition-colors hover:text-primary"
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              title={isDark ? 'Light mode' : 'Dark mode'}
            >
              <span className="material-symbols-outlined">
                {isDark ? 'light_mode' : 'dark_mode'}
              </span>
            </button>
            <div className="flex items-center gap-3">
              <div className="hidden text-right sm:block">
                <p className="text-label-md font-bold leading-tight text-on-surface">
                  {displayName}
                </p>
                <p className="max-w-[180px] truncate text-label-sm leading-tight text-on-surface-variant">
                  {email}
                </p>
              </div>
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-primary/10 bg-primary text-label-md font-bold text-on-primary">
                {initials}
              </div>
            </div>
          </div>
        </header>

        <Outlet context={{ profile, displayName }} />
      </div>
    </div>
  );
}
