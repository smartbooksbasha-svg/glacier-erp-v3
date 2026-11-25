import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { describe, expect, it } from 'vitest';
import { findModule } from '../src/lib/modules';
import { storagePathFor } from '../src/lib/upload';
import { ModulePage } from '../src/pages/ModulePage';

describe('attachments', () => {
  it('declares upload fields on the operational registers', () => {
    const hasFile = (key: string, name: string): boolean =>
      Boolean(findModule(key)?.fields.some((field) => field.name === name && field.type === 'file'));
    expect(hasFile('bills', 'billFile')).toBe(true);
    expect(hasFile('qc_tests', 'reportFile')).toBe(true);
    expect(hasFile('qc_approvals', 'releaseFile')).toBe(true);
    expect(hasFile('delivery_events', 'podFile')).toBe(true);
    expect(hasFile('expenses', 'proofFile')).toBe(true);
    expect(hasFile('attachments', 'file')).toBe(true);
  });

  it('builds a private Storage path with a safe file name', () => {
    expect(storagePathFor('QC Tests', 'r1', 'Lab Report #2.PDF')).toBe('private/qc-tests/r1/lab-report-2.pdf');
  });

  it('renders a real file input in the QC test form', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);
    await act(async () => { root.render(<ModulePage moduleKey="qc_tests" role="owner" actor="Owner" />); });
    await act(async () => { await new Promise((resolve) => setTimeout(resolve, 10)); });
    const add = Array.from(container.querySelectorAll('.toolbar button')).find((button) => (button.textContent ?? '').includes('Add'));
    expect(add).toBeTruthy();
    await act(async () => { add?.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
    expect(container.querySelector('.modal input[type=file]')).toBeTruthy();
    expect(container.textContent).toContain('private Storage bucket');
    await act(async () => { root.unmount(); });
    container.remove();
  });
});
