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
  const [teamSearch, setTeamSearch] = useState('');
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
  const presentCount = attendanceRows.filter(row => row.present).length;
  const absentCount = attendanceRows.length - presentCount;
  const attendanceRate = attendanceRows.length ? presentCount / attendanceRows.length : null;
  const attendancePercentage = attendanceRate === null ? null : Math.round(attendanceRate * 100);
  const attendanceRingCircumference = 2 * Math.PI * 28;
  const attendanceRingOffset = attendanceRingCircumference * (1 - (attendanceRate ?? 0));
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
  const onTrackPercentage = onTrackRate === null ? null : Math.round(onTrackRate * 100);
  const progressRingOffset = attendanceRingCircumference * (1 - (onTrackRate ?? 0));
  const visibleTeam = cohort.filter(learner => `${learner.name} ${learner.programme}`.toLowerCase().includes(teamSearch.trim().toLowerCase()));
  const qualifications = [...new Set(visibleTeam.map(learner => learner.programme || 'Qualification not assigned'))].sort();

  return <section className="client-dashboard" aria-label="Programme dashboard">
    <section className="client-team-dashboard" aria-label="Team">
      <header><div><h2>Team</h2></div></header>
      <div className="client-team-summary">
        <div><svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="13" cy="8" r="5"/><path d="M4 28v-5a9 9 0 0 1 13-8M20 23l7-7 2 2-7 7-4 1Z"/></svg><p><span>Learners <b title="Published cohort members">?</b></span><strong>{cohort.length}</strong></p></div>
        <div><svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="12" cy="8" r="5"/><path d="M3 28v-5a9 9 0 0 1 15-7M20 17h9v8h-9z"/></svg><p><span>On track</span><strong>{onTrack}</strong></p></div>
        <div><svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="12" cy="8" r="5"/><path d="M3 28v-5a9 9 0 0 1 15-7M24 18v10M19 23h10"/></svg><p><span>Behind <b title="Learners behind expected programme progress">?</b></span><strong>{learnerProgress.length - onTrack}</strong></p></div>
        <div><svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="10" cy="9" r="4"/><circle cx="22" cy="9" r="4"/><path d="M2 27v-4a8 8 0 0 1 14-5M30 27v-4a8 8 0 0 0-14-5"/></svg><p><span>Members</span><strong>{cohort.length}</strong></p></div>
      </div>
      <label className="client-team-search"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/></svg><input type="search" placeholder="Search by name or programme ..." value={teamSearch} onChange={event => setTeamSearch(event.target.value)} /></label>
      <div className="client-team-qualifications">{qualifications.map(qualification => { const members = visibleTeam.filter(learner => (learner.programme || 'Qualification not assigned') === qualification); return <details key={qualification}><summary><span><small>Qualification</small><strong>{qualification}</strong></span><span>{members.length} learner{members.length === 1 ? '' : 's'} <svg viewBox="0 0 20 20" aria-hidden="true"><path d="m5 7.5 5 5 5-5" /></svg></span></summary><div className="client-team-table-wrap"><table><thead><tr><th>Member</th><th>Role</th><th>Progress</th></tr></thead><tbody>{members.map(learner => { const progress = learnerProgress.find(item => item.learner.learner_ref === learner.learner_ref); return <tr key={learner.learner_ref}><td><span className="client-team-avatar">{learner.name.split(/\s+/).slice(0,2).map(part => part[0]).join('').toUpperCase()}</span><span><strong>{learner.name}</strong><small>{learner.learner_ref}</small></span></td><td>Learner</td><td><button type="button" onClick={() => setDetail('progress')}>↗ {progress ? `${Math.round(progress.actual * 100)}%` : 'View'}</button></td></tr>; })}</tbody></table></div></details>; })}{!visibleTeam.length && <p className="client-team-empty">No members match your search.</p>}</div>
    </section>
    <header className="client-dashboard-heading"><div><h2>Programme dashboard</h2><p>Attendance, learner results and module progress</p></div><span>{cohort.length} member{cohort.length === 1 ? '' : 's'}</span></header>
    <div className="client-dashboard-grid">
      <article className="client-dashboard-card client-chart-card client-attendance-card">
        <div className="client-tile-heading"><span>Team attendance</span><span className="client-tile-info" title="Attendance across qualifying registers">i</span></div>
        <div className="client-month-switch" ref={monthMenu}><span>Month</span><button type="button" className="client-month-trigger" aria-haspopup="listbox" aria-expanded={monthOpen} onClick={() => setMonthOpen(open => !open)}><span>{monthLabel}</span><svg viewBox="0 0 20 20" aria-hidden="true"><path d="m5 7.5 5 5 5-5" /></svg></button>{monthOpen && <div className="client-month-menu" role="listbox" aria-label="Attendance month">{monthOptions.map(option => <button type="button" role="option" aria-selected={selectedMonth === option.key} key={option.key} onClick={() => { setSelectedMonth(option.key); setMonthOpen(false); }}><span><strong>{option.label}</strong><small>{option.registerCount ? `${option.registerCount} qualifying register${option.registerCount === 1 ? '' : 's'}` : 'No qualifying registers'}</small></span>{selectedMonth === option.key && <svg viewBox="0 0 20 20" aria-hidden="true"><path d="m4 10 4 4 8-8" /></svg>}</button>)}</div>}</div>
        <div className="client-tile-metric"><button type="button" className="client-donut" onClick={() => setDetail('attendance')} aria-haspopup="dialog" aria-label={`View ${monthLabel} absenteeism`}><svg viewBox="0 0 64 64" aria-hidden="true"><circle className="client-donut-track" cx="32" cy="32" r="28" /><circle className="client-donut-value" cx="32" cy="32" r="28" strokeDasharray={attendanceRingCircumference} strokeDashoffset={attendanceRingOffset} /></svg><strong>{attendancePercentage === null ? '\u2014' : `${attendancePercentage}%`}</strong></button><div className="client-tile-legend"><span><i className="is-complete" />Present <strong>{attendancePercentage === null ? '—' : `${attendancePercentage}%`}</strong></span><span><i className="is-behind" />Absent <strong>{attendancePercentage === null ? '—' : `${100 - attendancePercentage}%`}</strong></span><span><i className="is-neutral" />Registers <strong>{registers.length}</strong></span></div></div>
        <button type="button" className="client-tile-link" onClick={() => setDetail('attendance')}>{registers.length ? `View ${monthLabel} absenteeism` : feedAvailable ? `No registers recorded for ${monthLabel}` : 'Dashboard feed unavailable'}</button>
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
      <article className="client-dashboard-card client-chart-card client-progress-card">
        <div className="client-tile-heading"><span>Learner results</span><span className="client-tile-info" title="Learners on track against programme progress">i</span></div>
        <div className="client-tile-metric"><button type="button" className="client-donut client-progress-donut" onClick={() => setDetail('progress')} aria-haspopup="dialog" aria-label="View learner submission progress"><svg viewBox="0 0 64 64" aria-hidden="true"><circle className="client-donut-track" cx="32" cy="32" r="28" /><circle className="client-donut-value" cx="32" cy="32" r="28" strokeDasharray={attendanceRingCircumference} strokeDashoffset={progressRingOffset} /></svg><strong>{onTrackPercentage === null ? '—' : `${onTrackPercentage}%`}</strong></button><div className="client-tile-legend"><span><i className="is-complete" />On track <strong>{onTrack}</strong></span><span><i className="is-behind" />Behind <strong>{learnerProgress.length - onTrack}</strong></span><span><i className="is-neutral" />Learners <strong>{learnerProgress.length}</strong></span></div></div>
        <button type="button" className="client-tile-link" onClick={() => setDetail('progress')}>View submission status</button>
      </article>
    </div>
    {detail && <div className="client-dashboard-modal" role="dialog" aria-modal="true" aria-labelledby="client-detail-title"><div>
      <header><div><span className="client-card-kicker">{detail === 'attendance' ? 'Attendance register' : 'Dashboard detail'}</span><h2 id="client-detail-title">{detail === 'attendance' ? `${monthLabel} attendance register` : 'Learner submission progress'}</h2></div><button type="button" onClick={() => setDetail(null)}>Close</button></header>
      {detail === 'attendance' ? (registers.length ? <>
        <div className="client-attendance-summary" aria-label="Attendance summary">
          <div><span>Attendance rate</span><strong>{attendanceRate === null ? '—' : `${(attendanceRate * 100).toFixed(2)}%`}</strong></div>
          <div><span>Absent</span><strong>{absentCount}</strong></div>
        </div>
        <div className="client-table-wrap"><table><thead><tr><th>Learner</th>{registers.map(register => <th key={register.date}>{new Date(`${register.date}T00:00:00`).toLocaleDateString(undefined, { day: '2-digit', month: 'short' })}</th>)}<th>Rate</th></tr></thead><tbody>{cohort.filter(learner => registers.some(register => isEnrolledForRegister(register, learner))).map(learner => {
          const eligible = registers.filter(register => isEnrolledForRegister(register, learner));
          const attended = eligible.filter(register => clientLearnerSigned(register, learner)).length;
          const rate = eligible.length ? attended / eligible.length : null;
          return <tr key={learner.learner_ref}>
            <td><strong>{learner.name}</strong></td>
            {registers.map(register => {
              const enrolled = isEnrolledForRegister(register, learner);
              const present = enrolled && clientLearnerSigned(register, learner);
              return <td key={register.date}>{enrolled ? <span className={present ? 'client-status-present' : 'client-status-absent'}>{present ? 'Present' : 'Absent'}</span> : <span aria-label="Not enrolled">—</span>}</td>;
            })}
            <td className={rate !== null && rate < 1 ? 'client-attendance-rate-low' : undefined}>{rate === null ? '—' : `${Math.round(rate * 100)}%`}</td>
          </tr>;
        })}</tbody></table></div>
      </> : <p>{feedAvailable ? `No attendance registers have been recorded for ${monthLabel}.` : 'The attendance feed is not available. Apply the latest Supabase migration, then refresh the portal.'}</p>) : <div className="client-progress-groups">{(['On track', 'Behind'] as const).map(group => { const grouped = learnerProgress.filter(item => item.onTrack === (group === 'On track')); return <section key={group}><h3>{group} <span>{grouped.length}</span></h3>{grouped.length ? grouped.map(item => <div key={item.learner.learner_ref}><strong>{item.learner.name}</strong><span>{Math.round(item.actual * 100)}% complete · {Math.round(item.expected * 100)}% expected</span></div>) : <p>No learners</p>}</section>; })}</div>}
    </div></div>}
  </section>;
}
