import { useEffect, useMemo, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import LoadingScreen from '../components/LoadingScreen';

const STATUS_META = [
  { key: 'Applied', color: '#0058be', label: 'Applied' },
  { key: 'Interview', color: '#006c49', label: 'Interview' },
  { key: 'Offer', color: '#924700', label: 'Offer' },
  { key: 'Rejected', color: '#ba1a1a', label: 'Rejected' },
];

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function StatCard({ icon, iconClass, label, value, delta, deltaClass }) {
  return (
    <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-stack-md shadow-sm transition-all duration-300 hover:-translate-y-1">
      <div className="mb-4 flex items-start justify-between">
        <div className={`rounded-lg p-2 ${iconClass}`}>
          <span className="material-symbols-outlined">{icon}</span>
        </div>
        {delta && (
          <span className={`text-label-sm font-bold ${deltaClass}`}>{delta}</span>
        )}
      </div>
      <p className="text-label-md text-on-surface-variant">{label}</p>
      <h3 className="mt-1 text-display-lg text-on-surface">{value}</h3>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const { displayName } = useOutletContext();
  const axisTick = isDark ? '#c4c6d0' : '#424754';
  const tooltipStyle = {
    borderRadius: 10,
    border: `1px solid ${isDark ? '#43474e' : '#c2c6d6'}`,
    background: isDark ? '#1d2024' : '#ffffff',
    color: isDark ? '#e2e2e9' : '#151c27',
    fontSize: 12,
  };
  const [apps, setApps] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(new Date().getFullYear());

  useEffect(() => {
    if (!user) return;
    let active = true;
    (async () => {
      const [appsRes, intRes] = await Promise.all([
        supabase
          .from('applications')
          .select('id, company_name, position, status, applied_date')
          .order('applied_date', { ascending: false }),
        supabase
          .from('interviews')
          .select('id, date, type, outcome, application_id, applications(company_name)')
          .order('date', { ascending: true }),
      ]);
      if (!active) return;
      setApps(appsRes.data ?? []);
      setInterviews(intRes.data ?? []);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [user]);

  const stats = useMemo(() => {
    const total = apps.length;
    const counts = STATUS_META.reduce((acc, s) => {
      acc[s.key] = apps.filter((a) => a.status === s.key).length;
      return acc;
    }, {});
    const responded = total - (counts.Applied || 0);
    const responseRate = total ? Math.round((responded / total) * 100) : 0;
    return {
      total,
      counts,
      interviews: counts.Interview || 0,
      offers: counts.Offer || 0,
      responseRate,
    };
  }, [apps]);

  const monthlyData = useMemo(() => {
    const buckets = MONTHS.map((m) => ({ month: m, count: 0 }));
    apps.forEach((a) => {
      if (!a.applied_date) return;
      const d = new Date(a.applied_date);
      if (d.getFullYear() === year) buckets[d.getMonth()].count += 1;
    });
    return buckets.slice(0, 6);
  }, [apps, year]);

  const donutData = useMemo(
    () =>
      STATUS_META.map((s) => ({
        name: s.label,
        value: stats.counts[s.key] || 0,
        color: s.color,
      })).filter((d) => d.value > 0),
    [stats]
  );

  const upcoming = useMemo(
    () =>
      interviews
        .filter((i) => new Date(i.date) >= new Date())
        .slice(0, 3),
    [interviews]
  );

  if (loading) {
    return <LoadingScreen inline />;
  }

  return (
    // Dashboard reads denser than the auth pages by design — render its content
    // at ~90% so the big stat numbers and cards feel less heavy. Scoped here
    // (not global) so the login page keeps the size you liked.
    <div className="p-stack-lg" style={{ zoom: 0.9 }}>
      {/* Greeting */}
      <div className="mb-stack-lg">
        <h2 className="text-display-lg text-on-surface">
          Welcome{stats.total > 0 ? ' back' : ''}, {displayName.split(' ')[0]}
        </h2>
        <p className="text-body-lg text-on-surface-variant">
          {stats.total > 0
            ? "Here's what's happening with your job search today."
            : "Let's get your job search organized."}
        </p>
      </div>

      {stats.total === 0 ? (
        <Onboarding />
      ) : (
      <>
      {/* Stat cards */}
      <div className="mb-stack-lg grid grid-cols-1 gap-gutter md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon="description"
          iconClass="bg-primary-container/10 text-primary"
          label="Total Applications"
          value={stats.total}
          delta={stats.total > 0 ? `${stats.total}` : null}
          deltaClass="text-secondary"
        />
        <StatCard
          icon="event_available"
          iconClass="bg-secondary-container/20 text-secondary"
          label="Active Interviews"
          value={stats.interviews}
          delta={stats.interviews > 0 ? 'Active' : null}
          deltaClass="text-secondary"
        />
        <StatCard
          icon="workspace_premium"
          iconClass="bg-tertiary-fixed/20 text-tertiary"
          label="Offers Received"
          value={stats.offers}
          delta={stats.offers > 0 ? 'New' : null}
          deltaClass="text-secondary"
        />
        <StatCard
          icon="insights"
          iconClass="bg-error-container/20 text-error"
          label="Response Rate"
          value={`${stats.responseRate}%`}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-gutter lg:grid-cols-3">
        {/* Bar chart */}
        <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-stack-lg shadow-sm lg:col-span-2">
          <div className="mb-8 flex items-center justify-between">
            <h4 className="text-headline-sm text-on-surface">Applications by Month</h4>
            <div className="flex gap-2">
              {[year - 1, year].map((y) => (
                <button
                  key={y}
                  onClick={() => setYear(y)}
                  className={`rounded-full px-3 py-1 text-label-sm transition-colors ${
                    year === y
                      ? 'bg-surface-container font-bold text-primary'
                      : 'text-on-surface-variant hover:bg-surface-container'
                  }`}
                >
                  {y}
                </button>
              ))}
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData} margin={{ top: 8, right: 0, left: -20, bottom: 0 }}>
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: axisTick, fontSize: 12 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: axisTick, fontSize: 12 }}
                  allowDecimals={false}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(0,88,190,0.06)' }}
                  contentStyle={tooltipStyle}
                />
                <Bar dataKey="count" fill="#0058be" radius={[8, 8, 0, 0]} maxBarSize={48} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Donut chart */}
        <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-stack-lg shadow-sm">
          <h4 className="text-headline-sm text-on-surface">Status Breakdown</h4>
          <p className="mt-1 mb-6 text-label-sm text-on-surface-variant">
            Current stage distribution
          </p>

          <div className="relative mx-auto h-48 w-48">
            {donutData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={donutData}
                    dataKey="value"
                    innerRadius={58}
                    outerRadius={80}
                    paddingAngle={2}
                    stroke="none"
                  >
                    {donutData.map((d) => (
                      <Cell key={d.name} fill={d.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center rounded-full border-8 border-surface-container-high text-center text-label-sm text-on-surface-variant">
                No data yet
              </div>
            )}
          </div>

          <div className="mt-6 space-y-3">
            {STATUS_META.map((s) => (
              <div key={s.key} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: s.color }}
                  />
                  <span className="text-label-md text-on-surface-variant">
                    {s.label}
                  </span>
                </div>
                <span className="font-bold text-on-surface">
                  {stats.counts[s.key] || 0}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Upcoming tasks */}
      <div className="mt-stack-lg">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h4 className="text-headline-sm text-on-surface">Upcoming Tasks</h4>
            <p className="text-body-md text-on-surface-variant">
              Your next scheduled interviews.
            </p>
          </div>
        </div>

        {upcoming.length > 0 ? (
          <div className="grid grid-cols-1 gap-stack-md md:grid-cols-2 lg:grid-cols-3">
            {upcoming.map((i) => (
              <div
                key={i.id}
                className="glass-card group flex cursor-pointer items-center gap-4 rounded-xl p-4 transition-all hover:shadow-md"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-surface-container text-primary shadow-sm">
                  <span className="material-symbols-outlined">event</span>
                </div>
                <div className="flex-1">
                  <h5 className="text-label-md font-bold text-on-surface">
                    {i.type} Interview
                  </h5>
                  <p className="text-label-sm text-on-surface-variant">
                    {i.applications?.company_name || 'Company'} •{' '}
                    {new Date(i.date).toLocaleString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
                <span className="material-symbols-outlined text-secondary opacity-0 transition-opacity group-hover:opacity-100">
                  arrow_forward_ios
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-outline-variant bg-surface-container-lowest p-8 text-center">
            <span className="material-symbols-outlined mb-2 text-4xl text-on-surface-variant">
              event_busy
            </span>
            <p className="text-body-md text-on-surface-variant">
              No upcoming interviews scheduled.
            </p>
          </div>
        )}
      </div>
      </>
      )}
    </div>
  );
}

function Onboarding() {
  const steps = [
    {
      icon: 'work',
      title: 'Add applications',
      body: 'Log a company, role, and status to start tracking your pipeline.',
    },
    {
      icon: 'description',
      title: 'Upload a resume',
      body: 'Attach resume versions and link the right one to each application.',
    },
    {
      icon: 'event',
      title: 'Track interviews',
      body: 'Add interview stages and keep every follow-up in one place.',
    },
  ];

  return (
    <div className="mx-auto max-w-3xl">
      {/* Primary empty state */}
      <div className="flex flex-col items-center rounded-xl border border-outline-variant bg-surface-container-lowest px-6 py-12 text-center shadow-sm">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <span className="material-symbols-outlined text-[34px]">rocket_launch</span>
        </div>
        <h3 className="mt-5 text-headline-sm text-on-surface">
          Let's add your first application
        </h3>
        <p className="mt-2 max-w-md text-body-md text-on-surface-variant">
          It only takes a few seconds. Your dashboard fills up with stats, charts,
          and upcoming interviews as you go.
        </p>
        <Link
          to="/applications/new"
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-label-md font-semibold text-on-primary shadow-sm transition-all hover:opacity-90 active:scale-95"
        >
          <span className="material-symbols-outlined text-[20px]">add</span>
          Add your first application
        </Link>
      </div>

      {/* Steps */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {steps.map((s, i) => (
          <div
            key={s.title}
            className="rounded-xl border border-outline-variant bg-surface-container-lowest p-5 shadow-sm"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <span className="material-symbols-outlined text-[22px]">{s.icon}</span>
            </div>
            <p className="mt-3 text-label-md font-semibold text-on-surface">
              {i + 1}. {s.title}
            </p>
            <p className="mt-1 text-body-md text-on-surface-variant">{s.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
