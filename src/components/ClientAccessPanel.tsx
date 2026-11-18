import { useEffect, useRef, useState, type FormEvent } from 'react';
import { supabase } from '../lib/supabase';
import { TENANT_ID } from '../lib/tenant';
import { clientPortalUrl, CLIENT_CATEGORIES, portalError, type ClientAccount, type ClientDocument } from '../lib/clientPortal';
import type { Profile } from '../types';
import { Select } from './Select';
import '../pages/client-portal.css';

export function ClientAccessPanel({ learners }: { learners: Profile[] }) {
  const [accounts, setAccounts] = useState<ClientAccount[]>([]);
  const [documents, setDocuments] = useState<ClientDocument[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Evidence');
  const [start, setStart] = useState('2026-07-17');
  const [end, setEnd] = useState('2027-07-30');
  const file = useRef<HTMLInputElement>(null);
  const [setup, setSetup] = useState<{ invitationsReady: boolean; serviceKeyReady: boolean; portalUrlReady: boolean } | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => { if (supabase) void run(refresh); }, []);
  async function refresh() {
    if (!supabase) return;
    const [users, files] = await Promise.all([
      supabase.from('client_portal_accounts').select('*').eq('tenant_id', TENANT_ID).order('display_name'),
      supabase.from('client_portal_documents').select('*').eq('tenant_id', TENANT_ID).order('created_at', { ascending: false }),
    ]);
    if (users.error || files.error) throw new Error(portalError(users.error || files.error));
    setAccounts(users.data ?? []); setDocuments(files.data ?? []); setReady(true);
    const { data } = await supabase.auth.getSession();
    if (data.session) {
      try {
        const status = await fetch('/api/client-portal-status', { headers: { Authorization: `Bearer ${data.session.access_token}` } });
        if (status.ok) setSetup(await status.json());
      } catch { setSetup(null); }
    }
  }
  async function run(action: () => Promise<void>) {
    if (busy) return;
    setBusy(true); setError(''); setMessage('');
    try { await action(); } catch (failure) { setError(failure instanceof Error ? failure.message : 'The client action failed.'); }
    finally { setBusy(false); }
  }
  async function createClient(event: FormEvent) {
    event.preventDefault();
    await run(async () => {
      const { data } = await supabase!.auth.getSession();
      if (!data.session) throw new Error('Sign in to create client accounts.');
      const response = await fetch('/api/create-client', { method: 'POST', headers: { Authorization: `Bearer ${data.session.access_token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ name, email, password }) });
      const result = await response.json().catch(() => ({ error: 'The client account service is unavailable.' })); if (!response.ok) throw new Error(result.error || 'Could not create the client account.');
      setMessage('Client account created.'); setName(''); setEmail(''); setPassword(''); await refresh();
    });
  }
  async function publishCohort() {
    await run(async () => {
      if (!learners.length) throw new Error('No learners are available to publish.');
      if (start && end && start > end) throw new Error('The programme end date must follow its start date.');
      const { error } = await supabase!.from('client_portal_learners').upsert(learners.map(learner => ({
        tenant_id: TENANT_ID, learner_ref: learner.id, name: learner.name, programme: 'IT Systems Support',
        start_date: start || null, end_date: end || null, status: 'Enrolled', published_at: new Date().toISOString(),
      })), { onConflict: 'tenant_id,learner_ref' });
      if (error) throw new Error(portalError(error));
      setMessage(`${learners.length} learner names and programme details published to this client's portal.`);
    });
  }
  async function upload(event: FormEvent) {
    event.preventDefault(); const selected = file.current?.files?.[0]; if (!selected) return;
    await run(async () => {
      if (selected.size > 50 * 1024 * 1024) throw new Error('Client files must be 50 MB or smaller.');
      const path = `${TENANT_ID}/${crypto.randomUUID()}/${selected.name.replace(/[^a-zA-Z0-9.\-_]/g, '_')}`;
      const result = await supabase!.storage.from('client-evidence').upload(path, selected);
      if (result.error) throw new Error('Could not upload the client document. Check the storage setup.');
      const record = await supabase!.from('client_portal_documents').insert({ tenant_id: TENANT_ID, title: title.trim(), category, filename: selected.name, storage_path: path, file_size: selected.size, published: false });
      if (record.error) { await supabase!.storage.from('client-evidence').remove([path]); throw new Error(portalError(record.error)); }
      setTitle(''); if (file.current) file.current.value = ''; await refresh(); setMessage('Document uploaded as a draft. Publish it below when ready for the client.');
    });
  }
  return <details open className="client-admin-panel"><summary>Client portal access and publishing</summary><p>Clients can view published cohort details and download approved documents. They cannot edit learner records.</p><p>Client sign-in: <a href={clientPortalUrl()} target="_blank" rel="noopener">{clientPortalUrl()}</a></p>{!supabase ? <p>Enable cloud access to invite clients and publish evidence.</p> : <>
    <div className="client-admin-status"><strong>{ready ? 'Portal database connected' : 'Checking portal setup...'}</strong><span>{accounts.length} client accounts / {documents.filter(document => document.published).length} published documents</span><button type="button" className="btn" disabled={busy} onClick={() => void run(refresh)}>Refresh</button></div>
    <h3>Client accounts</h3><form onSubmit={createClient}><label>Client name<input value={name} onChange={event => setName(event.target.value)} required maxLength={120} /></label><label>Email<input type="email" value={email} onChange={event => setEmail(event.target.value)} required /></label><label>Temporary password<input type="password" value={password} onChange={event => setPassword(event.target.value)} minLength={12} required /></label><button className="btn" disabled={busy || !ready || !setup?.serviceKeyReady}>Create client account</button></form>
    {accounts.length > 0 && <ul>{accounts.map(account => <li key={account.user_id}><span>{account.display_name} · {account.email} · {account.enabled ? 'Active' : 'Access disabled'}</span><button className="btn ghost" disabled={busy} onClick={() => void run(async () => { const result = await supabase!.from('client_portal_accounts').update({ enabled: !account.enabled }).eq('user_id', account.user_id).eq('tenant_id', TENANT_ID); if (result.error) throw new Error(portalError(result.error)); await refresh(); })}>{account.enabled ? 'Disable access' : 'Enable access'}</button></li>)}</ul>}
    <h3>Publish learner cohort</h3><div className="client-admin-row"><label>Programme start<input type="date" value={start} onChange={event => setStart(event.target.value)} /></label><label>Programme end<input type="date" value={end} min={start} onChange={event => setEnd(event.target.value)} /></label><button className="btn" disabled={busy || !learners.length} onClick={() => void publishCohort()}>Publish cohort ({learners.length} learners)</button></div>
    <h3>Evidence and compliance documents</h3><form onSubmit={upload}><label>Document title<input value={title} onChange={event => setTitle(event.target.value)} required maxLength={200} /></label><label>Category<Select value={category} ariaLabel="Document category" options={CLIENT_CATEGORIES.map(value => ({ value, label: value }))} onChange={setCategory} /></label><label className="client-file-field">File<input type="file" ref={file} required /></label><button className="btn primary client-form-action" disabled={busy}>Upload draft</button></form>
    {documents.length > 0 && <ul>{documents.map(document => <li key={document.id}><span>{document.title} · {document.category} · {document.published ? 'Published' : 'Draft'}</span><button className="btn" disabled={busy} onClick={() => void run(async () => { const result = await supabase!.from('client_portal_documents').update({ published: !document.published }).eq('id', document.id).eq('tenant_id', TENANT_ID); if (result.error) throw new Error(portalError(result.error)); await refresh(); })}>{document.published ? 'Unpublish' : 'Publish to client'}</button></li>)}</ul>}
  </>}{busy && <p role="status">Working...</p>}{error && <p role="alert">{error}</p>}{message && <p role="status">{message}</p>}</details>;
}
