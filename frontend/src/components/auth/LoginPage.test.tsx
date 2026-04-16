import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import LoginPage from './LoginPage';

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    login: vi.fn(),
  }),
}));

describe('LoginPage footer links', () => {
  it('renders the pitch deck link with href, target, and rel', () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    );

    const link = screen.getByRole('link', { name: /view the skillbridge pitch deck/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/deck/');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'));
    expect(link.textContent?.trim()).toBe('View the SkillBridge pitch deck →');
  });
});
