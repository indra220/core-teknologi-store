'use client';

import { Profile } from "@/types";
import { useActionState } from "react";      // 'useActionState' diimpor dari 'react'
import { useFormStatus } from "react-dom";    // 'useFormStatus' diimpor dari 'react-dom'
import { updateUserByAdmin, deleteUserByAdmin } from "./actions";
import Link from "next/link";
import { useState } from "react";

function SubmitButton({ isDisabled }: { isDisabled: boolean }) {
  const { pending } = useFormStatus();
  const disabled = pending || isDisabled;
  return (
    <button type="submit" disabled={disabled} className={`w-full py-3 px-4 rounded-lg font-semibold text-white tracking-wide transition duration-200 ease-in-out transform hover:-translate-y-0.5 shadow-md ${disabled ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}>
      {pending ? 'Menyimpan...' : 'Simpan Perubahan'}
    </button>
  );
}

function DeleteButton({ isDisabled }: { isDisabled: boolean }) {
  const { pending } = useFormStatus();
  const disabled = pending || isDisabled;
  return (
    <button type="submit" disabled={disabled} className={`w-full sm:w-auto font-semibold px-5 py-2 rounded-lg transition duration-200 shadow-md ${disabled ? 'bg-red-300 text-white cursor-not-allowed' : 'bg-red-600 text-white hover:bg-red-700'}`}>
      {pending ? 'Menghapus...' : 'Hapus Pengguna Ini'}
    </button>
  );
}

export default function EditUserForm({ user }: { user: Profile }) {
  const initialState = { message: null, type: null };
  const [updateState, updateAction] = useActionState(updateUserByAdmin, initialState);
  const [deleteState, deleteAction] = useActionState(deleteUserByAdmin, initialState);
  
  const [adminPassword, setAdminPassword] = useState('');
  const isPasswordEmpty = adminPassword.trim() === '';

  const isEditingAdmin = user.role === 'admin';

  return (
    <>
      <div className="bg-white p-8 sm:p-10 rounded-2xl shadow-xl border border-gray-100">
        <form action={updateAction} className="space-y-6">
          <input type="hidden" name="userId" value={user.id} />
          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label>
            <input id="fullName" type="text" name="fullName" defaultValue={user.full_name || ''} className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">Username</label>
            <input id="username" type="text" name="username" defaultValue={user.username} className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">Password Baru (Opsional)</label>
            <input id="newPassword" type="password" name="newPassword" placeholder="Kosongkan jika tidak ingin diubah" className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500" />
          </div>

          <div className="border-t pt-6">
            <label htmlFor="adminPassword" className="block text-sm font-bold text-gray-800 mb-1">Password Admin Anda</label>
            <p className="text-xs text-gray-500 mb-2">Untuk menyimpan perubahan atau menghapus, masukkan password Anda.</p>
            <input 
              id="adminPassword" 
              type="password" 
              name="adminPassword" 
              required 
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              className="w-full px-4 py-2 border border-yellow-400 rounded-lg text-gray-900 focus:ring-2 focus:ring-yellow-500" 
            />
          </div>

          {updateState?.message && (
            <div className={`p-3 rounded-lg text-sm ${updateState.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
              {updateState.message}
            </div>
          )}
          
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <Link href="/admin/users" className="w-full text-center py-3 px-4 rounded-lg bg-gray-200 text-gray-800 hover:bg-gray-300 font-semibold transition-colors">Batal</Link>
            <SubmitButton isDisabled={isPasswordEmpty} />
          </div>
        </form>
      </div>

      {!isEditingAdmin && (
        <div className="mt-10 p-8 bg-red-50 border border-red-200 rounded-2xl">
          <h3 className="text-xl font-bold text-red-800">Zona Berbahaya</h3>
          <p className="mt-2 text-sm text-red-700">Menghapus pengguna adalah aksi permanen dan tidak dapat dibatalkan.</p>
          <form action={deleteAction} className="mt-6">
            <input type="hidden" name="userId" value={user.id} />
            <input type="hidden" name="adminPassword" value={adminPassword} />
            <DeleteButton isDisabled={isPasswordEmpty} />
            {deleteState?.message && <p className="mt-2 text-sm text-red-700">{deleteState.message}</p>}
          </form>
        </div>
      )}
    </>
  );
}