/**
 * 퍼즐 도메인 타입 — 백엔드 실제 DTO(PuzzleSummaryResponse / PuzzleDetailResponse) 기준.
 *
 * @typedef {'IN_PROGRESS' | 'COMPLETED'} PuzzleStatus
 * @typedef {'PUBLIC' | 'PRIVATE'} PuzzleVisibility
 *
 * @typedef {Object} PuzzleSummary                 GET /puzzles/mine 항목
 * @property {number} id
 * @property {number} scheduleId                   퍼즐 1개 = 스케줄 1개
 * @property {string} title                        ★ 스케줄 제목이 그대로 온다 (그림 제목이 아님)
 * @property {PuzzleStatus} status
 * @property {PuzzleVisibility} visibility
 * @property {number | null} imageId               이미지 API(§8) 미구현이라 현재 항상 null
 * @property {number} pieceCount                   전체 조각 수 (= 유효 작업 수)
 * @property {number} earnedPieceCount             획득한 조각 수
 * @property {string | null} completedAt           ISO 8601
 *
 * @typedef {Object} PuzzlePiece
 * @property {number | null} pieceId               미획득이면 null
 * @property {number} scheduleItemId
 * @property {string} scheduleItemTitle
 * @property {string} scheduledDate                YYYY-MM-DD
 * @property {boolean} earned
 * @property {number | null} position              ★ 이미지 위치가 아니라 "획득 순서"(0부터). 미획득이면 null
 * @property {string | null} earnedAt              ISO 8601
 *
 * @typedef {PuzzleSummary & { pieces: PuzzlePiece[] }} PuzzleDetail   GET /puzzles/{puzzleId}
 *
 * 그림판 배치 규칙: 서버 `position` 은 획득 순서라 이미지 격자와 무관하다.
 * 프론트는 `pieces` 배열 순서(= 작업 날짜·표시 순)를 그대로 격자 칸에 매핑한다.
 */

export {}
