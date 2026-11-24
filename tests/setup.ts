import { vi } from 'vitest';

(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({ matches: false, media: query, onchange: null, addListener: () => {}, removeListener: () => {}, addEventListener: () => {}, removeEventListener: () => {}, dispatchEvent: () => false })
});

Object.defineProperty(URL, 'createObjectURL', { writable: true, value: vi.fn(() => 'blob:test') });
Object.defineProperty(URL, 'revokeObjectURL', { writable: true, value: vi.fn() });
window.confirm = vi.fn(() => true);
window.print = vi.fn();
