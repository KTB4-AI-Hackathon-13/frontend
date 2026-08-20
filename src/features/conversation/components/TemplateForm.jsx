import { useState } from 'react'

const MAX_PLAN_DAYS = 30

function addDays(isoDate, days) {
  if (!isoDate) return undefined
  const [year, month, day] = isoDate.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day + days))
  return date.toISOString().slice(0, 10)
}

function openDatePicker(event) {
  if (event.currentTarget.disabled) return
  try {
    event.currentTarget.showPicker?.()
  } catch {
    // showPicker 미지원 브라우저에서는 기본 date input 동작을 사용한다.
  }
}

function TemplateForm({ questions, disabled, initialAnswers = {}, onAnswersChange, onSubmit }) {
  const [answers, setAnswers] = useState(initialAnswers)

  function update(id, value) {
    setAnswers((current) => {
      const next = { ...current, [id]: value }
      if (id === 'start_date' && next.end_date) {
        const lastSelectableDate = addDays(value, MAX_PLAN_DAYS - 1)
        if (!value || next.end_date < value || next.end_date > lastSelectableDate) {
          next.end_date = ''
        }
      }
      onAnswersChange?.(next)
      return next
    })
  }

  function toggleOption(questionId, option, checked) {
    const selected = answers[questionId] ?? []
    update(
      questionId,
      checked ? [...selected, option] : selected.filter((value) => value !== option),
    )
  }

  return (
    <form
      className="template-form"
      onSubmit={(event) => {
        event.preventDefault()
        onSubmit(answers)
      }}
    >
      {questions.map((question, index) => {
        const isMultiSelect =
          question.type === 'multi_select' || question.label?.includes('복수 선택')
        const selectedOptions = Array.isArray(answers[question.id]) ? answers[question.id] : []

        return (
        <div key={question.id} className="template-form__field">
          <span>
            {index + 1}. {question.label}
          </span>
          {question.type === 'single_select' ? (
            <select
              required={question.required}
              value={answers[question.id] ?? ''}
              onChange={(event) => update(question.id, event.target.value)}
            >
              <option value="">선택해 주세요</option>
              {(question.options ?? []).map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          ) : isMultiSelect ? (
            <div className="template-form__checkboxes">
              {(question.options ?? []).map((option) => (
                <label key={option} className="template-form__checkbox">
                  <input
                    type="checkbox"
                    checked={selectedOptions.includes(option)}
                    required={question.required && selectedOptions.length === 0}
                    onChange={(event) =>
                      toggleOption(question.id, option, event.target.checked)
                    }
                  />
                  <span>{option}</span>
                </label>
              ))}
            </div>
          ) : (
            <input
              type={question.type === 'short_text' ? 'text' : question.type}
              required={question.required}
              placeholder={question.placeholder ?? ''}
              value={answers[question.id] ?? ''}
              min={question.id === 'end_date' ? answers.start_date : undefined}
              max={
                question.id === 'end_date'
                  ? addDays(answers.start_date, MAX_PLAN_DAYS - 1)
                  : undefined
              }
              onClick={question.type === 'date' ? openDatePicker : undefined}
              onChange={(event) =>
                update(
                  question.id,
                  question.type === 'number' ? Number(event.target.value) : event.target.value,
                )
              }
            />
          )}
        </div>
        )
      })}
      <button type="submit" disabled={disabled}>
        승인하고 계획 만들기
      </button>
    </form>
  )
}

export default TemplateForm
