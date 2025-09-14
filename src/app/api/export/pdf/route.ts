import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import fs from 'fs';
import path from 'path';
import { Order } from '@/types';

// Fungsi helper (tidak berubah)
const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency', currency: 'IDR', minimumFractionDigits: 0,
    }).format(amount);
};
const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
        day: '2-digit', month: 'long', year: 'numeric'
    });
};

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const timeRange = parseInt(searchParams.get('timeRange') || '30', 10);
        const searchTerm = searchParams.get('searchTerm') || '';
        const rangeText = `${timeRange} Hari Terakhir`;

        const supabase = await createClient();

        // Logika pengambilan data (tidak berubah)
        const now = new Date();
        const startDate = new Date();
        startDate.setDate(now.getDate() - timeRange);

        let query = supabase
            .from('orders')
            .select('*, profiles ( username )')
            .eq('status', 'Selesai')
            .gte('created_at', startDate.toISOString())
            .order('created_at', { ascending: false });

        if (searchTerm) {
            query = query.ilike('profiles.username', `%${searchTerm}%`);
        }

        const { data: ordersData, error: ordersError } = await query;
        const orders = ordersData as unknown as Order[];

        if (ordersError) {
            throw new Error(`Gagal mengambil data pesanan: ${ordersError.message}`);
        }

        // --- Inisialisasi Dokumen dan Variabel Desain ---
        const doc = new jsPDF();
        const pageHeight = doc.internal.pageSize.height;
        const pageWidth = doc.internal.pageSize.width;

        const COLORS = {
            primary: '#2563EB',      // Biru-600
            textDark: '#111827',     // Abu-abu-900
            text: '#374151',         // Abu-abu-700
            textLight: '#6B7280',    // Abu-abu-500
            border: '#E5E7EB',       // Abu-abu-200
            white: '#FFFFFF'
        };
        const FONT = 'helvetica';

        // --- Header Dokumen ---
        try {
            const imagePath = path.join(process.cwd(), 'public', 'images', 'Logo-core.png');
            const imageBuffer = fs.readFileSync(imagePath);
            doc.addImage(imageBuffer, 'PNG', 15, 12, 22, 22);
        } catch (e) { console.error("Gagal memuat file logo:", e); }

        doc.setFont(FONT, 'bold');
        doc.setFontSize(20);
        doc.setTextColor(COLORS.textDark);
        doc.text('Laporan Penjualan', pageWidth - 15, 20, { align: 'right' });

        doc.setFont(FONT, 'normal');
        doc.setFontSize(10);
        doc.setTextColor(COLORS.textLight);
        doc.text('Core Teknologi Store', pageWidth - 15, 27, { align: 'right' });
        doc.text(rangeText, pageWidth - 15, 32, { align: 'right' });

        // --- Kartu Statistik (Summary Cards) ---
        const totalRevenue = orders.reduce((sum, order) => sum + order.total_amount, 0);
        const uniqueCustomers = new Set(orders.map(o => o.user_id)).size;
        
        const startY = 45; // Posisi Y awal untuk kartu
        const cardWidth = (pageWidth - 45) / 3;
        const cardHeight = 25;

        // Fungsi untuk menggambar kartu
        const drawCard = (x: number, y: number, title: string, value: string, iconColor: string) => {
            doc.setFillColor(COLORS.white);
            doc.setDrawColor(COLORS.border);
            doc.setLineWidth(0.3);
            doc.roundedRect(x, y, cardWidth, cardHeight, 3, 3, 'FD'); // Kartu dengan sudut tumpul

            doc.setFillColor(iconColor);
            doc.circle(x + 10, y + 13, 3, 'F'); // Lingkaran sebagai ikon visual

            doc.setFontSize(9).setTextColor(COLORS.textLight).setFont(FONT, 'normal');
            doc.text(title, x + 18, y + 10);
            
            doc.setFontSize(14).setTextColor(COLORS.textDark).setFont(FONT, 'bold');
            doc.text(value, x + 18, y + 18);
        };
        
        drawCard(15, startY, 'Total Pendapatan', formatCurrency(totalRevenue), '#10B981'); // Hijau
        drawCard(15 + cardWidth + 7.5, startY, 'Total Pesanan', orders.length.toString(), '#3B82F6'); // Biru
        drawCard(15 + (cardWidth + 7.5) * 2, startY, 'Pelanggan Unik', uniqueCustomers.toString(), '#8B5CF6'); // Ungu
        
        doc.setFont(FONT, 'normal'); // Reset font style

        // --- Tabel Data dengan Desain Baru ---
        const tableColumn = ["#", "Tanggal", "ID Pesanan", "Pengguna", "Total", "Status"];
        const tableRows = orders.map((order, index) => [
            index + 1,
            formatDate(order.created_at),
            order.paypal_order_id,
            order.profiles?.username || 'N/A',
            formatCurrency(order.total_amount),
            order.status,
        ]);

        autoTable(doc, {
            startY: startY + cardHeight + 12,
            head: [tableColumn],
            body: tableRows,
            theme: 'striped', // Menggunakan tema 'striped' yang lebih bersih
            styles: {
                font: FONT,
                fontSize: 9,
                cellPadding: 2.5,
                textColor: COLORS.text,
            },
            headStyles: {
                fillColor: '#F3F4F6', // Header abu-abu muda
                textColor: COLORS.textDark,
                fontStyle: 'bold',
                fontSize: 9.5,
                halign: 'center'
            },
            columnStyles: {
                0: { halign: 'center', cellWidth: 8 },
                3: { fontStyle: 'bold' },
                4: { halign: 'right' },
                5: { halign: 'center' }
            },
            didDrawPage: (data) => {
              // --- Footer Profesional ---
              doc.setFontSize(8);
              doc.setTextColor(COLORS.textLight);
              doc.setDrawColor(COLORS.border);
              doc.line(15, pageHeight - 15, pageWidth - 15, pageHeight - 15);
              doc.text(
                  `Laporan Penjualan - Core Teknologi Store`,
                  data.settings.margin.left,
                  pageHeight - 10
              );
              doc.text(
                  `Halaman ${data.pageNumber} dari ${doc.getNumberOfPages()}`,
                  pageWidth - data.settings.margin.right,
                  pageHeight - 10,
                  { align: 'right' }
              );
            },
        });

        const pdfBuffer = doc.output('arraybuffer');

        return new NextResponse(pdfBuffer, {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="laporan_penjualan_${rangeText.replace(/ /g, '_').toLowerCase()}.pdf"`,
            },
        });

    } catch (error: unknown) {
        console.error('API Error:', error);
        const message = error instanceof Error ? error.message : 'Terjadi kesalahan pada server';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}