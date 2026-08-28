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

  it('중간에 글머리 기호가 포함된 순서 있는 목록의 시작 번호(start)를 보존한다', () => {
    const content = `
1. 시작은 프로파일링
- React DevTools Profiler로 컴포넌트 커밋 시간 확인

2. 렌더링 자체를 줄이는 기본 원칙
- 불필요한 inline 함수 피하기

3. 컴포넌트 단위 최적화
- React.memo 사용
`
    const { container } = render(<MarkdownRenderer content={content} />)

    const olElements = container.querySelectorAll('ol')
    expect(olElements.length).toBe(3)
    expect(olElements[0].getAttribute('start')).toBeNull()
    expect(olElements[1].getAttribute('start')).toBe('2')
    expect(olElements[2].getAttribute('start')).toBe('3')

    expect(screen.getByText('시작은 프로파일링')).toBeVisible()
    expect(screen.getByText('렌더링 자체를 줄이는 기본 원칙')).toBeVisible()
    expect(screen.getByText('컴포넌트 단위 최적화')).toBeVisible()
  })
})
