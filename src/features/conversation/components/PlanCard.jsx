function PlanCard({ plan, readyToConfirm, completedTaskIds = [] }) {
  const completedIds = new Set(completedTaskIds.map(String))
  return (
    <section className="plan-card">
      <header>
        <strong>계획 초안</strong>
        {readyToConfirm && <span>확정 가능한 상태예요</span>}
      </header>
      <p>{plan.summary}</p>
      <ol className="plan-card__tasks">
        {(plan.daily_tasks ?? []).map((task, index) => {
          const completed = task.id != null && completedIds.has(String(task.id))
          return (
          <li
            key={task.id ?? `${task.scheduled_date}-${index}`}
            className={completed ? 'is-completed' : undefined}
          >
            <span className="plan-card__check" aria-label={completed ? '완료' : undefined}>
              {completed ? '✓' : ''}
            </span>
            <time>{task.scheduled_date}</time>
            <span>{task.title}</span>
            {task.estimated_min != null && <small>{task.estimated_min}분</small>}
          </li>
          )
        })}
      </ol>
    </section>
  )
}

export default PlanCard
