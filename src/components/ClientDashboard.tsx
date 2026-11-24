import { useEffect, useMemo, useRef, useState } from 'react';
import { MODULES } from '../data/course';
import { MIN_ATTENDANCE_REGISTER_LEARNERS } from '../lib/attendanceEvidence';
import { clientLearnerAttendanceStartDate, clientLearnerEnrolledForRegister, clientLearnerSigned } from '../lib/clientPortalAttendance';
import { UNIT_ACTIVITIES } from '../types';
import type { ClientAttendanceRegister, ClientDashboardData, ClientLearner } from '../lib/clientPortal';

type Detail = 'attendance' | 'progress' | null;

type DashboardUnit = NonNullable<ClientDashboardData['learners'][number]['progress']['units']>[string];

function unitCompletion(unit: DashboardUnit | undefined) {
  if (!unit) return 0;
  const activities = unit.activities ?? {};
  let done = UNIT_ACTIVITIES.filter(activity => activities[activity]).length;
  const formative = (unit.quiz?.attempts ?? 0) > 0 || Object.values(unit.quizzes ?? {}).some(item => (item.attempts ?? 0) > 0) || Object.values(unit.exercises ?? {}).some(item => (item.attempts ?? 0) > 0) || Object.keys(unit.logbook ?? {}).length > 0;
  if (formative && !activities['Formative Assessment']) done++;
  return done / UNIT_ACTIVITIES.length;
}

