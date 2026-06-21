// src/components/PayPalButtons.tsx

'use client';

import { PayPalButtons, PayPalButtonsComponentProps } from "@paypal/react-paypal-js";
import { useCart, CartItem } from "@/context/CartContext";
import { useNotification } from "@/components/notifications/NotificationProvider";
import { useRouter } from "next/navigation";
import NProgress from "nprogress"; // Impor NProgress untuk interaksi UI

interface ShippingAddress {
  address_line_1: string;
  admin_area_2: string;
  admin_area_1: string;
  postal_code: string;
  country_code: string;
}

interface PayPalPaymentProps {
  cartItems?: CartItem[];
  shippingAddress?: ShippingAddress;
}

export default function PayPalPayment({ cartItems: propsCartItems, shippingAddress }: PayPalPaymentProps) {
  const { cartItems: contextCartItems, clearCart } = useCart();
  const { showNotification } = useNotification();
  const router = useRouter();

  // Gunakan data dari props jika ada, jika tidak fallback ke context
  const currentCartItems = propsCartItems || contextCartItems;

  const createOrder: PayPalButtonsComponentProps['createOrder'] = async (_data, actions) => {
    const subtotal = currentCartItems.reduce((total, item) => total + item.price * item.quantity, 0);
    // Konversi ke USD (Contoh rate 15.000)
    const totalInUSD = (subtotal / 15000).toFixed(2);

    if (parseFloat(totalInUSD) < 0.01) {
      showNotification("Total pembayaran terlalu kecil untuk diproses.", "error");
      throw new Error("Amount too small");
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const purchaseUnit: any = {
      amount: {
        value: totalInUSD,
        currency_code: "USD",
      },
      description: "Pembelian produk dari Core Teknologi Store",
    };

    // MEMAKSA PAYPAL MENGGUNAKAN ALAMAT LOKAL
    if (shippingAddress) {
      purchaseUnit.shipping = {
        address: {
          address_line_1: shippingAddress.address_line_1,
          admin_area_2: shippingAddress.admin_area_2,
          admin_area_1: shippingAddress.admin_area_1,
          postal_code: shippingAddress.postal_code,
          country_code: shippingAddress.country_code || "ID",
        }
      };
    }

    return actions.order.create({
      intent: 'CAPTURE',
      purchase_units: [purchaseUnit],
    });
  };

  const onApprove: PayPalButtonsComponentProps['onApprove'] = async (_data, actions) => {
    if (!actions.order) {
      showNotification("Terjadi kesalahan saat memproses pesanan.", "error");
      return;
    }

    // Tampilkan loading bar di atas layar agar pengguna tahu proses sedang berjalan
    NProgress.start();

    try {
      const details = await actions.order.capture();
      const payerName = details.payer?.name?.given_name || 'Pelanggan';

      // MENGIRIM ALAMAT LOKAL KE BACKEND / API
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cartItems: currentCartItems,
          payPalOrderDetails: details,
          localShippingAddress: shippingAddress 
        }),
      });

      if (!response.ok) {
        throw new Error('Gagal menyimpan pesanan ke database.');
      }
      
      showNotification(`Pembayaran berhasil! Terima kasih, ${payerName}.`, 'success');
      
      await clearCart(); 
      router.push('/orders');

    } catch (err) {
      showNotification("Pembayaran atau penyimpanan pesanan gagal.", "error");
      console.error("Approve Error:", err);
    } finally {
      // Hentikan loading bar setelah semuanya selesai (berhasil/gagal)
      NProgress.done();
    }
  };
  
  const onError: PayPalButtonsComponentProps['onError'] = (err) => {
    showNotification("Terjadi kesalahan pada gateway pembayaran PayPal.", "error");
    console.error("PayPal Error:", err);
    NProgress.done(); // Pastikan NProgress berhenti jika ada error SDK
  };

  return (
    // Z-Index diatur agar pop-up PayPal tidak tertindih atau menindih elemen secara aneh
    <div className="relative z-0 w-full">
      <PayPalButtons
        // Warna 'gold' adalah warna premium dan tertinggi konversinya untuk UI PayPal
        style={{ layout: "vertical", color: "gold", shape: "rect", label: "pay" }}
        createOrder={createOrder}
        onApprove={onApprove}
        onError={onError}
        className="w-full"
      />
    </div>
  );
}