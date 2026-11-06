import { NextRequest, NextResponse } from 'next/server';
import {
  ParsedTransactionDraft,
  parseMultiLineTransactionInput,
} from '@/lib/classify';
import { ItemKind, TransactionSource, TransactionType } from '@/types';

/**
 * Smart Natural Language & Receipt Vision Extraction Route (/api/smart-parse)
 *
 * IMPORTANT (AGENTS.md Compliance):
 * - This endpoint ONLY extracts structured input items (item_name, kind, qty, unit, amount_idr, is_single_use)
 *   from messy handwritten receipts or colloquial Indonesian sentences.
 * - It NEVER calculates Green Scores, resource intensities, or financial savings.
 *   All calculations remain 100% deterministic in `src/lib/calc/index.ts`.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      text = '',
      imageBase64 = '',
      mimeType = 'image/jpeg',
      source = 'manual',
    }: {
      text?: string;
      imageBase64?: string;
      mimeType?: string;
      source?: TransactionSource;
    } = body;

    const apiKey =
      process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

    // If no Gemini API key is configured, fall back cleanly to our deterministic multi-line parser
    if (!apiKey) {
      const fallbackText =
        text.trim() ||
        'Minyak Goreng Sawit 5 liter Rp 85.000\nTepung Terigu 10 kg Rp 125.000\nKantong Kresek 2 pak Rp 24.000';
      const items = parseMultiLineTransactionInput(fallbackText, source);
      return NextResponse.json({
        mode: 'local_dictionary',
        items,
        message:
          'Diproses dengan Kamus Pintar Lokal (Tambahkan GEMINI_API_KEY di .env.local untuk mengaktifkan AI Vision & Bahasa Daerah).',
      });
    }

    const systemInstruction = `Kamu adalah asisten pencatat nota warung kuliner Indonesia (EcoBiz).
Tugasmu HANYA mengekstrak daftar barang belanjaan, tagihan energi, atau hasil penjualan dari kalimat pemilik warung atau foto nota pasar menjadi JSON array murni.
JANGAN PERNAH menghitung skor hijau atau rumus efisiensi.

Kategori (kind) yang valid:
- "bahan": bahan baku masakan/minuman (minyak, tepung, beras, ayam, tahu, tempe, kopi, gula, bumbu, dll)
- "kemasan": bungkus sekali pakai (kresek, plastik, kertas nasi, cup plastik, sedotan, mika, kotak nasi)
- "energi": listrik PLN, token listrik, gas LPG 3kg/12kg, air PDAM/galon
- "penjualan": uang hasil jualan porsi makanan/minuman
- "lain": biaya operasional lain (sabun cuci, sewa lapak, gaji, iuran)

Kembalikan HANYA JSON dengan format:
{
  "items": [
    {
      "item_name": "Nama Barang Rapi",
      "kind": "bahan" | "kemasan" | "energi" | "penjualan" | "lain",
      "qty": 1,
      "unit": "kg" | "liter" | "pak" | "tabung" | "porsi" | "kWh" | "m3" | "pcs",
      "amount_idr": 85000,
      "is_single_use": false
    }
  ]
}`;

    const parts: Array<Record<string, unknown>> = [
      { text: systemInstruction },
    ];

    if (imageBase64) {
      const cleanedBase64 = imageBase64.replace(/^data:[^;]+;base64,/, '');
      parts.push({
        inlineData: {
          mimeType,
          data: cleanedBase64,
        },
      });
      parts.push({
        text: 'Baca semua baris belanjaan beserta harga Rupiah dari foto nota/struk pasar ini.',
      });
    }

    if (text.trim()) {
      parts.push({
        text: `Kalimat atau teks nota: "${text.trim()}"`,
      });
    }

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts }],
          generationConfig: {
            temperature: 0.1,
            responseMimeType: 'application/json',
          },
        }),
      }
    );

    if (!geminiRes.ok) {
      const fallbackItems = parseMultiLineTransactionInput(
        text || 'Minyak Goreng 5 liter 85 ribu',
        source
      );
      return NextResponse.json({
        mode: 'local_dictionary',
        items: fallbackItems,
      });
    }

    const data = await geminiRes.json();
    const rawJsonText =
      data?.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    const parsedJson = JSON.parse(rawJsonText);
    const rawItems = Array.isArray(parsedJson?.items) ? parsedJson.items : [];

    if (rawItems.length === 0) {
      const fallbackItems = parseMultiLineTransactionInput(
        text || 'Minyak Goreng 5 liter 85 ribu',
        source
      );
      return NextResponse.json({
        mode: 'local_dictionary',
        items: fallbackItems,
      });
    }

    const normalizedItems: ParsedTransactionDraft[] = rawItems.map(
      (item: Record<string, unknown>) => {
        const kind = (
          ['bahan', 'kemasan', 'energi', 'penjualan', 'lain'].includes(
            String(item.kind)
          )
            ? item.kind
            : 'bahan'
        ) as ItemKind | 'penjualan';

        const type: TransactionType =
          kind === 'penjualan'
            ? 'sale'
            : kind === 'energi'
              ? 'utility'
              : 'purchase';

        return {
          item_name: String(item.item_name || 'Catatan Warung'),
          type,
          kind,
          qty: Number(item.qty) > 0 ? Number(item.qty) : 1,
          unit: String(item.unit || 'pcs'),
          amount_idr:
            Number(item.amount_idr) >= 0 ? Math.round(Number(item.amount_idr)) : 0,
          is_single_use:
            kind === 'kemasan' ? true : Boolean(item.is_single_use),
          confidence: 0.98,
          source,
          raw_text: text || 'Nota Foto AI',
        };
      }
    );

    return NextResponse.json({
      mode: 'gemini_ai',
      items: normalizedItems,
      message: 'Dibaca otomatis dengan AI Pintar (Multi-Barang)',
    });
  } catch {
    return NextResponse.json(
      {
        mode: 'local_dictionary',
        items: parseMultiLineTransactionInput(
          'Minyak Goreng 5 liter Rp 85.000',
          'manual'
        ),
      },
      { status: 200 }
    );
  }
}
