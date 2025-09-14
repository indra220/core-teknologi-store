// src/app/admin/users/[id]/edit/page.tsx
'use client';

import { useState, useEffect } from 'react'; // 'Suspense' is removed
import { createClient } from '@/lib/supabase/client';
import { notFound, useParams } from "next/navigation";
// 'Link' is removed
import { Profile } from "@/types";
import EditUserForm from "./EditUserForm";

// Komponen Skeleton untuk Form Edit
const EditFormSkeleton = () => (
  <div className="bg-white p-8 sm:p-10 rounded-2xl shadow-xl border border-gray-100 animate-pulse">
    <div className="space-y-6">
      <div>
        <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
        <div className="h-10 bg-gray-200 rounded w-full"></div>
      </div>
      <div>
        <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
        <div className="h-10 bg-gray-200 rounded w-full"></div>
      </div>
      <div>
        <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
        <div className="h-10 bg-gray-200 rounded w-full"></div>
      </div>
      <div className="border-t pt-6">
        <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-3"></div>
        <div className="h-10 bg-gray-200 rounded w-full"></div>
      </div>
    </div>
  </div>
);

export default function EditUserPage() {
  const params = useParams<{ id: string }>();
  const userId = params.id;
  
  const [userToEdit, setUserToEdit] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    const supabase = createClient();
    const fetchUser = async () => {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single<Profile>();
        
        if (error || !data) {
            notFound();
        } else {
            setUserToEdit(data);
        }
        setLoading(false);
    };

    fetchUser();
  }, [userId]);

  if (loading) {
    return (
        <div className="max-w-4xl mx-auto py-10 px-4">
            <header className="mb-8">
                <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Edit Pengguna</h1>
                <p className="mt-2 text-lg text-gray-600">
                Memuat data untuk pengguna...
                </p>
            </header>
            <EditFormSkeleton />
        </div>
    );
  }

  if (!userToEdit) {
    return notFound();
  }

  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      <header className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Edit Pengguna</h1>
        <p className="mt-2 text-lg text-gray-600">
          Anda sedang mengedit profil untuk <span className='font-semibold'>{userToEdit.username}</span>.
        </p>
      </header>
      <EditUserForm user={userToEdit} />
    </div>
  );
}