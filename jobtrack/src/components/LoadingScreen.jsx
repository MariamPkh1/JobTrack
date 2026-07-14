/** Centered loading spinner used while data or the auth session resolves.
 *  Uses a pure-CSS spinner (see `.app-spinner` in index.css) so it never flashes
 *  the icon-font ligature text before the font loads.
 *
 *  - default: fills the viewport (for the app-level / route auth check)
 *  - `inline`: fills ~60vh (for in-page data loads) */
export default function LoadingScreen({ inline = false }) {
  return (
    <div
      className={`flex ${inline ? 'h-[60vh]' : 'min-h-screen'} items-center justify-center bg-background`}
    >
      <span className="app-spinner" role="status" aria-label="Loading" />
    </div>
  );
}
