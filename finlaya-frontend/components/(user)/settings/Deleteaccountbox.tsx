'use client';

import { useState } from 'react';
import { Trash2, AlertTriangle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import DeleteAccountModal from '@/components/modals/DeleteAccount/Deleteaccountmodal';

export default function DeleteAccountBox() {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);

  const handleDeleted = () => {
    router.push('/login');
  };

  return (
    <>
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-red-200">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4 pb-4 border-b border-red-100">
          <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center">
            <Trash2 size={18} className="text-red-500" />
          </div>
          <div>
            <p className="font-semibold text-red-600">Delete Account</p>
            <p className="text-xs text-gray-400 mt-0.5">This action cannot be undone</p>
          </div>
        </div>

        {/* Warning Box */}
        <div className="flex items-start gap-3 p-3 bg-red-50 rounded-xl mb-4">
          <AlertTriangle size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-red-700 leading-relaxed">
            All your data, budgets, and transactions will be permanently deleted.
          </p>
        </div>

        {/* Delete Button */}
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-semibold transition-all shadow-sm hover:shadow-md"
        >
          <Trash2 size={14} />
          Delete Account
        </button>

        <p className="text-xs text-gray-400 mt-3">
          Please be certain. This action is irreversible.
        </p>
      </div>

      <DeleteAccountModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onDeleted={handleDeleted}
      />
    </>
  );
}