'use client';

import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import DeleteAccountModal from '@/components/modals/DeleteAccount/Deleteaccountmodal';

export default function DeleteAccountBox() {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);

  // Called after the modal successfully deletes + signs out
  const handleDeleted = () => {
    router.push('/login');
  };

  return (
    <>
      <div className="bg-white rounded-2xl p-6 shadow-sm border-2 border-red-100">
        {/* Section header */}
        <div className="flex items-center gap-3 mb-5 pb-4 border-b border-red-50">
          <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
            <Trash2 size={16} className="text-red-500" />
          </div>
          <div>
            <p className="font-semibold text-red-600">Delete Account</p>
            <p className="text-xs text-gray-400">Irreversible account actions</p>
          </div>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold transition-colors"
        >
          Delete Account
        </button>
        <p className="text-xs text-gray-400 mt-3">
          Once you delete your account, there is no going back. Please be certain.
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