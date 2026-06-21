// src/lib/utils/export.ts
// 'use client';

import ExcelJS from 'exceljs';
import { Order } from '@/types';

// Fungsi format tanggal yang lebih lengkap (dengan jam)
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('id-ID', {
    day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });
};

/**
 * Fungsi untuk mengekspor data pesanan ke file Excel berstandar Enterprise.
 */
export const exportToExcel = async (orders: Order[], range: string) => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Laporan Penjualan');

    // =========================================================================
    // 1. ATUR LEBAR KOLOM SECARA MANUAL (Tanpa mendefinisikan key/header)
    // Ini memastikan ExcelJS tidak menimpa Baris ke-1 secara otomatis
    // =========================================================================
    worksheet.getColumn(1).width = 6;  // A: No
    worksheet.getColumn(2).width = 22; // B: Tanggal Transaksi
    worksheet.getColumn(3).width = 25; // C: ID Pesanan
    worksheet.getColumn(4).width = 25; // D: Pelanggan
    worksheet.getColumn(5).width = 45; // E: Detail Produk & Varian
    worksheet.getColumn(6).width = 20; // F: Total Belanja
    worksheet.getColumn(7).width = 20; // G: Status
    worksheet.getColumn(8).width = 45; // H: Alamat Pengiriman

    // =========================================================================
    // 2. STYLING JUDUL LAPORAN (BARIS 1 & 2)
    // =========================================================================
    // Judul Utama
    worksheet.mergeCells('A1:H1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = 'LAPORAN TRANSAKSI - CORE TEKNOLOGI';
    titleCell.font = { name: 'Arial', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F46E5' } }; // Indigo-600
    titleCell.alignment = { vertical: 'middle', horizontal: 'center' };

    // Subjudul (Waktu & Rentang)
    worksheet.mergeCells('A2:H2');
    const subtitleCell = worksheet.getCell('A2');
    subtitleCell.value = `Rentang: ${range} | Diekspor pada: ${formatDate(new Date().toISOString())}`;
    subtitleCell.font = { name: 'Arial', size: 10, italic: true, color: { argb: 'FF4F46E5' } };
    subtitleCell.alignment = { vertical: 'middle', horizontal: 'center' };

    // Baris 3 dibiarkan kosong sebagai jarak (Spacer)
    worksheet.addRow([]);

    // =========================================================================
    // 3. HEADER KOLOM TABEL MANUAL (BARIS 4)
    // =========================================================================
    const headerRow = worksheet.addRow([
      'No', 
      'Tanggal Transaksi', 
      'ID Pesanan', 
      'Pelanggan', 
      'Detail Produk & Varian', 
      'Total Belanja', 
      'Status', 
      'Alamat Pengiriman'
    ]);

    // Memberikan gaya pada Header Tabel
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } }; // Slate-800
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = {
          top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' }
      };
    });

    // =========================================================================
    // 4. MEMASUKKAN & MEMFORMAT DATA PESANAN (Mulai dari Baris 5 ke bawah)
    // =========================================================================
    orders.forEach((order, index) => {
      // Menyusun Alamat
      const formattedAddress = order.shipping_address 
        ? `${order.shipping_address.address_line_1}, ${order.shipping_address.admin_area_2}, ${order.shipping_address.admin_area_1} ${order.shipping_address.postal_code}`
        : 'Tidak ada alamat';

      // Menyusun Detail Produk
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const produkDetail = (order.order_items && order.order_items.length > 0)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ? order.order_items.map((item: any) => {
            const varian = item.variant_name || item.variant || item.varian || item.product_variant || '';
            const varianText = varian ? ` (${varian})` : '';
            return `• ${item.product_name}${varianText} x${item.quantity}`;
          }).join('\n')
        : '-';

      // Memasukkan data ke dalam baris menggunakan Array berurutan
      const row = worksheet.addRow([
        index + 1,                                                                     // Kolom A (No)
        formatDate(order.created_at),                                                  // Kolom B (Tanggal)
        order.paypal_order_id || `INV-${order.id.split('-')[0].toUpperCase()}`,        // Kolom C (ID)
        order.profiles?.full_name || order.profiles?.username || 'Tanpa Nama',         // Kolom D (Pelanggan)
        produkDetail,                                                                  // Kolom E (Produk)
        order.total_amount,                                                            // Kolom F (Total)
        order.status,                                                                  // Kolom G (Status)
        formattedAddress                                                               // Kolom H (Alamat)
      ]);

      // Styling untuk masing-masing sel data di baris tersebut
      row.eachCell((cell, colNumber) => {
          cell.border = {
              top: { style: 'thin', color: { argb: 'FFE2E8F0' } }, 
              left: { style: 'thin', color: { argb: 'FFE2E8F0' } }, 
              bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } }, 
              right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
          };
          
          // Izinkan teks turun ke baris baru untuk kolom Produk dan Alamat
          if (colNumber === 5 || colNumber === 8) {
             cell.alignment = { vertical: 'middle', wrapText: true }; 
          } else {
             cell.alignment = { vertical: 'middle' }; 
          }
      });
      
      // Format khusus: Rata tengah untuk No dan Status
      row.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' };
      row.getCell(7).alignment = { vertical: 'middle', horizontal: 'center' };
      // Format mata uang Rupiah untuk kolom Total Belanja (F)
      row.getCell(6).numFmt = '"Rp"#,##0';
    });

    // =========================================================================
    // 5. BARIS KESIMPULAN (TOTAL PENDAPATAN)
    // =========================================================================
    worksheet.addRow([]); // Baris kosong untuk pemisah
    const totalRevenue = orders.reduce((sum, order) => sum + Number(order.total_amount || 0), 0);
    
    const summaryRow = worksheet.addRow([
      '', '', '', '', 
      'TOTAL PENDAPATAN:', // Masuk ke Kolom E (Produk)
      totalRevenue,        // Masuk ke Kolom F (Total)
      '', ''
    ]);

    // Format khusus untuk sel baris Total
    const labelCell = summaryRow.getCell(5); // Kolom E
    labelCell.font = { bold: true, size: 12 };
    labelCell.alignment = { horizontal: 'right', vertical: 'middle' };

    const valueCell = summaryRow.getCell(6); // Kolom F
    valueCell.font = { bold: true, size: 12, color: { argb: 'FF059669' } }; // Warna Emerald
    valueCell.alignment = { horizontal: 'left', vertical: 'middle' };
    valueCell.numFmt = '"Rp"#,##0';

    // =========================================================================
    // 6. PROSES PENGUNDUHAN BROWSER
    // =========================================================================
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `Laporan_Transaksi_CT_${range.replace(/ /g, '_').toLowerCase()}.xlsx`;
    a.click();
    window.URL.revokeObjectURL(url);
};