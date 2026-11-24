import { useState } from 'react';
import type { ClientAccount, ClientDocument, ClientLearner } from '../lib/clientPortal';

type AccountTab = 'overview' | 'programmes' | 'documents' | 'settings';

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]?.toUpperCase()).join('') || 'CA';
}

export function ClientAccountPage({ account, learners, documents }: { account: ClientAccount; learners: ClientLearner[]; documents: ClientDocument[] }) {
  const [tab, setTab] = useState<AccountTab>('programmes');
  const programmes = [...new Set(learners.map(learner => learner.programme).filter(Boolean))];
  const tabs: Array<{ id: AccountTab; label: string }> = [
    { id: 'overview', label: 'Overview' },
    { id: 'programmes', label: 'Programme access' },
    { id: 'documents', label: 'Published documents' },
    { id: 'settings', label: 'Account settings' },
  ];

  return <section className="client-account-page" aria-label="My account">
    <header className="client-account-identity">
      <div className="client-account-avatar" aria-hidden="true">{initials(account.display_name)}</div>
      <div><h1>{account.display_name}</h1><p>{account.email}</p></div>
    </header>
    <div className="client-account-nav-row">
      <nav aria-label="Account sections">{tabs.map(item => <button type="button" key={item.id} className={tab === item.id ? 'active' : ''} aria-current={tab === item.id ? 'page' : undefined} onClick={() => setTab(item.id)}>{item.label}</button>)}</nav>
      <a className="client-account-support" href="mailto:support@eruditio.co.za"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 15a4 4 0 0 1-4 4H8l-5 3 1.5-5A8 8 0 1 1 21 15Z" /><path d="M8 11h.01M12 11h.01M16 11h.01" /></svg>Contact support team</a>
    </div>
    <div className="client-account-content">
      {tab === 'overview' && <><h2>Account overview</h2><div className="client-account-overview-grid"><div><span>Learners</span><strong>{learners.length}</strong><small>Published to your organisation</small></div><div><span>Programmes</span><strong>{programmes.length}</strong><small>Active programme access</small></div><div><span>Documents</span><strong>{documents.length}</strong><small>Published records available</small></div></div></>}
      {tab === 'programmes' && <><h2>My programme access</h2><div className="client-account-list-panel">{programmes.length ? programmes.map(programme => { const count = learners.filter(learner => learner.programme === programme).length; return <article key={programme}><div className="client-account-list-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h16v14H4zM8 9h8M8 13h5" /></svg></div><div><strong>{programme}</strong><span>{count} learner{count === 1 ? '' : 's'} · Client reporting access</span></div><span className="client-account-access">Active</span></article>; }) : <div className="client-account-empty"><svg viewBox="0 0 48 48" aria-hidden="true"><rect x="9" y="12" width="27" height="27" rx="3" /><path d="M15 7h24a3 3 0 0 1 3 3v24M18 22h10M18 28h7" /></svg><strong>No programme access yet</strong><p>Your provider will publish programme access here.</p></div>}</div></>}
      {tab === 'documents' && <><h2>Published documents</h2><div className="client-account-list-panel">{documents.length ? documents.slice(0, 12).map(document => <article key={document.id}><div className="client-account-list-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3h9l3 3v15H6zM14 3v4h4M9 12h6M9 16h6" /></svg></div><div><strong>{document.title}</strong><span>{document.category} · {document.filename}</span></div></article>) : <div className="client-account-empty"><strong>No documents published yet</strong></div>}</div></>}
      {tab === 'settings' && <><h2>Account settings</h2><div className="client-account-settings"><label>Display name<input value={account.display_name} readOnly /></label><label>Email address<input value={account.email} readOnly /></label><p>Contact the support team to update your organisation account details or access.</p></div></>}
    </div>
  </section>;
}
