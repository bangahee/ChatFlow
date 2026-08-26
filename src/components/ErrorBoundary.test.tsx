import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ErrorBoundary } from './ErrorBoundary'

function BrokenComponent(): never {
  throw new Error('렌더링 실패')
}

describe('ErrorBoundary', () => {
  it('자식 컴포넌트 오류 시 fallback 화면을 표시한다', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

    try {
      render(
        <ErrorBoundary>
          <BrokenComponent />
        </ErrorBoundary>,
      )

      expect(
        screen.getByRole('heading', {
          name: '화면 로딩 중 오류가 발생했습니다',
        }),
      ).toBeVisible()
      expect(screen.getByRole('button', { name: '새로고침' })).toBeVisible()
    } finally {
      consoleError.mockRestore()
    }
  })
})
