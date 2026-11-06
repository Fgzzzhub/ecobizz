import { test, expect } from '@playwright/test';

test.describe('EcoBiz End-to-End Smoke Test', () => {
  test('loads Warung Bu Ani 8-week demo, inspects provenance, records a transaction, and resets demo', async ({
    page,
  }) => {
    await page.goto('/');

    // 1. Load 8-week Demo Mode ("Warung Bu Ani") in 1 click from Onboarding
    const demoBtn = page.getByTestId('btn-load-demo-onboarding');
    await expect(demoBtn).toBeVisible();
    await demoBtn.click();

    // 2. Verify Weekly Report opens with Green Score Stamp & Honesty Disclaimer
    await expect(
      page.getByText('Estimasi, bukan sertifikasi hijau')
    ).toBeVisible();
    await expect(page.getByText('CAP NOTA HIJAU')).toBeVisible();

    // 3. Open "Dari mana angka ini?" provenance modal
    const provenanceButtons = page.getByRole('button', {
      name: /Dari mana angka ini\?/i,
    });
    await provenanceButtons.first().click();
    await expect(
      page.getByText('Transparansi Hitungan Deterministik')
    ).toBeVisible();
    await page
      .getByRole('button', { name: /Mengerti, Tutup Rincian/i })
      .click();

    // 4. Navigate to Catat tab, enter a transaction via Ketik Cepat, confirm & save
    await page.getByTestId('nav-catat').click();
    await page.getByTestId('tab-catat-manual').click();
    await page
      .getByTestId('input-catat-text')
      .fill('Beli minyak goreng 5 liter 85 ribu');
    await page.getByTestId('btn-parse-text').click();

    const confirmCard = page.getByTestId('confirmation-card');
    await expect(confirmCard).toBeVisible();
    await page.getByTestId('btn-confirm-transaction').click();

    // 5. Verify return to Hari Ini screen with updated summary
    await expect(
      page.getByText('Ringkasan Nota Hari Ini & Minggu Berjalan')
    ).toBeVisible();

    // 6. Reset demo via header button
    await page.getByTestId('btn-header-reset-demo').click();
    await expect(page.getByTestId('btn-load-demo-onboarding')).toBeVisible();
  });
});
