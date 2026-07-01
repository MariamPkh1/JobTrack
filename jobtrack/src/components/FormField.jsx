import { forwardRef } from 'react';

/** Labelled input with a leading icon, matching the design's input spec
 *  (white bg, 1px outline, 10px radius, blue focus halo). */
const FormField = forwardRef(function FormField(
  { label, icon, error, trailing, id, ...inputProps },
  ref
) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-2 block text-label-md font-medium text-on-surface"
      >
        {label}
      </label>
      <div className="relative">
        {icon && (
          <span className="material-symbols-outlined pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[19px] leading-none text-outline [font-variation-settings:'FILL'_0,'wght'_300,'GRAD'_0,'opsz'_20]">
            {icon}
          </span>
        )}
        <input
          ref={ref}
          id={id}
          className={`w-full rounded-xl border bg-surface-container-lowest py-3 text-body-md text-on-surface placeholder:text-on-surface-variant/60 transition-all focus:outline-none focus:ring-4 ${
            icon ? 'pl-11' : 'pl-4'
          } ${trailing ? 'pr-11' : 'pr-4'} ${
            error
              ? 'border-error focus:border-error focus:ring-error/15'
              : 'border-outline-variant focus:border-primary focus:ring-primary/15'
          }`}
          {...inputProps}
        />
        {trailing && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2">
            {trailing}
          </div>
        )}
      </div>
      {error && (
        <p className="mt-1.5 text-label-sm font-normal text-error">{error}</p>
      )}
    </div>
  );
});

export default FormField;
