/**
 * 정적 UI용 인메모리 데이터. 백엔드 ERD(schedules, schedule_items) 컬럼을 camelCase 로 그대로 둔다.
 * 상태 변경은 이 배열을 직접 갱신해서 홈/상세 화면이 같은 데이터를 보게 한다.
 */
export const MOCK_TODAY = '2026-08-20'

export const schedules = [
  {
    id: 1,
    title: '자격증 준비 계획',
    description: '3개월 안에 자격증 합격. 주 5일 실천, 일 단위 계획.',
    status: 'ACTIVE',
    source: 'AI',
    startDate: '2026-08-20',
    endDate: '2026-11-20',
    currentVersion: 1,
    createdAt: '2026-08-19T21:00:00+09:00',
    updatedAt: '2026-08-19T21:00:00+09:00',
  },
  {
    id: 2,
    title: '운동 습관 만들기',
    description: '주 3회 가볍게',
    status: 'ACTIVE',
    source: 'USER',
    startDate: '2026-08-03',
    endDate: '2026-08-31',
    currentVersion: 1,
    createdAt: '2026-08-02T10:00:00+09:00',
    updatedAt: '2026-08-02T10:00:00+09:00',
  },
  {
    id: 3,
    title: '독서: 클린 아키텍처',
    description: '챕터별 정리',
    status: 'DRAFT',
    source: 'AI',
    startDate: '2026-08-24',
    endDate: '2026-09-14',
    currentVersion: 1,
    createdAt: '2026-08-19T22:00:00+09:00',
    updatedAt: '2026-08-19T22:00:00+09:00',
  },
  {
    id: 4,
    title: '토이 프로젝트 MVP',
    description: null,
    status: 'COMPLETED',
    source: 'AI',
    startDate: '2026-07-20',
    endDate: '2026-08-08',
    currentVersion: 3,
    createdAt: '2026-07-19T09:00:00+09:00',
    updatedAt: '2026-08-08T18:00:00+09:00',
  },
]

let nextItemId = 1000
export const newItemId = () => (nextItemId += 1)

const item = (id, scheduleId, scheduledDate, title, status = 'TODO', extra = {}) => ({
  id,
  scheduleId,
  categoryId: null,
  parentItemId: null,
  title,
  description: null,
  scheduledDate,
  workload: 1,
  priority: 3,
  status,
  completedAt: status === 'COMPLETED' ? `${scheduledDate}T20:00:00+09:00` : null,
  createdAt: `${scheduledDate}T00:00:00+09:00`,
  updatedAt: `${scheduledDate}T00:00:00+09:00`,
  ...extra,
})

export const items = [
  // 1. 자격증 준비 계획 (와이어프레임 06·07 예시 데이터)
  item(101, 1, '2026-08-20', '시험 범위 확인', 'COMPLETED'),
  item(102, 1, '2026-08-20', '교재 1장 읽기', 'COMPLETED'),
  item(103, 1, '2026-08-20', '핵심 개념 정리'),
  item(104, 1, '2026-08-21', '핵심 개념 노트 정리'),
  item(105, 1, '2026-08-21', '연습문제 10개'),
  item(106, 1, '2026-08-22', '1주차 복습'),
  item(107, 1, '2026-08-22', '오답 정리'),
  item(108, 1, '2026-08-24', '2장 읽기'),
  item(109, 1, '2026-08-25', '연습문제 10개'),
  item(110, 1, '2026-08-26', '3장 읽기'),
  item(111, 1, '2026-08-27', '모의고사 1회'),
  item(112, 1, '2026-08-28', '오답 정리'),
  item(113, 1, '2026-08-28', '진도 점검'),
  item(114, 1, '2026-08-31', '4장 읽기'),
  item(115, 1, '2026-09-01', '연습문제 10개'),
  item(116, 1, '2026-09-02', '5장 읽기'),

  // 2. 운동 습관
  item(201, 2, '2026-08-03', '가볍게 걷기 30분', 'COMPLETED'),
  item(202, 2, '2026-08-05', '스트레칭 15분', 'COMPLETED'),
  item(203, 2, '2026-08-05', '운동하기', 'COMPLETED'),
  item(204, 2, '2026-08-12', '운동하기', 'COMPLETED'),
  item(205, 2, '2026-08-17', '가볍게 걷기 30분', 'SKIPPED'),
  item(206, 2, '2026-08-20', '운동하기'),
  item(207, 2, '2026-08-23', '가볍게 걷기 30분'),
  item(208, 2, '2026-08-26', '운동하기'),
  item(209, 2, '2026-08-28', '운동하기'),

  // 4. 완료된 프로젝트
  item(401, 4, '2026-07-20', '요구사항 정리', 'COMPLETED'),
  item(402, 4, '2026-07-22', 'DB 스키마 설계', 'COMPLETED'),
  item(403, 4, '2026-08-08', '배포', 'COMPLETED'),
]

export const preferences = { maxDailyTasks: 5 }
