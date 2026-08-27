import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { MarkdownRenderer } from './MarkdownRenderer'

describe('MarkdownRenderer', () => {
  it('Markdown은 렌더링하고 raw HTML은 DOM 요소로 삽입하지 않는다', () => {
    const { container } = render(
      <MarkdownRenderer
        content={
          '# 안전한 답변\n\n<img src="x" onerror="alert(1)" />\n\n<script>alert(1)</script>'
        }
      />,
    )

    expect(
      screen.getByRole('heading', { name: '안전한 답변' }),
    ).toBeVisible()
    expect(container.querySelector('img')).toBeNull()
    expect(container.querySelector('script')).toBeNull()
  })
})
