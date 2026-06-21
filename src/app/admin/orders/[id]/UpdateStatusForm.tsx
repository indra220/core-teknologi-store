// src/app/admin/orders/[id]/UpdateStatusForm.tsx
'use client';

import { Order, OrderStatus } from "@/types";
import { useEffect, useActionState } from "react";
import { useFormStatus } from "react-dom";
import { updateOrderStatus } from "../actions";
import { useNotification } from "@/components/notifications/NotificationProvider";
import NProgress from 'nprogress';
import { TagIcon, CheckCircleIcon, ChevronDownIcon } from '@heroicons/react/24/outline';

function SubmitButton({ disabled }: { disabled: boolean }) {
    const { pending } = useFormStatus();
    return (
        <button 
            type="submit" 
            disabled={disabled || pending}
            className="w-full sm:w-auto flex items-center justify-center rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
        >
            {pending ? (
                <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Menyimpan
                </>
            ) : (
                <>
                    <CheckCircleIcon className="h-4 w-4 mr-2" />
                    Simpan
                </>
            )}
        </button>
    );
}

export default function UpdateStatusForm({ order, onSuccess }: { order: Order, onSuccess?: () => void }) {
    const initialState = { success: false, message: "" };
    const [state, formAction] = useActionState(updateOrderStatus, initialState);
    const { showNotification } = useNotification();

    useEffect(() => {
        if (state.message) {
            NProgress.done(); 
            showNotification(state.message, state.success ? 'success' : 'error');
            
            if (state.success && onSuccess) {
                onSuccess();
            }
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [state, showNotification]);

    const statusOptions: OrderStatus[] = ['Menunggu Konfirmasi', 'Diproses', 'Dalam Pengiriman', 'Selesai', 'Dibatalkan'];

    const availableOptions = statusOptions.filter(opt => {
        if (order.status === 'Dibatalkan' || order.status === 'Selesai') return opt === order.status;
        if (order.status === 'Diproses') return ['Diproses', 'Dalam Pengiriman', 'Dibatalkan'].includes(opt);
        if (order.status === 'Dalam Pengiriman') return ['Dalam Pengiriman', 'Selesai'].includes(opt);
        return true;
    });
    
    const isFormDisabled = order.status === 'Selesai' || order.status === 'Dibatalkan';

    return (
        <div className="flex flex-col h-full justify-center">
            <div className="flex items-center gap-2 mb-4">
                <TagIcon className="h-5 w-5 text-slate-400" />
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">Status Operasional</h2>
            </div>

            <form action={formAction} className="flex flex-col sm:flex-row gap-3" onSubmit={() => NProgress.start()}>
                <input type="hidden" name="orderId" value={order.id} />
                <input type="hidden" name="userId" value={order.user_id} />
                
                {/* Penambahan div relative untuk menempatkan custom icon */}
                <div className="relative flex-1">
                    <label htmlFor="status" className="sr-only">Status Pesanan</label>
                    <select
                        id="status"
                        name="status"
                        defaultValue={order.status}
                        disabled={isFormDisabled}
                        // PERBAIKAN: Ditambahkan 'appearance-none' dan 'pr-12' (padding kanan) agar lebih lega
                        className="appearance-none block w-full rounded-xl border-0 py-2.5 pl-3.5 pr-12 bg-white text-slate-900 ring-1 ring-inset ring-slate-200 focus:ring-2 focus:ring-indigo-500/50 sm:text-sm font-medium shadow-sm outline-none transition-all cursor-pointer dark:bg-slate-800 dark:text-white dark:ring-slate-700 disabled:opacity-90 disabled:bg-slate-100 disabled:text-slate-700 dark:disabled:bg-slate-800/50 dark:disabled:text-slate-300 disabled:cursor-not-allowed"
                    >
                        {availableOptions.map(status => (
                            <option key={status} value={status}>{status}</option>
                        ))}
                    </select>
                    
                    {/* Custom Arrow Icon yang proporsional posisinya */}
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5">
                        <ChevronDownIcon className="h-4 w-4 text-slate-400 dark:text-slate-500" aria-hidden="true" />
                    </div>
                </div>
                
                {!isFormDisabled && <SubmitButton disabled={isFormDisabled} />}
            </form>
            
            {isFormDisabled && (
                <div className="mt-3 bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-lg border border-slate-100 dark:border-slate-700/50 text-center">
                    <p className="text-[11px] font-medium text-slate-500">
                        Pesanan ini telah dikunci dan statusnya tidak dapat diubah lagi.
                    </p>
                </div>
            )}
        </div>
    );
}