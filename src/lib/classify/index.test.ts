import { describe, expect, it } from 'vitest';
import {
  parseMultiLineTransactionInput,
  parseNaturalTransactionInput,
} from './index';

describe('Indonesian Keyword Classification & Natural Input Parser', () => {
  it('parses ingredient purchase phrase accurately', () => {
    const res = parseNaturalTransactionInput('Beli minyak goreng 5 liter 85 ribu', 'voice');
    expect(res.type).toBe('purchase');
    expect(res.kind).toBe('bahan');
    expect(res.qty).toBe(5);
    expect(res.unit).toBe('liter');
    expect(res.amount_idr).toBe(85000);
    expect(res.is_single_use).toBe(false);
    expect(res.confidence).toBeGreaterThanOrEqual(0.9);
  });

  it('parses single-use packaging purchase accurately', () => {
    const res = parseNaturalTransactionInput('Beli kantong kresek 3 pak 36rb', 'manual');
    expect(res.type).toBe('purchase');
    expect(res.kind).toBe('kemasan');
    expect(res.qty).toBe(3);
    expect(res.unit).toBe('pak');
    expect(res.amount_idr).toBe(36000);
    expect(res.is_single_use).toBe(true);
  });

  it('parses LPG utility purchase accurately', () => {
    const res = parseNaturalTransactionInput('Bayar gas 3kg 2 tabung Rp 44.000', 'ocr');
    expect(res.type).toBe('utility');
    expect(res.kind).toBe('energi');
    expect(res.qty).toBe(2);
    expect(res.unit).toBe('tabung');
    expect(res.amount_idr).toBe(44000);
  });

  it('splits multi-line receipts and compound sentences into multiple items', () => {
    const items = parseMultiLineTransactionInput(
      'Beli minyak goreng 5 liter 85 ribu, sama terigu 10 kg 125 ribu, terus kresek 2 pak 24 ribu',
      'voice'
    );
    expect(items).toHaveLength(3);
    expect(items[0].kind).toBe('bahan');
    expect(items[0].amount_idr).toBe(85000);
    expect(items[1].kind).toBe('bahan');
    expect(items[1].amount_idr).toBe(125000);
    expect(items[2].kind).toBe('kemasan');
    expect(items[2].is_single_use).toBe(true);
    expect(items[2].amount_idr).toBe(24000);
  });
});
