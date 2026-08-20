function PlanCard({ plan, readyToConfirm }) {
  return (
    <section className="plan-card">
      <header>
        <strong>계획 초안</strong>
        {readyToConfirm && <span>확정 가능한 상태예요</span>}
      </header>
      <p>{plan.summary}</p>
      <ol className="plan-card__tasks">
        {(plan.daily_tasks ?? []).map((task, index) => (
          <li key={task.id ?? `${task.scheduled_date}-${index}`}>
            <time>{task.scheduled_date}</time>
            <span>{task.title}</span>
            {task.estimated_min != null && <small>{task.estimated_min}분</small>}
          </li>
        ))}
      </ol>
    </section>
  )
}

export default PlanCard
