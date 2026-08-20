import { useId, useMemo } from 'react'

import { buildJigsawPaths } from '../utils/jigsaw.js'
import { resolveLayout } from '../utils/grid.js'

/** 판은 항상 정사각형이다 (퍼즐마다 틀이 달라지지 않게) */
const FRAME = 600

/**
 * 퍼즐판 — 획득한 조각만 그림이 보이고, 못 딴 조각은 빈 홈으로 남는다.
 *
 * 틀은 어떤 퍼즐이든 같은 정사각형이고, 그 안을 **할 일 수만큼** 조각으로 빈 칸 없이 나눈다
 * (분할 규칙은 utils/grid.js, 조각 모양은 utils/jigsaw.js).
 * 조각과 할 일은 1:1 이며, 격자 칸 순서 = `pieces` 배열 순서(작업 날짜·표시 순)다.
 * 서버의 `position` 은 획득 순서라 그림 위치와는 무관하다.
 *
 * @param {{
 *   imageUrl: string | null,   서버 이미지가 없으면 null — 그때는 조각 틀만 그린다
 *   pieces: import('../api/types.js').PuzzlePiece[],
 *   size?: number,                 판 한 변(px)
 *   showNumbers?: boolean,
 *   seed?: number,                 퍼즐마다 다른 조각 모양 (보통 puzzle.id)
 *   onImageError?: () => void,     서명 URL 만료 등으로 이미지가 안 뜰 때 (usePuzzleImage 가 재발급)
 *   onPieceHover?: (piece: (import('../api/types.js').PuzzlePiece & { index: number }) | null) => void,
 * }} props
 */
function PuzzleBoard({
  imageUrl,
  pieces = [],
  size = 240,
  showNumbers = false,
  seed = 1,
  onImageError,
  onPieceHover,
}) {
  const uid = useId().replace(/:/g, '')
  const count = pieces.length
  const complete = count > 0 && pieces.every((p) => p.earned)

  const { paths, centers, pad } = useMemo(() => {
    const layout = resolveLayout(count)
    return buildJigsawPaths({ layout, width: FRAME, height: FRAME, seed })
  }, [count, seed])

  const viewBox = `${-pad} ${-pad} ${FRAME + pad * 2} ${FRAME + pad * 2}`

  const picture = imageUrl ? (
    <image
      href={imageUrl}
      x="0"
      y="0"
      width={FRAME}
      height={FRAME}
      preserveAspectRatio="xMidYMid slice"
      onError={onImageError}
    />
  ) : null

  // 완성하면 조각선만 옅게 남기고 원본 그림을 통째로 보여준다 (와이어프레임 p17-6 "원본 이미지 공개")
  if (complete) {
    return (
      <div className="pboard is-complete" style={{ width: size, height: size }}>
        <svg viewBox={viewBox} className="pboard__svg" role="img" aria-label="완성된 퍼즐">
          {picture}
          {paths.map((d, i) => (
            <path key={i} d={d} className={imageUrl ? 'pboard__outline' : 'pboard__filled'} />
          ))}
        </svg>
      </div>
    )
  }

  return (
    <div
      className="pboard"
      style={{ width: size, height: size }}
      onMouseLeave={() => onPieceHover?.(null)}
    >
      <svg viewBox={viewBox} className="pboard__svg" role="img" aria-label="퍼즐판">
        <defs>
          {paths.map((d, i) => (
            <clipPath id={`${uid}-c${i}`} key={i}>
              <path d={d} />
            </clipPath>
          ))}
        </defs>

        {pieces.map((piece, i) => (
          <g key={piece.scheduleItemId ?? i}>
            {!piece.earned ? (
              <path d={paths[i]} className="pboard__hole" />
            ) : imageUrl ? (
              <image
                href={imageUrl}
                x="0"
                y="0"
                width={FRAME}
                height={FRAME}
                preserveAspectRatio="xMidYMid slice"
                clipPath={`url(#${uid}-c${i})`}
                onError={onImageError}
              />
            ) : (
              // 서버가 아직 그림을 배정하지 않았을 때 — 획득한 조각은 채워서 진행도를 보여준다
              <path d={paths[i]} className="pboard__filled" />
            )}
            <path
              d={paths[i]}
              className={`pboard__outline ${piece.earned ? 'is-earned' : ''}`}
              onMouseEnter={() => onPieceHover?.({ ...piece, index: i })}
            >
              <title>
                {piece.earned
                  ? `${piece.scheduleItemTitle} 완료로 획득`
                  : `${piece.scheduleItemTitle} — 아직 완료 전`}
              </title>
            </path>
            {!piece.earned && showNumbers && (
              <text
                className="pboard__num"
                x={centers[i].x}
                y={centers[i].y}
                textAnchor="middle"
                dominantBaseline="central"
              >
                {i + 1}
              </text>
            )}
          </g>
        ))}
      </svg>
    </div>
  )
}

export default PuzzleBoard
