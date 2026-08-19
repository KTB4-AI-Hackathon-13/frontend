function AuthField({ id, label, type = 'text', placeholder, autoComplete }) {
  return (
    <label className="auth-field" htmlFor={id}>
      <span>{label}</span>
      <input id={id} name={id} type={type} placeholder={placeholder} autoComplete={autoComplete} />
    </label>
  )
}

export default AuthField
