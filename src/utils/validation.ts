export const USERNAME_PATTERN = /^[A-Za-z0-9_]+$/

export function countCodePoints(value: string): number {
  return Array.from(value).length
}

export function validateUsername(value: string): string | null {
  const username = value.trim()
  if (!username) return '아이디를 입력해 주세요.'
  if (countCodePoints(username) < 3 || countCodePoints(username) > 50) {
    return '아이디는 3자 이상 50자 이하여야 합니다.'
  }
  if (!USERNAME_PATTERN.test(username)) {
    return '아이디는 영문, 숫자, 밑줄(_)만 사용할 수 있습니다.'
  }
  return null
}

export function validatePassword(value: string): string | null {
  if (!value) return '비밀번호를 입력해 주세요.'
  if (countCodePoints(value) < 8 || countCodePoints(value) > 128) {
    return '비밀번호는 8자 이상 128자 이하여야 합니다.'
  }
  return null
}

export function validateQuestion(value: string): string | null {
  const question = value.trim()
  if (!question) return '질문을 입력해 주세요.'
  if (countCodePoints(question) > 500) {
    return '질문은 500자 이하여야 합니다.'
  }
  return null
}
