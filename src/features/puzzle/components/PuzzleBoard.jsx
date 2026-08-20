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
 *   imageLoading?: boolean,        서명 URL 을 받아오는 중 (스켈레톤으로 표시)
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
  imageLoading = false,
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

  // 완성하면 조각선만 옅게 남기고 원본 그림을 통째로 보여준다 (와이어프레임 p17-6 "원본 이미지 공개")
  if (complete) {
    const picture = imageUrl ? (
      <image
        href={imageUrl}
        x="0"
        y="0"
        width={FRAME}
        height={FRAME}
        preserveAspectRatio="xMidYMid slice"
        decoding="async"
        onError={onImageError}
      />
    ) : null
    const pieceClass = imageUrl
      ? 'pboard__outline'
      : imageLoading
        ? 'pboard__skeleton'
        : 'pboard__filled'
    return (
      <div className="pboard is-complete" style={{ width: size, height: size }}>
        <svg viewBox={viewBox} className="pboard__svg" role="img" aria-label="완성된 퍼즐">
          {picture}
          {paths.map((d, i) => (
            <path key={i} d={d} className={pieceClass} />
          ))}
        </svg>
      </div>
    )
  }

  // 이미지를 조각마다 따로 그리면(clip) 같은 그림을 조각 수만큼 반복 디코드하게 되어 조각이
  // 많아질수록 느려진다. 대신 획득한 조각 전체를 하나의 clipPath 로 합쳐서 이미지는 한 번만 그린다.
  const earnedIdx = []
  pieces.forEach((p, i) => p.earned && earnedIdx.push(i))

  return (
    <div
      className="pboard"
      style={{ width: size, height: size }}
      onMouseLeave={() => onPieceHover?.(null)}
    >
      <svg viewBox={viewBox} className="pboard__svg" role="img" aria-label="퍼즐판">
        {imageUrl && earnedIdx.length > 0 && (
          <>
            <defs>
              <clipPath id={`${uid}-earned`}>
                {earnedIdx.map((i) => (
                  <path d={paths[i]} key={i} />
                ))}
              </clipPath>
            </defs>
            <image
              href={imageUrl}
              x="0"
              y="0"
              width={FRAME}
              height={FRAME}
              preserveAspectRatio="xMidYMid slice"
              decoding="async"
              clipPath={`url(#${uid}-earned)`}
              onError={onImageError}
            />
          </>
        )}

        {pieces.map((piece, i) => (
          <g key={piece.scheduleItemId ?? i}>
            {!piece.earned ? (
              <path d={paths[i]} className="pboard__hole" />
            ) : !imageUrl ? (
              // 그림이 아직 없거나(서버 미배정) 서명 URL 을 받아오는 중이면 조각을 채워서 진행도를 보여준다
              <path d={paths[i]} className={imageLoading ? 'pboard__skeleton' : 'pboard__filled'} />
            ) : null}
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
