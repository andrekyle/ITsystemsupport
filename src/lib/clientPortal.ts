import { supabase } from './supabase';
import { TENANT_ID } from './tenant';

export interface ClientAccount { user_id: string; display_name: string; email: string; tenant_id: string; enabled: boolean }
export interface ClientLearner { id?: string; learner_ref: string; name: string; programme: string; status: string; start_date: string | null; end_date: string | null }
export interface ClientDocument { id: string; title: string; category: string; filename: string; storage_path: string; file_size: number; created_at: string; published: boolean }
export interface ClientDashboardLearner { learner_ref: string; name: string; progress: { units?: Record<string, { activities?: Record<string, boolean>; quiz?: { attempts?: number }; quizzes?: Record<string, { attempts?: number }>; exercises?: Record<string, { attempts?: number }>; logbook?: Record<string, unknown> }> } }
export interface ClientAttendanceRegister { date: string; signer_count: number; rows: Record<string, { name?: string; surname?: string }> }
export interface ClientDashboardData { learners: ClientDashboardLearner[]; attendance: ClientAttendanceRegister[] }
export const CLIENT_CATEGORIES = ['Evidence', 'Reports', 'Registers', 'Workbooks', 'Programme', 'B-BBEE Compliance'];
export const clientPortalUrl = () => `${window.location.origin}/clients/${TENANT_ID}`;
export const clientPortalRequested = () => /^\/clients(?:\/|$)/.test(window.location.pathname) || new URLSearchParams(window.location.search).get('portal') === 'client';
export function trustedClientAccount(user: { app_metadata?: Record<string, unknown> }) { return user.app_metadata?.portal_role === 'client'; }
export function portalError(error: { message?: string } | null) {
  return /does not exist|schema cache|could not find/i.test(error?.message ?? '')
    ? 'Client access is not configured yet. Ask the provider to complete portal setup.'
    : error?.message || 'Could not load client information. Please retry.';
}
export async function downloadClientDocument(document: ClientDocument) {
  if (!supabase) throw new Error('Sign in to download documents.');
  const { data, error } = await supabase.storage.from('client-evidence').download(document.storage_path);
  if (error || !data) throw new Error('This document could not be downloaded. It may no longer be published.');
  const url = URL.createObjectURL(data);
  const link = window.document.createElement('a'); link.href = url; link.download = document.filename; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
