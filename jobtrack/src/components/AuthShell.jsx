/** Split-screen wrapper for the auth pages: marketing hero (left) + form (right). */
export default function AuthShell({ children }) {
  return (
    <div className="min-h-screen w-full bg-background lg:grid lg:grid-cols-2">
      {/* ── Left: brand / marketing panel ── */}
      <div className="relative hidden flex-col items-center justify-center overflow-hidden bg-surface-container-low px-12 lg:flex">
        <div className="absolute -left-24 -top-24 h-80 w-80 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-24 -right-10 h-80 w-80 rounded-full bg-secondary/10 blur-3xl" />

        <div className="relative z-10 max-w-md text-center">
          <span className="material-symbols-outlined mb-8 text-7xl text-primary-container">
            work
          </span>
          <h1 className="text-display-lg leading-tight text-on-surface">
            Track every application,{' '}
            <span className="text-primary">land your dream job.</span>
          </h1>
          <p className="mt-6 text-body-lg text-on-surface-variant">
            The professional command center for your career journey. Organize
            interviews, manage follow-ups, and visualize your progress in one
            powerful dashboard.
          </p>

          <div className="mx-auto mt-12 flex h-56 w-56 items-center justify-center rounded-full bg-primary/5">
            <span className="material-symbols-outlined text-8xl text-primary">
              work
            </span>
          </div>
        </div>
      </div>

      {/* ── Right: form panel ── */}
      <div className="flex min-h-screen flex-col items-center justify-center px-6 py-12 lg:px-12">
        <div className="w-full max-w-md">{children}</div>
        <footer className="mt-8 flex gap-6 text-label-sm text-on-surface-variant">
          <a href="#" className="hover:text-primary">
            Privacy Policy
          </a>
          <a href="#" className="hover:text-primary">
            Terms of Service
          </a>
        </footer>
      </div>
    </div>
  );
}
