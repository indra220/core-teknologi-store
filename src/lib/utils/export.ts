'use client';

import ExcelJS from 'exceljs';
import { Order } from '@/types';

// Hapus fungsi 'formatCurrency' yang tidak terpakai

// Fungsi ini masih digunakan oleh exportToExcel
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('id-ID', {
    day: '2-digit', month: 'long', year: 'numeric'
  });
};

/**
 * Fungsi untuk mengekspor data pesanan ke file Excel.
 */
export const exportToExcel = async (orders: Order[], range: string) => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Laporan Penjualan');
  
    worksheet.columns = [
      { header: 'No', key: 'no', width: 5 },
      { header: 'Tanggal', key: 'tanggal', width: 20 },
      { header: 'ID Pesanan', key: 'id_pesanan', width: 25 },
      { header: 'Pengguna', key: 'pengguna', width: 15 },
      { header: 'Total', key: 'total', width: 20, style: { numFmt: '"Rp"#,##0' } },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Alamat Pengiriman', key: 'alamat', width: 40 },
    ];
  
    worksheet.getRow(1).font = { bold: true };
  
    orders.forEach((order, index) => {
      worksheet.addRow({
        no: index + 1,
        tanggal: formatDate(order.created_at),
        id_pesanan: order.paypal_order_id,
        pengguna: order.profiles?.username || 'N/A',
        total: order.total_amount,
        status: order.status,
        alamat: order.shipping_address ? `${order.shipping_address.address_line_1}, ${order.shipping_address.admin_area_2}` : 'N/A',
      });
    });
  
    const totalRevenue = orders.reduce((sum, order) => sum + order.total_amount, 0);
    worksheet.addRow({}); 
    const summaryRow = worksheet.addRow({
      pengguna: 'TOTAL PENDAPATAN',
      total: totalRevenue,
    });
  
    summaryRow.font = { bold: true };
    summaryRow.getCell('total').alignment = { horizontal: 'left' };
  
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `laporan_penjualan_${range.replace(/ /g, '_').toLowerCase()}.xlsx`;
    a.click();
    window.URL.revokeObjectURL(url);
};