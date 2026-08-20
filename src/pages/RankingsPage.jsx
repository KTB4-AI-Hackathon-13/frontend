import { useState } from 'react'
import { Link } from 'react-router-dom'

import {
  fetchRankings,
  RANKING_PERIOD,
  RANKING_TYPE,
} from '../features/ranking/api/rankingApi.js'
import { useAsync } from '../features/schedule/hooks/useAsync.js'
import ErrorNotice from '../shared/components/ErrorNotice.jsx'

const TYPE_OPTIONS = [
  { value: RANKING_TYPE.STREAK, label: '연속 실천', description: '계획을 실천한 날' },
  { value: RANKING_TYPE.COMPLETED_PUZZLES, label: '완성 퍼즐', description: '완성한 퍼즐' },
]

const PERIOD_OPTIONS = [
  { value: RANKING_PERIOD.WEEKLY, label: '주간' },
  { value: RANKING_PERIOD.MONTHLY, label: '월간' },
  { value: RANKING_PERIOD.YEARLY, label: '연간' },
]

const TIER_LABEL = {
  DIAMOND: '다이아몬드',
  PLATINUM: '플래티넘',
  GOLD: '골드',
  SILVER: '실버',
  BRONZE: '브론즈',
}

const number = new Intl.NumberFormat('ko-KR', { maximumFractionDigits: 2 })

function formatScore(score, type) {
  const unit = type === RANKING_TYPE.STREAK ? '일' : '개'
  return `${number.format(Number(score ?? 0))}${unit}`
}

function formatDate(date) {
  if (!date) return ''
  const [year, month, day] = date.split('-').map(Number)
  return `${year}년 ${month}월 ${day}일 기준`
}

function RankBadge({ rank }) {
  if (rank > 3) return <span className="ranking__rank-number">{rank}</span>
  return (
    <span className={`ranking__medal ranking__medal--${rank}`} aria-label={`${rank}위`}>
      {rank}
    </span>
  )
}

function RankingRows({ items, type }) {
  const toPuzzleBy = (item) => ({
    pathname: '/puzzles',
    search: `userId=${encodeURIComponent(String(item.userId))}&nickname=${encodeURIComponent(item.nickname || '')}`,
    state: { userId: item.userId, nickname: item.nickname },
  })

  return (
    <ol className="ranking__list">
      {items.map((item) => (
        <li className={`ranking__row ${item.rank <= 3 ? 'is-podium' : ''}`} key={item.userId}>
          <Link to={toPuzzleBy(item)} className="ranking__row-link" aria-label={`${item.nickname} 퍼즐 보기`}>
            <div className="ranking__position">
              <RankBadge rank={item.rank} />
            </div>
            <div className="ranking__person">
              <span className="ranking__avatar" aria-hidden="true">
                {item.nickname?.slice(0, 1) || '?'}
              </span>
              <strong>{item.nickname}</strong>
            </div>
            <strong className="ranking__score">{formatScore(item.score, type)}</strong>
          </Link>
        </li>
      ))}
    </ol>
  )
}

function RankingsPage() {
  const [type, setType] = useState(RANKING_TYPE.STREAK)
  const [period, setPeriod] = useState(RANKING_PERIOD.WEEKLY)
  const rankings = useAsync(() => fetchRankings({ type, period }), [type, period], {
    keepData: false,
  })

  const data = rankings.data
  const selectedType = TYPE_OPTIONS.find((option) => option.value === type)

  return (
    <section className="ranking page">
      <header className="page-head ranking__head">
        <div>
          <p className="ranking__eyebrow">LEADERBOARD</p>
          <h1 className="page-title">랭킹</h1>
          <p className="page-sub">꾸준히 계획을 실천한 사람들과 함께 성장해요.</p>
        </div>
        {data?.rankingDate && <span className="ranking__date">{formatDate(data.rankingDate)}</span>}
      </header>

      <div className="ranking__filters" aria-label="랭킹 조건">
        <div className="ranking__segmented" role="group" aria-label="랭킹 기준">
          {TYPE_OPTIONS.map((option) => (
            <button
              type="button"
              className={type === option.value ? 'is-active' : ''}
              onClick={() => setType(option.value)}
              aria-pressed={type === option.value}
              key={option.value}
            >
              {option.label}
            </button>
          ))}
        </div>
        <div className="ranking__period" role="group" aria-label="집계 기간">
          {PERIOD_OPTIONS.map((option) => (
            <button
              type="button"
              className={period === option.value ? 'is-active' : ''}
              onClick={() => setPeriod(option.value)}
              aria-pressed={period === option.value}
              key={option.value}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <ErrorNotice error={rankings.error} onRetry={rankings.reload} />

      {rankings.loading && (
        <div className="ranking__board" aria-busy="true" aria-label="랭킹을 불러오는 중">
          {[1, 2, 3, 4, 5].map((row) => (
            <div className="ranking__skeleton" key={row} />
          ))}
        </div>
      )}

      {!rankings.loading && !rankings.error && data && (
        <>
          {data.myRanking && (
            <section className={`ranking__mine tier--${data.myRanking.tier.toLowerCase()}`}>
              <div>
                <span>나의 {selectedType.label} 랭킹</span>
                <strong>{number.format(data.myRanking.rank)}위</strong>
              </div>
              <div className="ranking__mine-score">
                <span>{TIER_LABEL[data.myRanking.tier]}</span>
                <strong>{formatScore(data.myRanking.score, type)}</strong>
              </div>
            </section>
          )}

          {data.items.length > 0 ? (
            <section className="ranking__board" aria-label={`${selectedType.label} 랭킹 목록`}>
              <div className="ranking__board-head">
                <div>
                  <h2>{selectedType.label} 랭킹</h2>
                  <p>{selectedType.description}을 기준으로 집계했어요.</p>
                </div>
                <span>상위 {data.items.length}명</span>
              </div>
              <div className="ranking__columns" aria-hidden="true">
                <span>순위</span>
                <span>사용자</span>
                <span>기록</span>
              </div>
              <RankingRows items={data.items} type={type} />
            </section>
          ) : (
            <div className="empty ranking__empty">
              <span aria-hidden="true">◇</span>
              <strong>아직 집계된 랭킹이 없어요</strong>
              <p>활동 기록이 쌓이면 이곳에서 순위를 확인할 수 있어요.</p>
            </div>
          )}
        </>
      )}
    </section>
  )
}

export default RankingsPage
