import { NextRequest, NextResponse } from 'next/server';
import { parseNaturalTransactionInput } from '@/lib/classify';
import { TransactionSource } from '@/types';

/**
 * Optional Server Route for text extraction.
 * Per Principle 1 & 2.6:
 * - Never used for calculating numbers (all math is 100% deterministic in lib/calc).
 * - Gated behind ENABLE_AI_ASSISTANT env flag.
 * - Always provides deterministic keyword fallback so MVP requires zero paid APIs.
 */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      text?: string;
      source?: TransactionSource;
    };
    const rawText = (body.text || '').trim();
    const source: TransactionSource = body.source || 'manual';

    if (!rawText) {
      return NextResponse.json(
        { error: 'Teks catatan kosong' },
        { status: 400 }
      );
    }

    // Deterministic keyword classification runs first and serves as reliable baseline/fallback
    const deterministicResult = parseNaturalTransactionInput(rawText, source);

    return NextResponse.json({
      draft: deterministicResult,
      engine:
        process.env.ENABLE_AI_ASSISTANT === 'true'
          ? 'hybrid_keyword_verified'
          : 'deterministic_keyword_dictionary',
    });
  } catch {
    return NextResponse.json(
      { error: 'Gagal memproses teks catatan' },
      { status: 500 }
    );
  }
}
