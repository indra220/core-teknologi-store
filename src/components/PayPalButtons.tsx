// src/components/PayPalButtons.tsx

'use client';

import { PayPalButtons, PayPalButtonsComponentProps } from "@paypal/react-paypal-js";
import { useCart } from "@/context/CartContext";
import { useNotification } from "@/components/notifications/NotificationProvider";
import { useRouter } from "next/navigation";

export default function PayPalPayment() {
  const { cartItems, clearCart } = useCart();
  const { showNotification } = useNotification();
  const router = useRouter();

  const createOrder: PayPalButtonsComponentProps['createOrder'] = async (_data, actions) => {
    const subtotal = cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
    const totalInUSD = (subtotal / 15000).toFixed(2);

    if (parseFloat(totalInUSD) < 0.01) {
      showNotification("Total pembayaran terlalu kecil untuk diproses.", "error");
      throw new Error("Amount too small");
    }

    return actions.order.create({
      intent: 'CAPTURE',
      purchase_units: [
        {
          amount: {
            value: totalInUSD,
            currency_code: "USD",
          },
          description: "Pembelian produk dari Core Teknologi Store",
        },
      ],
    });
  };

  const onApprove: PayPalButtonsComponentProps['onApprove'] = async (_data, actions) => {
    if (!actions.order) {
      showNotification("Terjadi kesalahan saat memproses pesanan.", "error");
      return;
    }

    try {
      const details = await actions.order.capture();
      const payerName = details.payer?.name?.given_name || 'Pelanggan';

      // Panggil API untuk menyimpan pesanan di database
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cartItems: cartItems,
          payPalOrderDetails: details,
        }),
      });

      if (!response.ok) {
        throw new Error('Gagal menyimpan pesanan ke database.');
      }
      
      showNotification(`Pembayaran berhasil! Terima kasih, ${payerName}.`, 'success');
      
      await clearCart(); // Ini akan membersihkan keranjang di state & DB
      
      // Arahkan ke halaman pesanan baru
      router.push('/orders');

    } catch (err) {
      showNotification("Pembayaran atau penyimpanan pesanan gagal.", "error");
      console.error("Approve Error:", err);
    }
  };
  
  const onError: PayPalButtonsComponentProps['onError'] = (err) => {
    showNotification("Terjadi kesalahan pembayaran PayPal.", "error");
    console.error("PayPal Error:", err);
  };

  return (
    <PayPalButtons
      style={{ layout: "vertical", color: "blue", shape: "rect", label: "pay" }}
      createOrder={createOrder}
      onApprove={onApprove}
      onError={onError}
    />
  );
}