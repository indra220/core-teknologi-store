// src/app/admin/orders/[id]/UpdateStatusForm.tsx
'use client';

import { Order, OrderStatus } from "@/types";
import { useEffect } from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { updateOrderStatus } from "../actions";
import { useNotification } from "@/components/notifications/NotificationProvider";
import NProgress from 'nprogress'; // <-- Impor NProgress

function SubmitButton({ disabled }: { disabled: boolean }) {
    const { pending } = useFormStatus();
    return (
        <button 
            type="submit" 
            disabled={disabled || pending}
            className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
            {pending ? 'Menyimpan...' : 'Simpan Perubahan'}
        </button>
    );
}

export default function UpdateStatusForm({ order }: { order: Order }) {
    const initialState = { success: false, message: "" };
    const [state, formAction] = useActionState(updateOrderStatus, initialState);
    const { showNotification } = useNotification();

    useEffect(() => {
        if (state.message) {
            NProgress.done(); // <-- Hentikan TopLoader saat ada hasil
            showNotification(state.message, state.success ? 'success' : 'error');
        }
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
        <form action={formAction} className="flex items-center gap-4" onSubmit={() => NProgress.start()}>
            <input type="hidden" name="orderId" value={order.id} />
            <input type="hidden" name="userId" value={order.user_id} />
            <div>
                <label htmlFor="status" className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-200">
                    Status Pesanan
                </label>
                <select
                    id="status"
                    name="status"
                    defaultValue={order.status}
                    disabled={isFormDisabled}
                    className="mt-2 block w-full rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 dark:bg-gray-700 dark:text-white ring-1 ring-inset ring-gray-300 dark:ring-gray-600 focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6 disabled:opacity-70"
                >
                    {availableOptions.map(status => (
                        <option key={status} value={status}>{status}</option>
                    ))}
                </select>
            </div>
            <div className="self-end">
                <SubmitButton disabled={isFormDisabled} />
            </div>
        </form>
    );
}