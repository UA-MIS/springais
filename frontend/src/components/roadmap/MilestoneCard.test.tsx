import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { linkifyText } from './MilestoneCard';

describe('linkifyText', () => {
  it('returns plain text when no URLs are present', () => {
    const result = linkifyText('Just a plain string');
    expect(result).toEqual(['Just a plain string']);
  });

  it('wraps a single URL in an anchor tag', () => {
    const { container } = render(<span>{linkifyText('Visit https://example.com for more')}</span>);
    const link = container.querySelector('a');
    expect(link).not.toBeNull();
    expect(link!.href).toBe('https://example.com/');
    expect(link!.target).toBe('_blank');
    expect(link!.rel).toContain('noopener');
    expect(link!.textContent).toBe('https://example.com');
  });

  it('handles text with URL at the beginning', () => {
    const { container } = render(<span>{linkifyText('https://start.com and then text')}</span>);
    const link = container.querySelector('a');
    expect(link).not.toBeNull();
    expect(link!.textContent).toBe('https://start.com');
    expect(container.textContent).toContain('and then text');
  });

  it('handles text with URL at the end', () => {
    const { container } = render(<span>{linkifyText('Check out https://end.com')}</span>);
    const link = container.querySelector('a');
    expect(link).not.toBeNull();
    expect(link!.textContent).toBe('https://end.com');
    expect(container.textContent).toContain('Check out');
  });

  it('handles multiple URLs in the same string', () => {
    const { container } = render(
      <span>{linkifyText('See https://first.com and https://second.com for info')}</span>
    );
    const links = container.querySelectorAll('a');
    expect(links.length).toBe(2);
    expect(links[0].textContent).toBe('https://first.com');
    expect(links[1].textContent).toBe('https://second.com');
  });

  it('handles http (non-https) URLs', () => {
    const { container } = render(<span>{linkifyText('Visit http://insecure.com here')}</span>);
    const link = container.querySelector('a');
    expect(link).not.toBeNull();
    expect(link!.textContent).toBe('http://insecure.com');
  });

  it('handles URLs with paths, query strings, and fragments', () => {
    const url = 'https://example.com/path/to/page?q=search&lang=en#section';
    const { container } = render(<span>{linkifyText(`Go to ${url} now`)}</span>);
    const link = container.querySelector('a');
    expect(link).not.toBeNull();
    expect(link!.textContent).toBe(url);
  });

  it('handles a string that is just a URL', () => {
    const { container } = render(<span>{linkifyText('https://only-url.com')}</span>);
    const link = container.querySelector('a');
    expect(link).not.toBeNull();
    expect(link!.textContent).toBe('https://only-url.com');
    // Should still have the empty strings from split
  });

  it('does not linkify text that is not a URL', () => {
    const result = linkifyText('no urls here, just text: with colons and //slashes');
    // None of the parts should be URL-like
    const { container } = render(<span>{result}</span>);
    const links = container.querySelectorAll('a');
    expect(links.length).toBe(0);
  });

  it('returns the original string for empty input', () => {
    const result = linkifyText('');
    expect(result).toEqual(['']);
  });
});
