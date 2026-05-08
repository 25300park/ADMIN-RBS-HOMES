export const USER_LEVEL = {
  SUPER_ADMIN: 0,        // 관리자
  USER: 1,               // 일반유저
  AGENT: 2,              // 에이전트 (면허x)
  BROKER: 3,             // 브로커
  OWNER: 4,              // 오너
  PRESALE_AGENT: 20,     // 프리세일 가능 에이전트
  PRESALE_BROKER: 30,    // 프리세일 가능 브로커
  PRESALE_OWNER: 40,     // 프리세일 가능 오너
} as const

export type UserLevelType = typeof USER_LEVEL[keyof typeof USER_LEVEL]

type UserLevelMapType = {
  [K in UserLevelType]: {
    text: string;
    color: string;
  }
}

export const USER_LEVEL_MAP: UserLevelMapType = {
  [USER_LEVEL.SUPER_ADMIN]: { text: 'Super Admin', color: 'red' },
  [USER_LEVEL.USER]: { text: 'User', color: 'default' },
  [USER_LEVEL.AGENT]: { text: 'Agent', color: 'blue' },
  [USER_LEVEL.BROKER]: { text: 'Broker', color: 'green' },
  [USER_LEVEL.OWNER]: { text: 'Owner', color: 'purple' },
  [USER_LEVEL.PRESALE_AGENT]: { text: 'Presale Agent', color: 'cyan' },
  [USER_LEVEL.PRESALE_BROKER]: { text: 'Presale Broker', color: 'teal' },
  [USER_LEVEL.PRESALE_OWNER]: { text: 'Presale Owner', color: 'indigo' },
}

// 프리세일 권한 체크 유틸리티 함수들
export const isPresaleEnabled = (level: UserLevelType): boolean => {
  return level >= 20;
}

export const getBaseLevel = (level: UserLevelType): UserLevelType => {
  if (level === USER_LEVEL.PRESALE_AGENT) return USER_LEVEL.AGENT;
  if (level === USER_LEVEL.PRESALE_BROKER) return USER_LEVEL.BROKER;
  if (level === USER_LEVEL.PRESALE_OWNER) return USER_LEVEL.OWNER;
  return level;
}

export const getPresaleLevel = (baseLevel: UserLevelType): UserLevelType | null => {
  switch (baseLevel) {
    case USER_LEVEL.AGENT:
      return USER_LEVEL.PRESALE_AGENT;
    case USER_LEVEL.BROKER:
      return USER_LEVEL.PRESALE_BROKER;
    case USER_LEVEL.OWNER:
      return USER_LEVEL.PRESALE_OWNER;
    default:
      return null;
  }
}

export const USER_STATUS = {
  ACTIVE: -1,
  SUSPENDED: 0,
  WITHDRAWN: 1,
} as const

export type UserStatusType = typeof USER_STATUS[keyof typeof USER_STATUS]

type UserStatusMapType = {
  [K in UserStatusType]: {
    text: string;
    color: string;
  }
}

export const USER_STATUS_MAP: UserStatusMapType = {
  [USER_STATUS.ACTIVE]: { text: 'Active', color: 'success' },
  [USER_STATUS.SUSPENDED]: { text: 'Suspended', color: 'error' },
  [USER_STATUS.WITHDRAWN]: { text: 'Withdrawn', color: 'default' },
}

export const SIGNUP_TYPE_MAP = {
  DIRECT: {
    text: 'Direct',
    color: 'green',
    value: 'direct'
  },
  GOOGLE: {
    text: 'Google',
    color: 'red',
    value: 'google'
  },
  FACEBOOK: {
    text: 'Facebook',
    color: 'blue',
    value: 'facebook'
  }
} as const;

export type SignupType = keyof typeof SIGNUP_TYPE_MAP;