// src/app/api/export/pdf/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import fs from 'fs';
import path from 'path';
import { Order } from '@/types';

interface ExportOrderItem {
    product_id: string;
    product_name?: string;
    brand?: string;
    quantity: number;
    varian?: string;
    variant?: string;
    variant_name?: string;
    product_variant?: string;
}

interface OrderExtended extends Omit<Order, 'order_items' | 'profiles'> {
    order_items?: ExportOrderItem[];
    profiles?: {
        username?: string | null;
        full_name?: string | null;
    } | null;
}

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency', currency: 'IDR', minimumFractionDigits: 0,
    }).format(amount);
};

const formatNumberOnly = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
        minimumFractionDigits: 0,
    }).format(amount);
};

const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
        day: '2-digit', month: 'short', year: 'numeric'
    });
};

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const timeRange = parseInt(searchParams.get('timeRange') || '30', 10);
        const searchTerm = searchParams.get('searchTerm') || '';
        const rangeText = `${timeRange} Hari Terakhir`;

        const supabase = await createClient();

        const now = new Date();
        const startDate = new Date();
        startDate.setDate(now.getDate() - timeRange);

        let query = supabase
            .from('orders')
            .select('*, profiles ( username, full_name ), order_items (*)')
            .eq('status', 'Selesai')
            .gte('created_at', startDate.toISOString())
            .order('created_at', { ascending: false });

        if (searchTerm) {
            query = query.ilike('profiles.username', `%${searchTerm}%`);
        }

        const { data: ordersData, error: ordersError } = await query;
        const orders = (ordersData || []) as unknown as OrderExtended[];

        if (ordersError) {
            throw new Error(`Gagal mengambil data pesanan: ${ordersError.message}`);
        }

        const productIds = [
            ...new Set(
                orders.flatMap(o => o.order_items?.map((i: ExportOrderItem) => i.product_id)).filter(Boolean)
            )
        ] as string[];

        let laptopsMap: Record<string, { brand: string, name: string }> = {};
        
        if (productIds.length > 0) {
            const { data: laptops } = await supabase
                .from('laptops')
                .select('product_id, brand, name')
                .in('product_id', productIds);
                
            if (laptops) {
                laptopsMap = laptops.reduce((acc, l) => {
                    if (l.product_id) acc[l.product_id] = { brand: l.brand, name: l.name };
                    return acc;
                }, {} as Record<string, { brand: string, name: string }>);
            }
        }

        // Dikembalikan ke orientasi Potret ('p')
        const doc = new jsPDF('p', 'mm', 'a4');
        const pageWidth = doc.internal.pageSize.width;
        const pageHeight = doc.internal.pageSize.height;

        const COLORS = {
            primary: '#4F46E5', heading: '#0F172A', text: '#334155',
            muted: '#64748B', border: '#E2E8F0', bgLight: '#F8FAFC'
        };
        const FONT = 'helvetica';

        try {
            const imagePath = path.join(process.cwd(), 'public', 'images', 'Logo-core.png');
            const imageBuffer = fs.readFileSync(imagePath);
            doc.addImage(imageBuffer, 'PNG', 14, 15, 20, 20);
        } catch (e) { 
            console.error("Gagal memuat file logo:", e); 
            doc.setFont(FONT, 'bold'); doc.setFontSize(16); doc.setTextColor(COLORS.heading);
            doc.text('CORE TEKNOLOGI', 14, 25);
        }

        doc.setFont(FONT, 'bold'); doc.setFontSize(18); doc.setTextColor(COLORS.heading);
        doc.text('LAPORAN PENJUALAN', pageWidth - 14, 22, { align: 'right' });

        doc.setFont(FONT, 'normal'); doc.setFontSize(9); doc.setTextColor(COLORS.muted);
        doc.text(`Periode: ${rangeText}`, pageWidth - 14, 28, { align: 'right' });
        doc.text(`Dicetak pada: ${formatDate(new Date().toISOString())}`, pageWidth - 14, 33, { align: 'right' });

        doc.setDrawColor(COLORS.border); doc.setLineWidth(0.5);
        doc.line(14, 40, pageWidth - 14, 40);

        const totalRevenue = orders.reduce((sum, order) => sum + order.total_amount, 0);
        const uniqueCustomers = new Set(orders.map(o => o.user_id)).size;
        const startY = 48;

        doc.setFillColor(COLORS.bgLight); doc.setDrawColor(COLORS.border); doc.setLineWidth(0.2);
        doc.roundedRect(14, startY, pageWidth - 28, 24, 2, 2, 'FD');

        // Koordinat Ringkasan disesuaikan ulang untuk ukuran kertas Potret
        doc.setFontSize(8); doc.setTextColor(COLORS.muted); doc.setFont(FONT, 'bold');
        doc.text('TOTAL PENDAPATAN', 20, startY + 8);
        doc.setFontSize(14); doc.setTextColor(COLORS.primary);
        doc.text(formatCurrency(totalRevenue), 20, startY + 18);

        doc.setDrawColor(COLORS.border); doc.line(75, startY + 4, 75, startY + 20);

        doc.setFontSize(8); doc.setTextColor(COLORS.muted); doc.setFont(FONT, 'bold');
        doc.text('TOTAL TRANSAKSI', 82, startY + 8);
        doc.setFontSize(14); doc.setTextColor(COLORS.heading);
        doc.text(`${orders.length} Pesanan`, 82, startY + 18);

        doc.line(135, startY + 4, 135, startY + 20);

        doc.setFontSize(8); doc.setTextColor(COLORS.muted); doc.setFont(FONT, 'bold');
        doc.text('PELANGGAN UNIK', 142, startY + 8);
        doc.setFontSize(14); doc.setTextColor(COLORS.heading);
        doc.text(`${uniqueCustomers} Akun`, 142, startY + 18);

        const tableColumn = ["NO", "TANGGAL", "NO. PESANAN", "PELANGGAN", "DETAIL PRODUK", "TOTAL (Rp)"];
        
        const tableRows = orders.map((order, index) => {
            const rowNumber = String(index + 1);
            const orderIdFormatted = order.paypal_order_id || `INV-${order.id.split('-')[0].toUpperCase()}`;
            const customerName = order.profiles?.full_name || order.profiles?.username || 'Tanpa Nama';
            
            const productDetails = order.order_items?.map((item: ExportOrderItem) => {
                const laptopInfo = laptopsMap[item.product_id];
                const name = item.product_name || laptopInfo?.name || 'Produk Tidak Diketahui';
                const brand = item.brand || laptopInfo?.brand || '-';
                
                const varian = item.variant_name || item.variant || item.varian || item.product_variant || null; 
                const varianText = varian ? ` - ${varian}` : '';
                
                return `• ${name} (x${item.quantity})\n  Brand: ${brand}${varianText}`;
            }).join('\n\n') || '-';

            return [
                rowNumber,
                formatDate(order.created_at),
                orderIdFormatted,
                customerName,
                productDetails,
                formatNumberOnly(order.total_amount),
            ];
        });

        autoTable(doc, {
            startY: startY + 32,
            head: [tableColumn],
            body: tableRows,
            theme: 'plain', 
            styles: { 
                font: FONT, 
                fontSize: 8, 
                valign: 'middle',
                cellPadding: { top: 4, right: 3, bottom: 4, left: 3 }, 
                textColor: COLORS.text 
            },
            headStyles: { 
                fillColor: COLORS.bgLight, 
                textColor: COLORS.muted, 
                fontStyle: 'bold', 
                fontSize: 7.5, 
                valign: 'middle',
                lineWidth: { bottom: 0.5, top: 0.5 }, 
                lineColor: COLORS.border 
            },
            bodyStyles: { 
                lineWidth: { bottom: 0.2 }, 
                lineColor: COLORS.border 
            },
            // Penyesuaian Lebar Kolom untuk Potret (Total lebar tabel = 182mm)
            columnStyles: { 
                0: { cellWidth: 12, halign: 'center', fontStyle: 'bold', textColor: COLORS.heading }, // NO (Dilebarkan agar sejajar)
                1: { cellWidth: 20 }, // TANGGAL
                2: { cellWidth: 32, fontStyle: 'bold' }, // NO PESANAN
                3: { cellWidth: 35 }, // PELANGGAN
                4: { cellWidth: 58 }, // DETAIL PRODUK
                5: { cellWidth: 25, halign: 'right', fontStyle: 'bold', textColor: COLORS.heading } // TOTAL (Rp)
            },
            didParseCell: function(data) {
                if (data.section === 'head' && data.column.index === 0) data.cell.styles.halign = 'center';
                if (data.section === 'head' && data.column.index === 5) data.cell.styles.halign = 'right';
            },
            didDrawPage: (data) => {
              const footerY = pageHeight - 15;
              doc.setDrawColor(COLORS.border); doc.setLineWidth(0.5); doc.line(14, footerY - 5, pageWidth - 14, footerY - 5);
              doc.setFontSize(7.5); doc.setTextColor(COLORS.muted); doc.setFont(FONT, 'normal');
              doc.text(`Dokumen ini dibuat secara otomatis oleh sistem Core Teknologi Store.`, 14, footerY);
              doc.text(`Hal ${data.pageNumber} / ${doc.getNumberOfPages()}`, pageWidth - 14, footerY, { align: 'right' });
            },
        });

        const pdfBuffer = doc.output('arraybuffer');
        return new NextResponse(pdfBuffer, { 
            headers: { 
                'Content-Type': 'application/pdf', 
                'Content-Disposition': `attachment; filename="laporan_penjualan_${rangeText.replace(/ /g, '_').toLowerCase()}.pdf"` 
            } 
        });
    } catch (error: unknown) {
        return NextResponse.json({ error: error instanceof Error ? error.message : 'Terjadi kesalahan' }, { status: 500 });
    }
}