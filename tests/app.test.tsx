import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import App from '../src/App';
import { OWNER_EMAIL } from '../src/lib/config';
import type { User } from '../src/lib/types';

let container: HTMLDivElement;
let root: Root;

const flush = () => new Promise((resolve) => setTimeout(resolve, 20));

function setInput(input: HTMLInputElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
  setter?.call(input, value);
  input.dispatchEvent(new Event('input', { bubbles: true }));
}

function clickText(elements: ArrayLike<Element>, text: string): boolean {
  const el = Array.from(elements).find((e) => e.textContent?.trim() === text);
  if (!el) return false;
  el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  return true;
}

beforeEach(() => {
  localStorage.clear();
  window.location.hash = '';
  container = document.createElement('div');
  container.id = 'root';
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(async () => {
  await act(async () => { root.unmount(); });
  container.remove();
});

describe('ERP UI smoke', () => {
  it('logs in and shows the permission-aware dashboard', async () => {
    await act(async () => { root.render(<App />); });
    await act(async () => { await flush(); });
    const email = container.querySelector('input[autocomplete="username"]') as HTMLInputElement;
    const password = container.querySelector('input[autocomplete="current-password"]') as HTMLInputElement;
    expect(email).toBeTruthy();
    await act(async () => {
      setInput(email, OWNER_EMAIL);
      setInput(password, 'test1234');
      container.querySelector('form')?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      await flush();
    });
    await act(async () => { await flush(); });
    expect(container.textContent).toContain('Overview');
    expect(container.textContent).toContain('Stock by product');
    expect(container.textContent).toContain('Owner / Super Admin');
  });

  it('navigates Sales -> Invoices and opens the add form', async () => {
    const user: User = { id: 'u1', name: 'Owner', email: OWNER_EMAIL, role: 'owner', active: true };
    localStorage.setItem('gws3_user', JSON.stringify(user));
    await act(async () => { root.render(<App />); });
    await act(async () => { await flush(); });
    await act(async () => {
      expect(clickText(container.querySelectorAll('nav button'), 'Sales')).toBe(true);
      await flush();
    });
    expect(container.textContent).toContain('Invoices');
    await act(async () => {
      expect(clickText(container.querySelectorAll('.toolbar .chip'), 'Invoices')).toBe(true);
      await flush();
    });
    expect(container.textContent).toContain('Add Invoice');
    await act(async () => {
      expect(clickText(container.querySelectorAll('.toolbar button'), 'Add Invoice')).toBe(true);
      await flush();
    });
    expect(container.querySelector('.modal')).toBeTruthy();
    expect(container.textContent).toContain('Invoice No');
  });

  it('hides Administration from sales staff', async () => {
    const user: User = { id: 'u2', name: 'Sales', email: 'sales@example.com', role: 'sales', active: true };
    localStorage.setItem('gws3_user', JSON.stringify(user));
    await act(async () => { root.render(<App />); });
    await act(async () => { await flush(); });
    const navTexts = Array.from(container.querySelectorAll('nav button')).map((b) => b.textContent?.trim());
    expect(navTexts).toContain('Sales');
    expect(navTexts).not.toContain('Administration');
  });
});
