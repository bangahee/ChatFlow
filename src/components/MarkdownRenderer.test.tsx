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

  it('AI가 1. 로 반복 출력한 순서 목록을 1, 2, 3으로 자동 증가하여 렌더링한다', () => {
    const content = `좋아요! 실무에 바로 써먹을 수 있는 React 렌더링 최적화 팁을 핵심만 정리해볼게요.

1. 먼저 측정부터
- React DevTools Profiler로 어떤 컴포넌트가 왜 재렌더링되는지 확인하세요.
- 재렌더링 빈도, 커밋 시간, 렌더링 트리의 불필요한 재렌더링 여부를 확인하는 것이 시작점입니다.

1. 렌더링 자체를 줄이는 기본 원칙
- 함수/객체 인라인 생성 피하기: render 안에서 매번 새 배열/객체/함수를 만들지 말고 useMemo/useCallback으로 안정화.
- props.identity 관리: 자식 컴포넌트가 props가 바뀌지 않으면 재렌더링되지 않도록 React.memo로 래핑.

1. 컴포넌트 단위 최적화
- React.memo 사용: 자식 컴포넌트가 받는 props가 바뀌지 않으면 재렌더링을 막습니다.`

    const { container } = render(<MarkdownRenderer content={content} />)

    const olElements = container.querySelectorAll('ol')
    expect(olElements.length).toBe(3)
    expect(olElements[0].getAttribute('start')).toBeNull()
    expect(olElements[1].getAttribute('start')).toBe('2')
    expect(olElements[2].getAttribute('start')).toBe('3')

    expect(screen.getByText('먼저 측정부터')).toBeVisible()
    expect(screen.getByText('렌더링 자체를 줄이는 기본 원칙')).toBeVisible()
    expect(screen.getByText('컴포넌트 단위 최적화')).toBeVisible()
  })
})