export function ClientDashboard({ data, cohort }: { data: ClientDashboardData | null; cohort: ClientLearner[] }) {
  const [detail, setDetail] = useState<Detail>(null);
  const [monthOpen, setMonthOpen] = useState(false);
  const monthMenu = useRef<HTMLDivElement>(null);
  const currentMonth = new Date();
  currentMonth.setDate(1);
  const monthKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  const [selectedMonth, setSelectedMonth] = useState(monthKey(currentMonth));
  const earliestStart = cohort.map(learner => learner.start_date).filter((date): date is string => !!date).sort()[0];
  const programmeMonths: string[] = [];
  const monthCursor = earliestStart ? new Date(`${earliestStart.slice(0, 7)}-01T00:00:00`) : new Date(currentMonth);
  while (monthCursor <= currentMonth && programmeMonths.length < 120) {
    programmeMonths.push(monthKey(monthCursor));
    monthCursor.setMonth(monthCursor.getMonth() + 1);
  }
  const monthOptions = [...new Set([monthKey(currentMonth), ...programmeMonths, ...(data?.attendance ?? []).map(register => register.date.slice(0, 7))])]
    .filter(key => key <= monthKey(currentMonth))
    .sort((a, b) => b.localeCompare(a))
    .map(key => ({
      key,
      label: new Date(`${key}-01T00:00:00`).toLocaleDateString(undefined, { month: 'long', year: 'numeric' }),
      registerCount: (data?.attendance ?? []).filter(register => register.date.startsWith(key) && register.signer_count >= MIN_ATTENDANCE_REGISTER_LEARNERS).length,
    }));
  const attendanceStartDates = useMemo(() => new Map(cohort.map(learner => [
    learner.learner_ref,
    clientLearnerAttendanceStartDate(learner, data?.attendance ?? []),
  ])), [cohort, data]);
  const isEnrolledForRegister = (register: ClientAttendanceRegister, learner: ClientLearner) =>
    clientLearnerEnrolledForRegister(register.date, learner, attendanceStartDates.get(learner.learner_ref) ?? learner.start_date);
  const monthLabel = monthOptions.find(option => option.key === selectedMonth)?.label ?? monthOptions[0].label;
  useEffect(() => {
    if (!monthOpen) return;
    const close = (event: MouseEvent) => { if (!monthMenu.current?.contains(event.target as Node)) setMonthOpen(false); };
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') setMonthOpen(false); };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', escape);
    return () => { document.removeEventListener('mousedown', close); document.removeEventListener('keydown', escape); };
  }, [monthOpen]);
  const registers = (data?.attendance ?? []).filter(register =>
    register.date.startsWith(selectedMonth) && register.signer_count >= MIN_ATTENDANCE_REGISTER_LEARNERS
  );
  const feedAvailable = data !== null;
  const attendanceRows = registers.flatMap(register => cohort
    .filter(learner => isEnrolledForRegister(register, learner))
    .map(learner => ({ register, learner, present: clientLearnerSigned(register, learner) })));
  const attendanceRate = attendanceRows.length ? attendanceRows.filter(row => row.present).length / attendanceRows.length : null;
  const learnerProgress = useMemo(() => cohort.map(learner => {
    const record = data?.learners.find(item => item.learner_ref === learner.learner_ref);
    const units = MODULES.flatMap(module => module.units);
    const completions = units.map(unit => unitCompletion(record?.progress.units?.[unit.us]));
    const actual = completions.length ? completions.reduce((sum, value) => sum + value, 0) / completions.length : 0;
    const start = learner.start_date ? new Date(`${learner.start_date}T00:00:00`) : null;
    const end = learner.end_date ? new Date(`${learner.end_date}T23:59:59`) : null;
    const now = new Date();
    const expected = start && end && end > start ? Math.max(0, Math.min(1, (now.getTime() - start.getTime()) / (end.getTime() - start.getTime()))) : 0;
    return { learner, actual, expected, onTrack: actual + .05 >= expected };
  }), [cohort, data]);
  const onTrack = learnerProgress.filter(item => item.onTrack).length;
  const onTrackRate = learnerProgress.length ? onTrack / learnerProgress.length : null;

  return <section className="client-dashboard" aria-label="Programme dashboard">
    <div className="client-dashboard-grid">
      <article className="client-dashboard-card client-chart-card">
        <span className="client-card-kicker">Attendance · {monthLabel}</span>
        <div className="client-month-switch" ref={monthMenu}><span>Month</span><button type="button" className="client-month-trigger" aria-haspopup="listbox" aria-expanded={monthOpen} onClick={() => setMonthOpen(open => !open)}><span>{monthLabel}</span><svg viewBox="0 0 20 20" aria-hidden="true"><path d="m5 7.5 5 5 5-5" /></svg></button>{monthOpen && <div className="client-month-menu" role="listbox" aria-label="Attendance month">{monthOptions.map(option => <button type="button" role="option" aria-selected={selectedMonth === option.key} key={option.key} onClick={() => { setSelectedMonth(option.key); setMonthOpen(false); }}><span><strong>{option.label}</strong><small>{option.registerCount ? `${option.registerCount} qualifying register${option.registerCount === 1 ? '' : 's'}` : 'No qualifying registers'}</small></span>{selectedMonth === option.key && <svg viewBox="0 0 20 20" aria-hidden="true"><path d="m4 10 4 4 8-8" /></svg>}</button>)}</div>}</div>
        <button type="button" className="client-donut" onClick={() => setDetail('attendance')} aria-haspopup="dialog" aria-label={`View ${monthLabel} absenteeism`} style={{ '--value': `${Math.round((attendanceRate ?? 0) * 100) * 3.6}deg` } as React.CSSProperties}><strong>{attendanceRate === null ? '—' : `${Math.round(attendanceRate * 100)}%`}</strong></button>
        <span className="client-card-title">{monthLabel} attendance</span>
        <small>{registers.length ? `${registers.length} register${registers.length === 1 ? '' : 's'} recorded` : feedAvailable ? `No registers recorded for ${monthLabel}` : 'Dashboard feed unavailable — apply the latest database migration'} · Select chart for absenteeism</small>
      </article>
      <article className="client-dashboard-card client-module-card">
        <span className="client-card-kicker">Module overview</span>
        <h2>Current learning position</h2>
        <div className="client-module-list">{MODULES.map(module => {
          const records = data?.learners ?? [];
          const averages = module.units.map(unit => records.length ? records.reduce((sum, record) => sum + unitCompletion(record.progress.units?.[unit.us]), 0) / records.length : 0);
          const current = averages.findIndex(value => value < 1);
          const position = current < 0 ? module.units.length : current + 1;
          const progress = averages.length ? averages.reduce((sum, value) => sum + value, 0) / averages.length : 0;
          return <div key={module.id}><div><strong>{module.name}</strong><span>Unit standard {position} of {module.units.length}</span></div><progress value={progress} max={1} aria-label={`${module.name} ${Math.round(progress * 100)}% complete`} /><small>{Math.round(progress * 100)}%</small></div>;
        })}</div>
      </article>
      <button type="button" className="client-dashboard-card client-chart-card client-progress-card" onClick={() => setDetail('progress')} aria-haspopup="dialog">
        <span className="client-card-kicker">Learner progress</span>
        <div className="client-split-chart"><span style={{ flex: onTrack || 0 }}>On track {onTrackRate === null ? '—' : `${Math.round(onTrackRate * 100)}%`}</span><span style={{ flex: learnerProgress.length - onTrack || 0 }}>Behind {onTrackRate === null ? '—' : `${Math.round((1 - onTrackRate) * 100)}%`}</span></div>
        <span className="client-card-title">Submission status</span>
        <small>Select to view learners in each group</small>
      </button>
    </div>
    {detail && <div className="client-dashboard-modal" role="dialog" aria-modal="true" aria-labelledby="client-detail-title"><div>
      <header><div><span className="client-card-kicker">Dashboard detail</span><h2 id="client-detail-title">{detail === 'attendance' ? `${monthLabel} absenteeism` : 'Learner submission progress'}</h2></div><button type="button" onClick={() => setDetail(null)}>Close</button></header>
      {detail === 'attendance' ? (registers.length ? <div className="client-table-wrap"><table><thead><tr><th>Learner</th>{registers.map(register => <th key={register.date}>{new Date(`${register.date}T00:00:00`).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}</th>)}<th>Attendance</th></tr></thead><tbody>{cohort.filter(learner => registers.some(register => isEnrolledForRegister(register, learner))).map(learner => { const eligible = registers.filter(register => isEnrolledForRegister(register, learner)); const attended = eligible.filter(register => clientLearnerSigned(register, learner)).length; return <tr key={learner.learner_ref}><td><strong>{learner.name}</strong></td>{registers.map(register => <td key={register.date}>{isEnrolledForRegister(register, learner) ? <span className={clientLearnerSigned(register, learner) ? 'client-status-present' : 'client-status-absent'}>{clientLearnerSigned(register, learner) ? 'Present' : 'Absent'}</span> : <span aria-label="Not enrolled">—</span>}</td>)}<td>{eligible.length ? `${Math.round(attended / eligible.length * 100)}%` : '—'}</td></tr>; })}</tbody></table></div> : <p>{feedAvailable ? `No attendance registers have been recorded for ${monthLabel}.` : 'The attendance feed is not available. Apply the latest Supabase migration, then refresh the portal.'}</p>) : <div className="client-progress-groups">{(['On track', 'Behind'] as const).map(group => { const grouped = learnerProgress.filter(item => item.onTrack === (group === 'On track')); return <section key={group}><h3>{group} <span>{grouped.length}</span></h3>{grouped.length ? grouped.map(item => <div key={item.learner.learner_ref}><strong>{item.learner.name}</strong><span>{Math.round(item.actual * 100)}% complete · {Math.round(item.expected * 100)}% expected</span></div>) : <p>No learners</p>}</section>; })}</div>}
    </div></div>}
  </section>;
}
