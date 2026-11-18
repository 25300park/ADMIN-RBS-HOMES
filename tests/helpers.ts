// 테스트 전용 가짜 세션. 실제 계정 정보는 쓰지 않는다.
export const NO_SESSION = null

export const NON_SUPER_ADMIN_SESSION = {
  // level 0이어도 isSuperAdmin이 아니면 거부되어야 한다
  user: { id: '1', email: 'level0@example.invalid', username: 'level0', level: 0, isSuperAdmin: false },
  expires: '2099-01-01T00:00:00.000Z',
}

export const REGULAR_USER_SESSION = {
  user: { id: '2', email: 'user@example.invalid', username: 'user', level: 1, isSuperAdmin: false },
  expires: '2099-01-01T00:00:00.000Z',
}

export const SUPER_ADMIN_SESSION = {
  // level 값은 허용 조건과 무관하다 (여기서는 일부러 1)
  user: { id: '3', email: 'super@example.invalid', username: 'super', level: 1, isSuperAdmin: true },
  expires: '2099-01-01T00:00:00.000Z',
}
