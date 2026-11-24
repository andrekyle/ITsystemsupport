import { useEffect, useRef, useState, type FormEvent } from 'react';
import { supabase } from '../lib/supabase';
import type { ClientAccount, ClientDocument, ClientLearner } from '../lib/clientPortal';

type AccountTab = 'overview' | 'programmes' | 'documents' | 'settings' | 'support';

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]?.toUpperCase()).join('') || 'CA';
}

function splitName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return { firstName: parts.shift() || '', lastName: parts.join(' ') };
}

export function ClientAccountPage({ account, learners, documents, onAccountUpdated }: {
  account: ClientAccount;
  learners: ClientLearner[];
  documents: ClientDocument[];
  onAccountUpdated?: (displayName: string) => void;
}) {
  const accountName = splitName(account.display_name);
  const [tab, setTab] = useState<AccountTab>('overview');
  const [firstName, setFirstName] = useState(accountName.firstName);
  const [lastName, setLastName] = useState(accountName.lastName);
  const [phone, setPhone] = useState('');
  const [saveStatus, setSaveStatus] = useState('');
  const [saving, setSaving] = useState(false);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [attachmentName, setAttachmentName] = useState('');
  const attachmentRef = useRef<HTMLInputElement>(null);
  const programmes = [...new Set(learners.map(learner => learner.programme).filter(Boolean))];
  const tabs: Array<{ id: Exclude<AccountTab, 'support'>; label: string }> = [
    { id: 'overview', label: 'Overview' },
    { id: 'programmes', label: 'Programme access' },
    { id: 'documents', label: 'Published documents' },
    { id: 'settings', label: 'Account settings' },
  ];

  useEffect(() => {
    if (!supabase) return;
    void supabase.auth.getUser().then(({ data }) => {
      const metadata = data.user?.user_metadata;
      if (!metadata) return;
      if (typeof metadata.first_name === 'string') setFirstName(metadata.first_name);
      if (typeof metadata.last_name === 'string') setLastName(metadata.last_name);
      if (typeof metadata.phone === 'string') setPhone(metadata.phone);
    });
  }, [account.user_id]);

  async function saveSettings(event: FormEvent) {
    event.preventDefault();
    if (!supabase || saving) return;
    const displayName = `${firstName.trim()} ${lastName.trim()}`.trim();
    if (!displayName) return setSaveStatus('Enter your name before saving.');
    setSaving(true); setSaveStatus('');
    const { error } = await supabase.auth.updateUser({ data: { first_name: firstName.trim(), last_name: lastName.trim(), full_name: displayName, phone: phone.trim() } });
    setSaving(false);
    if (error) return setSaveStatus(error.message || 'Your details could not be saved.');
    onAccountUpdated?.(displayName);
    setSaveStatus('Your personal information has been saved.');
  }

  function sendSupport(event: FormEvent) {
    event.preventDefault();
    const attachmentNote = attachmentName ? `\n\nAttachment to add: ${attachmentName}` : '';
    const body = `${message}${attachmentNote}\n\nFrom: ${account.display_name} (${account.email})`;
    window.location.href = `mailto:support@eruditio.co.za?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }

  return <section className="client-account-page" aria-label="My account">
    {tab !== 'support' && <>
      <header className="client-account-identity">
        <div className="client-account-avatar" aria-hidden="true">{initials(`${firstName} ${lastName}`)}</div>
        <div><h1>{`${firstName} ${lastName}`.trim() || account.display_name}</h1><p>{account.email}</p></div>
      </header>
      <div className="client-account-nav-row">
        <nav aria-label="Account sections">{tabs.map(item => <button type="button" key={item.id} className={tab === item.id ? 'active' : ''} aria-current={tab === item.id ? 'page' : undefined} onClick={() => setTab(item.id)}>{item.label}</button>)}</nav>
        <button type="button" className="client-account-support" onClick={() => setTab('support')}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.5c-5 0-9 3.45-9 7.7 0 2.05.94 3.91 2.47 5.29L4.5 20.5l4.25-1.86c1.02.25 2.1.31 3.25.31 5 0 9-3.45 9-7.75s-4-7.7-9-7.7Z" /><circle cx="8.3" cy="11.3" r=".75" /><circle cx="12" cy="11.3" r=".75" /><circle cx="15.7" cy="11.3" r=".75" /></svg>Contact Support Team</button>
      </div>
    </>}
    <div className={`client-account-content${tab === 'support' ? ' client-account-support-page' : ''}`}>
      {tab === 'overview' && <><h2>Account overview</h2><div className="client-account-overview-grid"><div><span>Learners</span><strong>{learners.length}</strong><small>Published to your organisation</small></div><div><span>Programmes</span><strong>{programmes.length}</strong><small>Active programme access</small></div><div><span>Documents</span><strong>{documents.length}</strong><small>Published records available</small></div></div></>}
      {tab === 'programmes' && <><h2>My programme access</h2><div className="client-account-list-panel">{programmes.length ? programmes.map(programme => { const count = learners.filter(learner => learner.programme === programme).length; return <article key={programme}><div className="client-account-list-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h16v14H4zM8 9h8M8 13h5" /></svg></div><div><strong>{programme}</strong><span>{count} learner{count === 1 ? '' : 's'} · Client reporting access</span></div><span className="client-account-access">Active</span></article>; }) : <div className="client-account-empty"><strong>No programme access yet</strong><p>Your provider will publish programme access here.</p></div>}</div></>}
      {tab === 'documents' && <><h2>Published documents</h2><div className="client-account-list-panel">{documents.length ? documents.slice(0, 12).map(document => <article key={document.id}><div className="client-account-list-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3h9l3 3v15H6zM14 3v4h4M9 12h6M9 16h6" /></svg></div><div><strong>{document.title}</strong><span>{document.category} · {document.filename}</span></div></article>) : <div className="client-account-empty"><strong>No documents published yet</strong></div>}</div></>}
      {tab === 'settings' && <><h2>Personal information</h2><form className="client-account-settings" onSubmit={saveSettings}><label><span>First name:</span><input value={firstName} onChange={event => setFirstName(event.target.value)} required /></label><label><span>Last name:</span><input value={lastName} onChange={event => setLastName(event.target.value)} /></label><label><span>Phone:</span><input type="tel" value={phone} onChange={event => setPhone(event.target.value)} autoComplete="tel" /></label><div className="client-account-save-row"><button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>{saveStatus && <p role="status">{saveStatus}</p>}</div></form></>}
      {tab === 'support' && <><div className="client-account-support-title"><h2>Contact support team</h2><button type="button" onClick={() => setTab('overview')}>Back to profile</button></div><form className="client-support-form" onSubmit={sendSupport}><input aria-label="Subject" placeholder="Subject" value={subject} onChange={event => setSubject(event.target.value)} required /><textarea aria-label="Message" placeholder="Let us know how we can help..." value={message} onChange={event => setMessage(event.target.value)} required /><div><input ref={attachmentRef} type="file" hidden onChange={event => setAttachmentName(event.target.files?.[0]?.name || '')} /><button type="button" className="client-attach-button" onClick={() => attachmentRef.current?.click()}><span aria-hidden="true">⌕</span>{attachmentName || 'Attach file'}</button><button type="submit" className="client-support-send">Send message</button></div></form></>}
    </div>
  </section>;
}
