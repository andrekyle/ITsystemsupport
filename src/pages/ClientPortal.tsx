import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { TENANT, TENANT_ID } from '../lib/tenant';
import { CLIENT_CATEGORIES, downloadClientDocument, portalError, type ClientAccount, type ClientDashboardData, type ClientDocument, type ClientLearner } from '../lib/clientPortal';
import { ClientDashboard } from '../components/ClientDashboard';
import { ClientAccountPage } from '../components/ClientAccountPage';
import { PasswordInput } from '../components/PasswordInput';
import type { Profile } from '../types';
import { ReportsPage } from './Reports';
import './client-portal.css';
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

const INDUCTION_CHECKLIST_ITEMS = [
  'Information Sharing Consent',
  'Anti-Bribery Letter',
  'Registration form',
  'Affidavit',
  'Fixed Term Contract',
  'EEA1',
  'Code of ethics',
  'Bank confirmation letter',
  'CV',
  'Qualifications',
  'Identity Document',
  'SARS document',
  'Proof of disability',
];
type ChecklistAnswer = 'yes' | 'no';
type ChecklistMarks = Record<string, Record<string, Record<ChecklistAnswer, boolean>>>;

export function ClientPortal() {
  const [session, setSession] = useState<Session | null>(null);
  const [account, setAccount] = useState<ClientAccount | null>(null);
  const [providerPreview, setProviderPreview] = useState(false);
  const [learners, setLearners] = useState<ClientLearner[]>([]);
  const [documents, setDocuments] = useState<ClientDocument[]>([]);
  const [dashboard, setDashboard] = useState<ClientDashboardData | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(!!supabase);
  const [busy, setBusy] = useState(false);
  const [recovery, setRecovery] = useState(new URLSearchParams(window.location.search).get("setup") === "1");
  const [category, setCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [viewer, setViewer] = useState<{ document: ClientDocument; url: string } | null>(null);
  const [portalTab, setPortalTab] = useState('dashboard');
  const [selectedLearner, setSelectedLearner] = useState<string | null>(null);
  const [checklistMarks, setChecklistMarks] = useState<ChecklistMarks>({});
  useEffect(() => {
    if (portalTab !== 'cohort') setSelectedLearner(null);
  }, [portalTab]);
  const request = useRef(0);
  const assistantRoot = useRef<Root | null>(null);
  const assistantTab = useRef<HTMLButtonElement | null>(null);
  const assistantPanel = useRef<HTMLElement | null>(null);
  const assistantProfile = useMemo<Profile>(() => ({
    id: session?.user.id ?? `provider-preview-${TENANT_ID}`,
    name: account?.display_name || session?.user.email || 'Provider administrator',
    role: 'Admin',
    createdAt: session?.user.created_at || new Date().toISOString(),
    cloudUserId: session?.user.id,
  }), [session?.user.id, session?.user.email, session?.user.created_at, account?.display_name]);
  useEffect(() => {
    if (!supabase) return;
    const sb = supabase;
    let active = true;
    const { data } = sb.auth.onAuthStateChange((event, value) => {
      if (!active) return;
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN' && new URLSearchParams(window.location.hash.slice(1)).get('type') === 'invite') setRecovery(true);
      setSession(value); setLoading(false);
    });
    void sb.auth.getSession().then(({ data }) => { if (active) { setSession(data.session); setLoading(false); } });
    return () => { active = false; request.current++; data.subscription.unsubscribe(); };
  }, []);
  async function load() {
    if (!supabase || !session) return;
    const revision = ++request.current;
    setLoading(true); setError(''); setAccount(null); setProviderPreview(false); setLearners([]); setDocuments([]); setDashboard(null);
    try {
      const own = await supabase.from('client_portal_accounts').select('user_id,display_name,email,tenant_id,enabled').eq('user_id', session.user.id).maybeSingle();
      if (own.error) throw new Error(portalError(own.error));
      let portalAccount = own.data;
      let preview = false;
      if (!portalAccount) {
        const [admin, tenant, client] = await Promise.all([supabase.rpc('is_admin'), supabase.rpc('current_tenant'), supabase.rpc('is_client_portal')]);
        if (!admin.error && !tenant.error && !client.error && admin.data === true && tenant.data === TENANT_ID && client.data === false) {
          preview = true;
          portalAccount = { user_id: session.user.id, tenant_id: TENANT_ID, enabled: true, display_name: 'Provider administrator', email: session.user.email || '' };
        }
      }
      if (!portalAccount || portalAccount.tenant_id !== TENANT_ID || !portalAccount.enabled) throw new Error(`You are signed in, but this account has no active ${TENANT.name} client invitation. Sign out and use your invited client email, or contact your programme administrator.`);
      const [cohort, files, dashboardResult] = await Promise.all([
        supabase.from('client_portal_learners').select('id,learner_ref,name,programme,status,start_date,end_date').eq('tenant_id', TENANT_ID).order('name'),
        supabase.from('client_portal_documents').select('id,title,category,filename,storage_path,file_size,created_at,published').eq('tenant_id', TENANT_ID).eq('published', true).order('created_at', { ascending: false }),
        supabase.rpc('client_portal_dashboard', { target_tenant: TENANT_ID }),
      ]);
      if (cohort.error || files.error) throw new Error(portalError(cohort.error || files.error));
      if (revision !== request.current) return;
      setAccount(portalAccount); setProviderPreview(preview); setLearners(cohort.data ?? []); setDocuments(files.data ?? []);
      if (!dashboardResult.error) setDashboard(dashboardResult.data as ClientDashboardData);
    } catch (failure) { if (revision === request.current) setError(failure instanceof Error ? failure.message : 'Could not load the portal.'); }
    finally { if (revision === request.current) setLoading(false); }
  }
  useEffect(() => { if (session) void load(); else { request.current++; setAccount(null); setLearners([]); setDocuments([]); setDashboard(null); } }, [session?.user.id]);
  useEffect(() => {
    if (!supabase || !session || !account || portalTab !== 'dashboard') return;
    const sb = supabase;
    let active = true;
    const refreshDashboard = async () => {
      const result = await sb.rpc('client_portal_dashboard', { target_tenant: TENANT_ID });
      if (active && !result.error) setDashboard(result.data as ClientDashboardData);
    };
    const refreshWhenVisible = () => { if (document.visibilityState === 'visible') void refreshDashboard(); };
    document.addEventListener('visibilitychange', refreshWhenVisible);
    window.addEventListener('focus', refreshWhenVisible);
    return () => {
      active = false;
      document.removeEventListener('visibilitychange', refreshWhenVisible);
      window.removeEventListener('focus', refreshWhenVisible);
    };
  }, [session?.user.id, account?.user_id, portalTab]);
  async function signIn(event: FormEvent) {
    event.preventDefault(); if (!supabase || busy) return;
    setBusy(true); setError(''); setNotice('');
    try {
      if (recovery) {
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw error;
        setRecovery(false); setPassword(''); window.history.replaceState(null, '', window.location.pathname); setNotice('Password updated.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw new Error('Sign-in failed. Check your email and password.');
        setPassword('');
      }
    } catch (failure) { setError(failure instanceof Error ? failure.message : 'Could not sign in.'); }
    finally { setBusy(false); }
  }
  async function reset() {
    if (!supabase || !email.trim() || busy) { setError('Enter your email address first.'); return; }
    setBusy(true); setError('');
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${window.location.origin}/clients/${TENANT_ID}?setup=1` });
      if (error) throw error;
      setNotice('If this email has an account, you will receive a password reset link.');
    } catch { setError('The reset request could not be sent. Please retry.'); }
    finally { setBusy(false); }
  }
  async function signOut() { request.current++; setAccount(null); setDocuments([]); setLearners([]); setDashboard(null); const result = await supabase?.auth.signOut(); if (result?.error) setError('Could not sign out. Please retry.'); }
  async function openDocument(document: ClientDocument) {
    if (!supabase) return;
    const { data, error } = await supabase.storage.from('client-evidence').download(document.storage_path);
    if (error || !data) { setError('This document could not be opened. It may no longer be published.'); return; }
    if (viewer) URL.revokeObjectURL(viewer.url);
    setViewer({ document, url: URL.createObjectURL(data) });
  }
  function openChecklist(learner: ClientLearner) {
    if (viewer) URL.revokeObjectURL(viewer.url);
    setViewer(null);
    setSelectedLearner(learner.learner_ref);
  }
  function updateChecklistMark(learnerRef: string, item: string, answer: ChecklistAnswer, checked: boolean) {
    setChecklistMarks(current => {
      const learnerMarks = current[learnerRef] ?? {};
      const itemMarks = learnerMarks[item] ?? { yes: false, no: false };
      return {
        ...current,
        [learnerRef]: {
          ...learnerMarks,
          [item]: { ...itemMarks, [answer]: checked },
        },
      };
    });
  }
  useEffect(() => {
    const links = Array.from(window.document.querySelectorAll<HTMLElement>('.client-documents li > div:first-child'));
    const handlers = links.map(link => {
      const handler = () => {
        const filename = link.querySelector('small')?.textContent?.split('·')[1]?.trim();
        const document = documents.find(item => item.filename === filename);
        if (document) void openDocument(document);
      };
      link.style.cursor = 'pointer';
      link.addEventListener('click', handler);
      return [link, handler] as const;
    });
    return () => handlers.forEach(([link, handler]) => link.removeEventListener('click', handler));
  }, [documents]);
  useEffect(() => {
    const existing = window.document.querySelector('.client-document-viewer');
    existing?.remove();
    if (!viewer) return;
    const panel = window.document.createElement('aside');
    panel.className = `client-document-viewer${viewer.document.category === 'Reports' ? ' report-viewer' : ''}`;
    panel.setAttribute('aria-label', 'Document viewer');
    panel.innerHTML = `<header><strong>${viewer.document.title.replace(/[<>]/g, '')}</strong><button type="button">Close</button></header><iframe title="${viewer.document.filename.replace(/[<>]/g, '')}"></iframe>`;
    panel.querySelector('button')?.addEventListener('click', () => { URL.revokeObjectURL(viewer.url); setViewer(null); });
    const frame = panel.querySelector('iframe');
    if (frame) frame.src = `${viewer.url}#rotation=180&zoom=65`;
    (window.document.querySelector('.client-portal') ?? window.document.body).appendChild(panel);
    return () => panel.remove();
  }, [viewer]);
  useEffect(() => {
    if (!providerPreview) return;
    const navigation = window.document.querySelector<HTMLElement>('.client-side-tabs');
    const panels = window.document.querySelector<HTMLElement>('.client-main-panels');
    if (!navigation || !panels) {
      console.error('Could not add the AI Assistant tab because the client portal sections were not found.');
      return;
    }
    const tab = window.document.createElement('button');
    tab.type = 'button';
    tab.className = 'client-ai-tab';
    tab.setAttribute('aria-label', 'Open AI Assistant tab');
    const icon = window.document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    icon.setAttribute('viewBox', '0 0 24 24');
    icon.setAttribute('aria-hidden', 'true');
    icon.classList.add('client-tab-icon');
    const path = window.document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', 'M12 3v3M7 8h10a3 3 0 0 1 3 3v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-5a3 3 0 0 1 3-3Zm2 4h.01M15 12h.01M9 15h6');
    icon.append(path);
    tab.append(icon, window.document.createTextNode('AI Assistant'));
    const openAssistant = () => setPortalTab('assistant');
    tab.addEventListener('click', openAssistant);
    navigation.append(tab);

    const panel = window.document.createElement('section');
    panel.className = 'client-ai-panel';
    panel.setAttribute('aria-label', 'AI Assistant');
    panels.append(panel);
    const root = createRoot(panel);
    assistantRoot.current = root;
    assistantTab.current = tab;
    assistantPanel.current = panel;
    return () => {
      root.unmount();
      if (assistantRoot.current === root) assistantRoot.current = null;
      assistantTab.current = null;
      assistantPanel.current = null;
      tab.removeEventListener('click', openAssistant);
      tab.remove();
      panel.remove();
    };
  }, [providerPreview]);
  useEffect(() => {
    const active = providerPreview && portalTab === 'assistant';
    assistantTab.current?.classList.toggle('active', active);
    if (active) assistantTab.current?.setAttribute('aria-current', 'page');
    else assistantTab.current?.removeAttribute('aria-current');
    if (assistantPanel.current) assistantPanel.current.hidden = !active;
    assistantRoot.current?.render(active ? <ReportsPage profile={assistantProfile} presentation="client-portal" /> : null);
  }, [assistantProfile, portalTab, providerPreview]);
  const investec = TENANT_ID === 'investec';
  const portalClass = `client-portal${investec ? ' client-investec' : ''} client-tab-${portalTab}`;
  const brand = <div className="client-brand">{investec ? <img className="client-logo-standard" src="/logos/investec.svg" alt="Investec" width="300" height="60" /> : TENANT.logo ? <img src={TENANT.logo} alt={TENANT.name} /> : <strong>{TENANT.name}</strong>}<span>Client portal</span></div>;
  if (!session || recovery) return <main className={`${portalClass} client-login`}><section className="client-intro">{brand}<span className="client-eyebrow">{TENANT.name.toUpperCase()} / CLIENT ACCESS</span><h1>Your programme.<br />Clear evidence.</h1><p>View your cohort, published evidence, programme reports and B-BBEE compliance documents in one place.</p>{investec && <img className="client-zebra" src="/logos/investec-zebra.png" alt="Investec zebra" width="575" height="460" />}<small>Provided by Eruditio Skills Development Consultants</small></section><section className="client-login-form"><div><h2>{recovery ? 'Set your password' : `Sign in to ${TENANT.name}`}</h2><p>{recovery ? 'Choose a password for your account.' : 'Use the client account issued by your training provider.'}</p>{!supabase && <p role="alert">Online client access needs to be configured before sign-in is available.</p>}<form onSubmit={signIn}>{!recovery && <label>Email address<input type="email" autoComplete="username" value={email} onChange={event => setEmail(event.target.value)} required /></label>}<label>Password<PasswordInput id="client-password" value={password} onChange={setPassword} autoComplete={recovery ? 'new-password' : 'current-password'} minLength={recovery ? 12 : undefined} required /></label>{error && <p role="alert">{error}</p>}{notice && <p role="status">{notice}</p>}<button className="client-primary" disabled={busy || loading || !supabase}>{busy || loading ? 'Please wait...' : recovery ? 'Save password' : 'Sign in'}</button></form>{!recovery && <button className="client-link" disabled={busy || !supabase} onClick={() => void reset()}>Forgot password?</button>}<p className="client-account-help">Need access? Contact your Eruditio programme administrator.</p></div></section></main>;
  const filtered = documents.filter(doc => (category === 'All' || doc.category === category) && `${doc.title} ${doc.filename}`.toLowerCase().includes(search.toLowerCase()));
  const monthlyReports: Array<{ label: string; key: string; document?: ClientDocument }> = [];
  const starts = learners.map(item => item.start_date).filter(Boolean).sort();
  const ends = learners.map(item => item.end_date).filter(Boolean).sort();
  if (starts.length && ends.length) {
    const cursor = new Date(`${starts[0]}T00:00:00`);
    const finish = new Date(`${ends[ends.length - 1]}T00:00:00`);
    cursor.setDate(1);
    while (cursor <= finish) {
      const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}`;
      const label = cursor.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
      const monthName = label.toLowerCase().split(' ')[0];
      const reportDocument = documents.find(doc => doc.category === 'Reports' && (doc.filename.toLowerCase().includes(key) || doc.title.toLowerCase().includes(key) || doc.filename.toLowerCase().includes(monthName) || doc.title.toLowerCase().includes(monthName)));
      monthlyReports.push({ key, label, document: reportDocument });
      cursor.setMonth(cursor.getMonth() + 1);
    }
  }
  const selectedChecklistMarks = selectedLearner ? checklistMarks[selectedLearner] ?? {} : {};
  const checklistMarkedItems = INDUCTION_CHECKLIST_ITEMS.filter(item => selectedChecklistMarks[item]?.yes || selectedChecklistMarks[item]?.no).length;
  const checklistCompletionPercentage = Math.round(checklistMarkedItems / INDUCTION_CHECKLIST_ITEMS.length * 100);
  const checklistCircumference = 2 * Math.PI * 27;
  return <main className={portalClass}><header className="client-header">{brand}<div className="client-user-menu"><span>{account?.display_name || session.user.email}</span><button onClick={() => void signOut()}>Sign out</button></div></header><div className="client-content"><div className="client-page-heading"><div><span className="client-eyebrow">PROGRAMME OVERSIGHT</span><h1>{TENANT.name} evidence hub</h1><p>Provider-published records for your organisation.</p></div><button disabled={loading} onClick={() => void load()}>Refresh</button></div>{error && <p className="client-error" role="alert">{error}</p>}{notice && <p role="status">{notice}</p>}{providerPreview && <aside className="client-preview-notice"><div><strong>Provider preview</strong><p>You are viewing the published client records using your administrator account.</p></div><a href="/?itssRoute=%7B%22page%22%3A%22evidenceRegister%22%7D">Manage client access</a></aside>}{loading ? <p role="status">Loading your client records...</p> : account && <div className="client-account-root"><nav className="client-side-tabs" aria-label="Client portal sections"><button className={portalTab === 'dashboard' ? 'active' : ''} onClick={() => setPortalTab('dashboard')}><svg className="client-tab-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z" /></svg>Dashboard</button><button className={portalTab === 'account' ? 'active' : ''} onClick={() => setPortalTab('account')}><svg className="client-tab-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4.5 21a7.5 7.5 0 0 1 15 0" /></svg>My account</button><button className={portalTab === 'cohort' ? 'active' : ''} onClick={() => setPortalTab('cohort')}><svg className="client-tab-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h16M4 12h16M4 19h16" /></svg>Your cohort</button><button className={portalTab === 'compliance' ? 'active' : ''} onClick={() => setPortalTab('compliance')}><svg className="client-tab-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 19 6v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6l7-3Z" /></svg>B-BBEE compliance</button><button className={portalTab === 'documents' ? 'active' : ''} onClick={() => setPortalTab('documents')}><svg className="client-tab-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4h14v16H5zM8 8h8M8 12h8M8 16h5" /></svg>Evidence and reports</button></nav><div className="client-main-panels"><div className="client-stats"><div><strong>{learners.length}</strong><span>Learners published</span></div><div><strong>{documents.filter(doc => doc.category !== 'Reports').length}</strong><span>Evidence documents</span></div><div><strong>{documents.filter(doc => doc.category === 'Reports').length}</strong><span>Reports available</span></div></div><ClientDashboard data={dashboard} cohort={learners} /><ClientAccountPage account={account} learners={learners} documents={documents} /><details open={portalTab === 'cohort'} className="client-panel client-collapsible"><summary>Your cohort</summary>{learners.length ? <div className="client-table-wrap"><table><thead><tr><th>Learner</th><th>Programme</th><th>Period</th><th>Status</th></tr></thead><tbody>{learners.map(learner => <tr key={learner.learner_ref}><td><button className="client-learner-edit" type="button" onClick={(event) => { event.preventDefault(); event.stopPropagation(); void openChecklist(learner); }}><strong>{learner.name}</strong></button></td><td>{learner.programme}</td><td>{learner.start_date || 'Not recorded'} – {learner.end_date || 'Not recorded'}</td><td>{learner.status}</td></tr>)}</tbody></table></div> : <p>Your provider has not published the cohort yet.</p>}{selectedLearner && <section className="client-checklist-editor"><img className="checklist-logo" src="/logos/eruditio.svg" alt="Eruditio" /><div className="client-doc-heading"><h2>Induction checklist</h2><button type="button" onClick={() => setSelectedLearner(null)}>Close</button></div><div className="client-checklist-summary"><label>Candidate full name<input value={learners.find(item => item.learner_ref === selectedLearner)?.name || ''} readOnly /></label><div className="client-checklist-progress" role="img" aria-live="polite" aria-label={`Checklist progress: ${checklistMarkedItems} of ${INDUCTION_CHECKLIST_ITEMS.length} items marked (${checklistCompletionPercentage}%)`}><svg viewBox="0 0 64 64" aria-hidden="true"><circle className="client-checklist-progress-track" cx="32" cy="32" r="27" /><circle className="client-checklist-progress-value" cx="32" cy="32" r="27" strokeDasharray={checklistCircumference} strokeDashoffset={checklistCircumference * (1 - checklistCompletionPercentage / 100)} /></svg><strong>{checklistCompletionPercentage}%</strong></div></div><p>Please mark the applicable columns.</p><table><thead><tr><th>Document</th><th>Yes</th><th>No</th></tr></thead><tbody>{INDUCTION_CHECKLIST_ITEMS.map(item => { const marks = selectedChecklistMarks[item] ?? { yes: false, no: false }; return <tr key={item}><td>{item}</td><td><input type="checkbox" checked={marks.yes} onChange={event => { if (selectedLearner) updateChecklistMark(selectedLearner, item, 'yes', event.currentTarget.checked); }} aria-label={`${item} yes`} /></td><td><input type="checkbox" checked={marks.no} onChange={event => { if (selectedLearner) updateChecklistMark(selectedLearner, item, 'no', event.currentTarget.checked); }} aria-label={`${item} no`} /></td></tr>; })}</tbody></table><footer className="checklist-footer">📍 45 Villa Valencia, 2 Anemoon Road, Glen Marais, Kempton Park, 1619 <span>☎ 011 973 0205</span></footer></section>}</details><section className="client-panel client-compliance"><div className="client-doc-heading"><h2>B-BBEE compliance</h2><span className="client-compliance-status">{documents.some(doc => doc.category === 'B-BBEE Compliance') ? 'Supporting documents available' : 'Awaiting provider documents'}</span></div><p>Provider-published B-BBEE certificates, affidavits and skills development supporting evidence.</p>{documents.some(doc => doc.category === 'B-BBEE Compliance') ? <ul className="client-documents">{documents.filter(doc => doc.category === 'B-BBEE Compliance').map(doc => <li key={doc.id}><div><strong>{doc.title}</strong><small>{doc.filename}</small></div><button className="client-download-icon" aria-label={`View ${doc.title}`} title="View" onClick={() => void openDocument(doc).catch(failure => setError(failure.message))}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Zm9.5-2.5A2.5 2.5 0 1 0 12 14.5 2.5 2.5 0 0 0 12 9.5Z" /></svg></button></li>)}</ul> : <p>No B-BBEE compliance documents have been published for your organisation yet.</p>}</section><section className="client-panel"><div className="client-doc-heading"><h2>Evidence and reports</h2><input type="search" aria-label="Find a document" placeholder="Find a document" value={search} onChange={event => setSearch(event.target.value)} /></div><nav className="client-filters" aria-label="Document categories">{['All', ...CLIENT_CATEGORIES.filter(item => item !== 'B-BBEE Compliance' && item !== 'Workbooks')].map(item => <button key={item} aria-pressed={category === item} onClick={() => setCategory(item)}>{item}</button>)}</nav>{category === 'Reports' && monthlyReports.length > 0 && <ul className="client-documents client-monthly-reports">{monthlyReports.map(report => <li key={report.key}><div><strong>{report.label} report</strong><small>{report.document ? report.document.filename : 'Monthly programme report — awaiting upload'}</small></div>{report.document ? <button className="client-download-icon" aria-label={`View ${report.label} report`} title="View report" onClick={() => void openDocument(report.document!).catch(failure => setError(failure.message))}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Zm9.5-2.5A2.5 2.5 0 1 0 12 14.5 2.5 2.5 0 0 0 12 9.5Z" /></svg></button> : <span className="client-report-status">Awaiting upload</span>}</li>)}</ul>}{filtered.length ? <ul className="client-documents">{filtered.map(doc => <li key={doc.id}><div><strong>{doc.title}</strong><small>{doc.category} · {doc.filename} · {Math.max(1, Math.round(doc.file_size / 1024))} KB</small></div><button className="client-download-icon" aria-label={`View ${doc.title}`} title="View" onClick={() => void openDocument(doc).catch(failure => setError(failure.message))}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Zm9.5-2.5A2.5 2.5 0 1 0 12 14.5 2.5 2.5 0 0 0 12 9.5Z" /></svg></button></li>)}</ul> : <p>No published documents match this view.</p>}</section></div></div>}</div><footer className="client-footer">Eruditio | Client access | Read-only programme records</footer></main>;
}










