function Toast({ toast }) {
  if (!toast) return null
  return (
    <div className={`toast toast--${toast.tone}`} role="status">
      {toast.message}
    </div>
  )
}

export default Toast
