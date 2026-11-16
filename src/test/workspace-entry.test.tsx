import { render, screen, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ComponentType } from 'react';

const account = vi.hoisted(() => ({ value: null as null | { isManagement: boolean } }));
vi.mock('@/lib/auth', () => ({ useMe: () => ({ data: account.value, isPending: false }) }));
vi.mock('@tanstack/react-router', () => ({
  createFileRoute: () => (options: object) => ({ options }),
  Navigate: ({ to }: { to: string }) => <output aria-label="Destination">{to}</output>,
  Outlet: () => <output aria-label="Public examples">Examples</output>,
}));
import { Route } from '@/routes/demo';
const Entry = Route.options.component as ComponentType;
afterEach(() => { cleanup(); account.value = null; });

describe('Existing workspace entry', () => {
  it('returns signed-in farmers to their operational overview', () => {
    account.value = { isManagement: false };
    render(<Entry />);
    expect(screen.getByLabelText('Destination')).toHaveTextContent('/overview');
  });
  it('returns signed-in managers to comprehensive Insights', () => {
    account.value = { isManagement: true };
    render(<Entry />);
    expect(screen.getByLabelText('Destination')).toHaveTextContent('/dashboard');
  });
  it('preserves public examples for signed-out visitors', () => {
    render(<Entry />);
    expect(screen.getByLabelText('Public examples')).toBeInTheDocument();
    expect(screen.queryByLabelText('Destination')).not.toBeInTheDocument();
  });
});