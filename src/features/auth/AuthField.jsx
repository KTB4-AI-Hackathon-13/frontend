function AuthField({ id, name = id, label, type = 'text', placeholder, autoComplete, value, onChange, error }) {
  return (
    <label className={`auth-field ${error ? 'has-error' : ''}`} htmlFor={id}>
      <span>{label}</span>
      <input
        id={id}
        name={name}
        type={type}
        placeholder={placeholder}
        autoComplete={autoComplete}
        value={value}
        onChange={onChange}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
      />
      {error && <small id={`${id}-error`}>{error}</small>}
    </label>
  )
}

export default AuthField
