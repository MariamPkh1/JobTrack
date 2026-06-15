/** Temporary stub for routes not yet built (Applications, Profile). */
export default function Placeholder({ title, icon = 'construction' }) {
  return (
    <div className="flex h-[70vh] flex-col items-center justify-center p-stack-lg text-center">
      <span className="material-symbols-outlined mb-4 text-6xl text-outline">
        {icon}
      </span>
      <h2 className="text-headline-md text-on-surface">{title}</h2>
      <p className="mt-2 max-w-sm text-body-md text-on-surface-variant">
        This section is coming next. The dashboard and authentication flow are
        ready to use.
      </p>
    </div>
  );
}
