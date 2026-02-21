'use client';

import { useState } from 'react';
import { X, TriangleAlert } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

interface DeleteAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDeleted: () => void;
}

export default function DeleteAccountModal({
  isOpen,
  onClose,
  onDeleted,
}: DeleteAccountModalProps) {
  const [typed, setTyped] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  const canDelete = typed === 'DELETE';

  const handleConfirm = async () => {
    if (!canDelete) return;
    setDeleting(true);
    setError('');

    try {
      // Get current session access token
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;

      if (!accessToken) {
        setError('No active session. Please log in again.');
        setDeleting(false);
        return;
      }

      // Call Supabase REST API to delete the user account
      // Requires "Allow users to delete their own accounts" enabled in
      // Supabase Dashboard → Authentication → Settings
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

      const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          apikey: anonKey,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body?.message || `Server error (${response.status})`);
      }

      // Sign out locally then tell parent to redirect
      await supabase.auth.signOut();
      onDeleted();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setError(`Could not delete account: ${msg}`);
      setDeleting(false);
    }
  };

  const handleClose = () => {
    if (deleting) return;
    setTyped('');
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-50" onClick={handleClose} />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="bg-white rounded-2xl shadow-2xl w-full max-w-md"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <TriangleAlert size={18} className="text-red-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Delete Account</h2>
                <p className="text-xs text-gray-400">This action is permanent and irreversible</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              disabled={deleting}
              className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-40"
            >
              <X size={20} />
            </button>
          </div>

          {/* Body */}
          <div className="px-6 py-5 space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <p className="text-sm font-semibold text-red-700 mb-2">
                You are about to permanently delete your account.
              </p>
              <ul className="text-xs text-red-600 space-y-1 list-disc list-inside">
                <li>All your expenses and income records will be deleted</li>
                <li>All your budget categories will be removed</li>
                <li>Your account cannot be recovered</li>
              </ul>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Type <span className="font-bold text-red-600">DELETE</span> to confirm
              </label>
              <input
                type="text"
                value={typed}
                onChange={(e) => setTyped(e.target.value)}
                placeholder="DELETE"
                disabled={deleting}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent disabled:opacity-50"
              />
            </div>

            {error && (
              <p className="text-sm text-red-600 font-medium bg-red-50 border border-red-200 rounded-lg p-3">
                {error}
              </p>
            )}
          </div>

          {/* Footer buttons */}
          <div className="px-6 pb-6 flex gap-3">
            <button
              onClick={handleClose}
              disabled={deleting}
              className="flex-1 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-600 font-semibold hover:bg-gray-50 transition-colors disabled:opacity-40"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={!canDelete || deleting}
              className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {deleting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Deleting…
                </>
              ) : (
                'Delete My Account'
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}