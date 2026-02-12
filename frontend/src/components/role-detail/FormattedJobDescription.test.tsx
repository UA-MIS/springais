import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import FormattedJobDescription, { parseJobDescription } from './FormattedJobDescription';

describe('parseJobDescription', () => {
  it('returns empty array for empty string', () => {
    expect(parseJobDescription('')).toEqual([]);
  });

  it('parses a single paragraph', () => {
    const result = parseJobDescription('This is a simple job description.');
    expect(result).toEqual([
      { type: 'paragraph', content: 'This is a simple job description.' },
    ]);
  });

  it('splits double newlines into separate paragraphs', () => {
    const text = 'First paragraph.\n\nSecond paragraph.';
    const result = parseJobDescription(text);
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ type: 'paragraph', content: 'First paragraph.' });
    expect(result[1]).toEqual({ type: 'paragraph', content: 'Second paragraph.' });
  });

  it('detects section headings ending with colon', () => {
    const text = 'Requirements:\n- Python\n- AWS';
    const result = parseJobDescription(text);
    expect(result[0]).toEqual({ type: 'heading', content: 'Requirements' });
  });

  it('detects section headings in Title Case without colon', () => {
    const text = 'About the Role\nWe are looking for a developer.';
    const result = parseJobDescription(text);
    expect(result[0]).toEqual({ type: 'heading', content: 'About the Role' });
  });

  it('parses dash-prefixed list items', () => {
    const text = '- Python\n- AWS\n- Docker';
    const result = parseJobDescription(text);
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe('list');
    expect(result[0].items).toEqual(['Python', 'AWS', 'Docker']);
  });

  it('parses asterisk-prefixed list items', () => {
    const text = '* Python\n* AWS';
    const result = parseJobDescription(text);
    expect(result[0].type).toBe('list');
    expect(result[0].items).toEqual(['Python', 'AWS']);
  });

  it('parses numbered list items', () => {
    const text = '1. First item\n2. Second item\n3. Third item';
    const result = parseJobDescription(text);
    expect(result[0].type).toBe('list');
    expect(result[0].items).toEqual(['First item', 'Second item', 'Third item']);
  });

  it('handles a full structured job description', () => {
    const text = [
      'About the Role',
      'We are seeking a talented engineer to join our team.',
      '',
      'Requirements:',
      '- 3+ years of Python experience',
      '- AWS certification preferred',
      '- Strong communication skills',
      '',
      'Benefits:',
      '- Competitive salary',
      '- Remote work options',
    ].join('\n');

    const result = parseJobDescription(text);
    expect(result[0]).toEqual({ type: 'heading', content: 'About the Role' });
    expect(result[1]).toEqual({
      type: 'paragraph',
      content: 'We are seeking a talented engineer to join our team.',
    });
    expect(result[2]).toEqual({ type: 'heading', content: 'Requirements' });
    expect(result[3].type).toBe('list');
    expect(result[3].items).toHaveLength(3);
    expect(result[4]).toEqual({ type: 'heading', content: 'Benefits' });
    expect(result[5].type).toBe('list');
    expect(result[5].items).toHaveLength(2);
  });

  it('joins continuation lines in paragraphs', () => {
    const text = 'This is a sentence that wraps to the next line.\nand this continues the thought.';
    const result = parseJobDescription(text);
    expect(result).toEqual([
      { type: 'paragraph', content: 'This is a sentence that wraps to the next line. and this continues the thought.' },
    ]);
  });

  it('does not treat long lines as headings', () => {
    const longLine = 'This is a very long line that describes something in detail and should not be treated as a heading even though it starts with a capital letter:';
    const result = parseJobDescription(longLine);
    // Lines over 100 chars are not headings
    expect(result[0].type).toBe('paragraph');
  });

  it('handles markdown bold headings', () => {
    const text = '**Key Responsibilities**\n- Lead the team\n- Design systems';
    const result = parseJobDescription(text);
    expect(result[0]).toEqual({ type: 'heading', content: 'Key Responsibilities' });
  });

  it('handles markdown hash headings', () => {
    const text = '## Overview\nThe role involves...';
    const result = parseJobDescription(text);
    expect(result[0]).toEqual({ type: 'heading', content: 'Overview' });
  });

  it('flushes list when a heading is detected after list items', () => {
    const text = '- Item one\n- Item two\nBenefits:\n- Benefit one';
    const result = parseJobDescription(text);
    expect(result[0].type).toBe('list');
    expect(result[0].items).toEqual(['Item one', 'Item two']);
    expect(result[1]).toEqual({ type: 'heading', content: 'Benefits' });
    expect(result[2].type).toBe('list');
    expect(result[2].items).toEqual(['Benefit one']);
  });
});

describe('FormattedJobDescription component', () => {
  const defaultProps = {
    textColor: '#aaa',
    headingColor: '#fff',
    mutedColor: '#666',
  };

  it('renders nothing for empty text', () => {
    const { container } = render(
      <FormattedJobDescription text="" {...defaultProps} />
    );
    expect(container.innerHTML).toBe('');
  });

  it('renders paragraphs', () => {
    render(
      <FormattedJobDescription
        text="This is a paragraph."
        {...defaultProps}
      />
    );
    expect(screen.getByText('This is a paragraph.')).toBeTruthy();
  });

  it('renders headings as h4 elements', () => {
    render(
      <FormattedJobDescription
        text={'Requirements:\n- Python'}
        {...defaultProps}
      />
    );
    const heading = screen.getByText('Requirements');
    expect(heading.tagName).toBe('H4');
  });

  it('renders list items', () => {
    render(
      <FormattedJobDescription
        text={'- Python\n- AWS\n- Docker'}
        {...defaultProps}
      />
    );
    expect(screen.getByText('Python')).toBeTruthy();
    expect(screen.getByText('AWS')).toBeTruthy();
    expect(screen.getByText('Docker')).toBeTruthy();
  });

  it('renders a full job description with mixed content', () => {
    const text = 'About the Role\nWe need a developer.\n\nSkills:\n- React\n- TypeScript';
    render(
      <FormattedJobDescription text={text} {...defaultProps} />
    );
    expect(screen.getByText('About the Role')).toBeTruthy();
    expect(screen.getByText('We need a developer.')).toBeTruthy();
    expect(screen.getByText('Skills')).toBeTruthy();
    expect(screen.getByText('React')).toBeTruthy();
    expect(screen.getByText('TypeScript')).toBeTruthy();
  });
});
