'use client';

import { useState } from 'react';
import { X, TriangleAlert, Check } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import api from '@/lib/api/client';

interface DeleteAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDeleted: () => void;
}

export default function DeleteAccountModal({ isOpen, onClose, onDeleted }: DeleteAccountModalProps) {
  const [typed, setTyped] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  const canDelete = typed === 'DELETE';

  const handleConfirm = async () => {
    if (!canDelete) return;
    setDeleting(true);
    setError('');
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;
      if (!accessToken) {
        setError('No active session. Please log in again.');
        setDeleting(false);
        return;
      }
      const result = await api.auth.deleteAccount(accessToken);
      if (result.error) throw new Error(result.error);
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
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" onClick={handleClose} />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-in fade-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
          
          {/* Header */}
          <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
                <TriangleAlert size={18} className="text-red-500" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Delete Account</h2>
                <p className="text-xs text-gray-400 mt-0.5">This action cannot be undone</p>
              </div>
            </div>
            <button onClick={handleClose} disabled={deleting} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-40">
              <X size={18} />
            </button>
          </div>

          {/* Body */}
          <div className="px-6 py-5 space-y-4">
            {/* Warning Box */}
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <p className="text-sm font-semibold text-red-700 mb-2">Warning: This is permanent</p>
              <ul className="text-xs text-red-600 space-y-1.5">
                <li className="flex items-start gap-2"><span className="text-red-400 mt-0.5">•</span> All expenses and income records will be deleted</li>
                <li className="flex items-start gap-2"><span className="text-red-400 mt-0.5">•</span> All budget categories will be removed</li>
                <li className="flex items-start gap-2"><span className="text-red-400 mt-0.5">•</span> Your account cannot be recovered</li>
              </ul>
            </div>

            {/* Confirmation Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type <span className="font-bold text-red-600">DELETE</span> to confirm
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={typed}
                  onChange={(e) => setTyped(e.target.value.toUpperCase())}
                  placeholder="DELETE"
                  disabled={deleting}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold tracking-wide text-center text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-red-300 focus:border-red-400 disabled:opacity-50 placeholder:font-normal placeholder:tracking-normal"
                />
                {canDelete && <Check size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500" />}
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <p className="text-sm text-red-600 font-medium bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2">
                <TriangleAlert size={14} className="mt-0.5 flex-shrink-0" />
                {error}
              </p>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 pb-6 flex gap-3">
            <button onClick={handleClose} disabled={deleting} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-40">
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={!canDelete || deleting}
              className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
            >
              {deleting ? (
                <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Deleting…</>
              ) : (
                'Delete Account'
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}