import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { STATUSES, STATUS_BADGE, PRIORITIES, PRIORITY_BADGE } from '../lib/statusConfig';

const PAGE_SIZE = 8;

// Deterministic accent for the company "logo" tile.
const LOGO_COLORS = ['#151c27', '#0058be', '#006c49', '#924700', '#ba1a1a', '#2170e4'];
const logoColor = (name) => {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return LOGO_COLORS[h % LOGO_COLORS.length];
};

export default function Applications() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [apps, setApps] = useState([]);
  const [nextEvent, setNextEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [sort, setSort] = useState('recent');
  const [page, setPage] = useState(1);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    if (!user) return;
    let active = true;
    (async () => {
      const [appsRes, intRes] = await Promise.all([
        supabase
          .from('applications')
          .select('id, company_name, position, status, priority, tags, applied_date, location, job_url, resume_id')
          .order('applied_date', { ascending: false }),
        supabase
          .from('interviews')
          .select('id, date, type, applications(company_name)')
          .gte('date', new Date().toISOString())
          .order('date', { ascending: true })
          .limit(1),
      ]);
      if (!active) return;
      setApps(appsRes.data ?? []);
      setNextEvent(intRes.data?.[0] ?? null);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [user]);

  const stats = useMemo(() => {
    const count = (s) => apps.filter((a) => a.status === s).length;
    return { total: apps.length, interviews: count('Interview'), offers: count('Offer') };
  }, [apps]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = apps.filter((a) => {
      const matchesQ =
        !q ||
        a.company_name.toLowerCase().includes(q) ||
        a.position.toLowerCase().includes(q) ||
        (a.tags || []).some((t) => t.toLowerCase().includes(q));
      const matchesStatus = filter === 'All' || a.status === filter;
      const matchesPriority = priorityFilter === 'All' || a.priority === priorityFilter;
      return matchesQ && matchesStatus && matchesPriority;
    });
    list = [...list].sort((a, b) => {
      if (sort === 'company') return a.company_name.localeCompare(b.company_name);
      const da = new Date(a.applied_date).getTime();
      const db = new Date(b.applied_date).getTime();
      return sort === 'oldest' ? da - db : db - da;
    });
    return list;
  }, [apps, query, filter, priorityFilter, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const rangeStart = filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(page * PAGE_SIZE, filtered.length);

  const handleDelete = async (app) => {
    if (!window.confirm(`Delete the ${app.company_name} application?`)) return;
    setDeletingId(app.id);
    const { error } = await supabase.from('applications').delete().eq('id', app.id);
    setDeletingId(null);
    if (error) return toast.error(error.message);
    setApps((prev) => prev.filter((a) => a.id !== app.id));
    toast.success('Application deleted');
  };

  return (
    <div className="p-stack-lg" style={{ zoom: 1 }}>
      {/* Title */}
      <div className="mb-stack-md flex items-center justify-between gap-4">
        <h2 className="text-headline-md text-on-surface">Applications</h2>
        <Link
          to="/applications/new"
          className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-label-md font-semibold text-on-primary shadow-sm transition-all hover:opacity-90 active:scale-95"
        >
          <span className="material-symbols-outlined text-[20px]">add</span>
          Add Application
        </Link>
      </div>

      {/* Stat cards */}
      <div className="mb-stack-md grid grid-cols-1 gap-gutter sm:grid-cols-3">
        <StatCard icon="description" tint="bg-primary/10 text-primary" label="Total Apps" value={stats.total} />
        <StatCard icon="forum" tint="bg-secondary/10 text-secondary" label="Interviews" value={stats.interviews} />
        <StatCard icon="workspace_premium" tint="bg-tertiary/10 text-tertiary" label="Offers" value={stats.offers} />
      </div>

      {/* Controls */}
      <div className="mb-stack-md flex flex-wrap items-center gap-3 rounded-xl border border-outline-variant bg-surface-container-lowest p-3 shadow-sm">
        <div className="relative min-w-[220px] flex-1">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[20px] text-on-surface-variant">
            search
          </span>
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Search company or position..."
            className="w-full rounded-full border border-outline-variant bg-surface-container-low py-2 pl-10 pr-4 text-body-md transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
          />
        </div>
        <Select
          value={filter}
          onChange={(v) => {
            setFilter(v);
            setPage(1);
          }}
          label="Status"
          options={['All', ...STATUSES]}
        />
        <Select
          value={priorityFilter}
          onChange={(v) => {
            setPriorityFilter(v);
            setPage(1);
          }}
          label="Priority"
          options={['All', ...PRIORITIES]}
        />
        <Select
          value={sort}
          onChange={(v) => {
            setSort(v);
            setPage(1);
          }}
          label="Sort"
          options={[
            { value: 'recent', label: 'Recent' },
            { value: 'oldest', label: 'Oldest' },
            { value: 'company', label: 'Company' },
          ]}
        />
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex h-[40vh] items-center justify-center">
          <span className="app-spinner" role="status" aria-label="Loading" />
        </div>
      ) : apps.length === 0 ? (
        <EmptyState
          icon="work_outline"
          title="No applications yet"
          subtitle="Start tracking your job search by adding your first application."
          action={
            <Link
              to="/applications/new"
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-label-md font-semibold text-on-primary shadow-sm hover:opacity-90"
            >
              <span className="material-symbols-outlined text-[20px]">add</span>
              Add Application
            </Link>
          }
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest shadow-sm">
          <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left">
            <thead>
              <tr className="bg-surface-container-low text-label-sm uppercase tracking-wider text-on-surface-variant">
                <th className="px-6 py-3 font-semibold">Company</th>
                <th className="px-6 py-3 font-semibold">Position</th>
                <th className="px-6 py-3 font-semibold">Status</th>
                <th className="hidden px-6 py-3 font-semibold md:table-cell">Priority</th>
                <th className="hidden px-6 py-3 font-semibold sm:table-cell">Applied Date</th>
                <th className="hidden px-6 py-3 font-semibold lg:table-cell">Resume</th>
                <th className="px-6 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pageItems.map((app) => (
                <tr
                  key={app.id}
                  onClick={() => navigate(`/applications/${app.id}`)}
                  className="group cursor-pointer border-t border-outline-variant/50 transition-colors hover:bg-surface-container-low"
                >
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-3">
                      <span
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-label-md font-bold text-white"
                        style={{ backgroundColor: logoColor(app.company_name) }}
                      >
                        {app.company_name.charAt(0).toUpperCase()}
                      </span>
                      <span className="font-bold text-on-surface">{app.company_name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-3 text-body-md text-on-surface-variant">
                    <span className="block">{app.position}</span>
                    {app.tags?.length > 0 && (
                      <span className="mt-1 flex flex-wrap gap-1">
                        {app.tags.slice(0, 3).map((t) => (
                          <span
                            key={t}
                            className="rounded-full bg-surface-container-high px-2 py-0.5 text-label-sm font-medium text-on-surface-variant"
                          >
                            {t}
                          </span>
                        ))}
                        {app.tags.length > 3 && (
                          <span className="text-label-sm text-on-surface-variant">
                            +{app.tags.length - 3}
                          </span>
                        )}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-3">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-label-sm font-semibold ${STATUS_BADGE[app.status]}`}
                    >
                      {app.status}
                    </span>
                  </td>
                  <td className="hidden px-6 py-3 md:table-cell">
                    {app.priority ? (
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-label-sm font-semibold ${PRIORITY_BADGE[app.priority]}`}
                      >
                        {app.priority}
                      </span>
                    ) : (
                      <span className="text-on-surface-variant">—</span>
                    )}
                  </td>
                  <td className="hidden px-6 py-3 text-body-md text-on-surface-variant sm:table-cell">
                    {app.applied_date
                      ? new Date(app.applied_date).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })
                      : '—'}
                  </td>
                  <td className="hidden px-6 py-3 lg:table-cell">
                    {app.resume_id ? (
                      <span className="material-symbols-outlined text-[20px] text-primary">
                        description
                      </span>
                    ) : (
                      <span className="text-on-surface-variant">—</span>
                    )}
                  </td>
                  <td className="px-6 py-3">
                    <div className="flex items-center justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      <Link
                        to={`/applications/${app.id}/edit`}
                        onClick={(e) => e.stopPropagation()}
                        className="rounded-lg p-2 text-on-surface-variant hover:bg-surface-container-high hover:text-primary"
                        title="Edit"
                      >
                        <span className="material-symbols-outlined text-[20px]">edit</span>
                      </Link>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(app);
                        }}
                        disabled={deletingId === app.id}
                        className="rounded-lg p-2 text-on-surface-variant hover:bg-error/10 hover:text-error disabled:opacity-50"
                        title="Delete"
                      >
                        <span className="material-symbols-outlined text-[20px]">delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>

          {/* Pagination */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-outline-variant px-6 py-3">
            <p className="text-label-md text-on-surface-variant">
              {filtered.length === 0
                ? 'No matching applications'
                : `Showing ${rangeStart} to ${rangeEnd} of ${filtered.length} applications`}
            </p>
            <div className="flex items-center gap-1">
              <PageBtn
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                icon="chevron_left"
              />
              {pageList(page, totalPages).map((p, i) =>
                p === '…' ? (
                  <span key={`e${i}`} className="px-2 text-on-surface-variant">
                    …
                  </span>
                ) : (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`h-8 min-w-8 rounded-lg px-2 text-label-md transition-colors ${
                      p === page
                        ? 'bg-primary font-bold text-on-primary'
                        : 'text-on-surface-variant hover:bg-surface-container-high'
                    }`}
                  >
                    {p}
                  </button>
                )
              )}
              <PageBtn
                disabled={page === totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                icon="chevron_right"
              />
            </div>
          </div>
        </div>
      )}

      {/* Upcoming events */}
      <div className="mt-stack-md">
        <div className="rounded-xl border border-outline-variant bg-surface-container-high p-6 shadow-sm">
          <h4 className="text-headline-sm text-on-surface">Upcoming Events</h4>
          {nextEvent ? (
            <div className="mt-4 flex items-center gap-4">
              <div className="flex h-14 w-14 flex-col items-center justify-center rounded-lg bg-surface-container-lowest text-primary shadow-sm">
                <span className="text-label-sm font-bold uppercase">
                  {new Date(nextEvent.date).toLocaleString(undefined, { month: 'short' })}
                </span>
                <span className="text-headline-sm leading-none">
                  {new Date(nextEvent.date).getDate()}
                </span>
              </div>
              <div>
                <p className="font-bold text-on-surface">
                  {nextEvent.type} @ {nextEvent.applications?.company_name || 'Company'}
                </p>
                <p className="text-label-md text-on-surface-variant">
                  {new Date(nextEvent.date).toLocaleString(undefined, {
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
          ) : (
            <p className="mt-4 text-body-md text-on-surface-variant">
              No upcoming interviews scheduled.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, tint, label, value }) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-outline-variant bg-surface-container-lowest p-stack-md shadow-sm">
      <div className={`rounded-lg p-3 ${tint}`}>
        <span className="material-symbols-outlined">{icon}</span>
      </div>
      <div>
        <p className="text-label-md text-on-surface-variant">{label}</p>
        <p className="text-headline-md text-on-surface">{value}</p>
      </div>
    </div>
  );
}

function Select({ value, onChange, label, options }) {
  const opts = options.map((o) => (typeof o === 'string' ? { value: o, label: o } : o));
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none rounded-lg border border-outline-variant bg-surface-container-lowest py-2 pl-3 pr-9 text-body-md text-on-surface shadow-sm transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
      >
        {opts.map((o) => (
          <option key={o.value} value={o.value}>
            {label}: {o.label}
          </option>
        ))}
      </select>
      <span className="material-symbols-outlined pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[20px] text-on-surface-variant">
        expand_more
      </span>
    </div>
  );
}

function PageBtn({ disabled, onClick, icon }) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className="flex h-8 w-8 items-center justify-center rounded-lg border border-outline-variant text-on-surface-variant transition-colors hover:bg-surface-container-high disabled:opacity-40 disabled:hover:bg-transparent"
    >
      <span className="material-symbols-outlined text-[20px]">{icon}</span>
    </button>
  );
}

function pageList(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = [1];
  if (current > 3) pages.push('…');
  for (let p = Math.max(2, current - 1); p <= Math.min(total - 1, current + 1); p++) {
    pages.push(p);
  }
  if (current < total - 2) pages.push('…');
  pages.push(total);
  return pages;
}

function EmptyState({ icon, title, subtitle, action }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-outline-variant bg-surface-container-lowest p-16 text-center">
      <span className="material-symbols-outlined mb-3 text-5xl text-outline">{icon}</span>
      <h3 className="text-headline-sm text-on-surface">{title}</h3>
      <p className="mt-1 max-w-sm text-body-md text-on-surface-variant">{subtitle}</p>
      {action}
    </div>
  );
}
