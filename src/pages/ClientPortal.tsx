import { useEffect, useRef, useState, type FormEvent } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { TENANT, TENANT_ID } from '../lib/tenant';
import { CLIENT_CATEGORIES, downloadClientDocument, portalError, type ClientAccount, type ClientDocument, type ClientLearner } from '../lib/clientPortal';
import { PasswordInput } from '../components/PasswordInput';
import './client-portal.css';

export function ClientPortal() {
  const [session, setSession] = useState<Session | null>(null);
  const [account, setAccount] = useState<ClientAccount | null>(null);
  const [providerPreview, setProviderPreview] = useState(false);
  const [learners, setLearners] = useState<ClientLearner[]>([]);
  const [documents, setDocuments] = useState<ClientDocument[]>([]);
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
  const request = useRef(0);
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
    setLoading(true); setError(''); setAccount(null); setProviderPreview(false); setLearners([]); setDocuments([]);
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
      const [cohort, files] = await Promise.all([
        supabase.from('client_portal_learners').select('id,learner_ref,name,programme,status,start_date,end_date').eq('tenant_id', TENANT_ID).order('name'),
        supabase.from('client_portal_documents').select('id,title,category,filename,storage_path,file_size,created_at,published').eq('tenant_id', TENANT_ID).eq('published', true).order('created_at', { ascending: false }),
      ]);
      if (cohort.error || files.error) throw new Error(portalError(cohort.error || files.error));
      if (revision !== request.current) return;
      setAccount(portalAccount); setProviderPreview(preview); setLearners(cohort.data ?? []); setDocuments(files.data ?? []);
    } catch (failure) { if (revision === request.current) setError(failure instanceof Error ? failure.message : 'Could not load the portal.'); }
    finally { if (revision === request.current) setLoading(false); }
  }
  useEffect(() => { if (session) void load(); else { request.current++; setAccount(null); setLearners([]); setDocuments([]); } }, [session?.user.id]);
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
  async function signOut() { request.current++; setAccount(null); setDocuments([]); setLearners([]); const result = await supabase?.auth.signOut(); if (result?.error) setError('Could not sign out. Please retry.'); }
  async function openDocument(document: ClientDocument) {
    if (!supabase) return;
    const { data, error } = await supabase.storage.from('client-evidence').download(document.storage_path);
    if (error || !data) { setError('This document could not be opened. It may no longer be published.'); return; }
    if (viewer) URL.revokeObjectURL(viewer.url);
    setViewer({ document, url: URL.createObjectURL(data) });
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
  }, [documents, filtered]);
  useEffect(() => {
    const existing = window.document.querySelector('.client-document-viewer');
    existing?.remove();
    if (!viewer) return;
    const panel = window.document.createElement('aside');
    panel.className = 'client-document-viewer';
    panel.setAttribute('aria-label', 'Document viewer');
    panel.innerHTML = `<header><strong>${viewer.document.title.replace(/[<>]/g, '')}</strong><button type="button">Close</button></header><iframe title="${viewer.document.filename.replace(/[<>]/g, '')}"></iframe>`;
    panel.querySelector('button')?.addEventListener('click', () => { URL.revokeObjectURL(viewer.url); setViewer(null); });
    const frame = panel.querySelector('iframe');
    if (frame) frame.src = viewer.url;
    window.document.body.appendChild(panel);
    return () => panel.remove();
  }, [viewer]);
  const investec = TENANT_ID === 'investec';
  const portalClass = `client-portal${investec ? ' client-investec' : ''}`;
  const brand = <div className="client-brand">{investec ? <img className="client-logo-standard" src="/logos/investec.svg" alt="Investec" width="300" height="60" /> : TENANT.logo ? <img src={TENANT.logo} alt={TENANT.name} /> : <strong>{TENANT.name}</strong>}<span>Client portal</span></div>;
  if (!session || recovery) return <main className={`${portalClass} client-login`}><section className="client-intro">{brand}<span className="client-eyebrow">{TENANT.name.toUpperCase()} / CLIENT ACCESS</span><h1>Your programme.<br />Clear evidence.</h1><p>View your cohort, published evidence, programme reports and B-BBEE compliance documents in one place.</p>{investec && <img className="client-zebra" src="/logos/investec-zebra.png" alt="Investec zebra" width="575" height="460" />}<small>Provided by Eruditio Skills Development Consultants</small></section><section className="client-login-form"><div><h2>{recovery ? 'Set your password' : `Sign in to ${TENANT.name}`}</h2><p>{recovery ? 'Choose a password for your account.' : 'Use the client account issued by your training provider.'}</p>{!supabase && <p role="alert">Online client access needs to be configured before sign-in is available.</p>}<form onSubmit={signIn}>{!recovery && <label>Email address<input type="email" autoComplete="username" value={email} onChange={event => setEmail(event.target.value)} required /></label>}<label>Password<PasswordInput id="client-password" value={password} onChange={setPassword} autoComplete={recovery ? 'new-password' : 'current-password'} minLength={recovery ? 12 : undefined} required /></label>{error && <p role="alert">{error}</p>}{notice && <p role="status">{notice}</p>}<button className="client-primary" disabled={busy || loading || !supabase}>{busy || loading ? 'Please wait...' : recovery ? 'Save password' : 'Sign in'}</button></form>{!recovery && <button className="client-link" disabled={busy || !supabase} onClick={() => void reset()}>Forgot password?</button>}<p className="client-account-help">Need access? Contact your Eruditio programme administrator.</p></div></section></main>;
  const filtered = documents.filter(doc => (category === 'All' || doc.category === category) && `${doc.title} ${doc.filename}`.toLowerCase().includes(search.toLowerCase()));
  return <main className={portalClass}><header className="client-header">{brand}<div className="client-user-menu"><span>{account?.display_name || session.user.email}</span><button onClick={() => void signOut()}>Sign out</button></div></header><div className="client-content"><div className="client-page-heading"><div><span className="client-eyebrow">PROGRAMME OVERSIGHT</span><h1>{TENANT.name} evidence hub</h1><p>Provider-published records for your organisation.</p></div><button disabled={loading} onClick={() => void load()}>Refresh</button></div>{error && <p className="client-error" role="alert">{error}</p>}{notice && <p role="status">{notice}</p>}{providerPreview && <aside className="client-preview-notice"><div><strong>Provider preview</strong><p>You are viewing the published client records using your administrator account.</p></div><a href="/?itssRoute=%7B%22page%22%3A%22evidenceRegister%22%7D">Manage client access</a></aside>}{loading ? <p role="status">Loading your client records...</p> : account && <><div className="client-stats"><div><strong>{learners.length}</strong><span>Learners published</span></div><div><strong>{documents.filter(doc => doc.category !== 'Reports').length}</strong><span>Evidence documents</span></div><div><strong>{documents.filter(doc => doc.category === 'Reports').length}</strong><span>Reports available</span></div></div><section className="client-panel"><h2>Your cohort</h2>{learners.length ? <div className="client-table-wrap"><table><thead><tr><th>Learner</th><th>Programme</th><th>Period</th><th>Status</th></tr></thead><tbody>{learners.map(learner => <tr key={learner.learner_ref}><td><strong>{learner.name}</strong></td><td>{learner.programme}</td><td>{learner.start_date || 'Not recorded'} – {learner.end_date || 'Not recorded'}</td><td>{learner.status}</td></tr>)}</tbody></table></div> : <p>Your provider has not published the cohort yet.</p>}</section><section className="client-panel client-compliance"><div className="client-doc-heading"><h2>B-BBEE compliance</h2><span className="client-compliance-status">{documents.some(doc => doc.category === 'B-BBEE Compliance') ? 'Supporting documents available' : 'Awaiting provider documents'}</span></div><p>Provider-published B-BBEE certificates, affidavits and skills development supporting evidence.</p>{documents.some(doc => doc.category === 'B-BBEE Compliance') ? <ul className="client-documents">{documents.filter(doc => doc.category === 'B-BBEE Compliance').map(doc => <li key={doc.id}><div><strong>{doc.title}</strong><small>{doc.filename}</small></div><button aria-label={`Download ${doc.title}`} onClick={() => void downloadClientDocument(doc).catch(failure => setError(failure.message))}>Download</button></li>)}</ul> : <p>No B-BBEE compliance documents have been published for your organisation yet.</p>}</section><section className="client-panel"><div className="client-doc-heading"><h2>Evidence and reports</h2><input type="search" aria-label="Find a document" placeholder="Find a document" value={search} onChange={event => setSearch(event.target.value)} /></div><nav className="client-filters" aria-label="Document categories">{['All', ...CLIENT_CATEGORIES].map(item => <button key={item} aria-pressed={category === item} onClick={() => setCategory(item)}>{item}</button>)}</nav>{filtered.length ? <ul className="client-documents">{filtered.map(doc => <li key={doc.id}><div><strong>{doc.title}</strong><small>{doc.category} · {doc.filename} · {Math.max(1, Math.round(doc.file_size / 1024))} KB</small></div><button aria-label={`Download ${doc.title}`} onClick={() => void downloadClientDocument(doc).catch(failure => setError(failure.message))}>Download</button></li>)}</ul> : <p>No published documents match this view.</p>}</section></>}</div><footer className="client-footer">Eruditio | Client access | Read-only programme records</footer></main>;
}
