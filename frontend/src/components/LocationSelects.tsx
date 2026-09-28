import { useEffect, useMemo, useRef, useState, type ComponentType } from 'react'
import { Check, ChevronDown, Globe, MapPin, Search, X } from 'lucide-react'
import { COUNTRIES, getSubdivisionNames } from '../lib/locations'

interface SearchSelectProps {
  id: string
  options: readonly string[]
  value: string
  onChange: (value: string) => void
  placeholder: string
  ariaLabel: string
  disabled?: boolean
  Icon: ComponentType<{ size?: number; className?: string }>
  emptyText: string
  emptySearchText?: string
}

/**
 * Local, accessible baseline combobox reused for both the country picker and
 * the dependent state/province picker. Supports search filtering, arrow-key
 * navigation, Enter to select, Escape to close, and a clear button.
 */
function SearchSelect({
  id,
  options,
  value,
  onChange,
  placeholder,
  ariaLabel,
  disabled,
  Icon,
  emptyText,
  emptySearchText,
}: SearchSelectProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(-1)
  const wrapperRef = useRef<HTMLDivElement | null>(null)
  const triggerRef = useRef<HTMLButtonElement | null>(null)

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return options
    return options.filter((option) => option.toLowerCase().includes(needle))
  }, [options, query])

  const safeActive = Math.min(activeIndex, Math.max(filtered.length - 1, 0))

  useEffect(() => {
    if (!open) return
    const handler = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const openDropdown = () => {
    if (disabled) return
    setQuery(value)
    const current = options.indexOf(value)
    setActiveIndex(current >= 0 ? current : 0)
    setOpen(true)
  }

  const closeDropdown = (restoreQuery = true) => {
    if (restoreQuery) setQuery(value)
    setOpen(false)
    setActiveIndex(-1)
    triggerRef.current?.focus()
  }

  const select = (option: string) => {
    onChange(option)
    setOpen(false)
    setActiveIndex(-1)
    triggerRef.current?.focus()
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActiveIndex((prev) => Math.min(prev + 1, Math.max(filtered.length - 1, 0)))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveIndex((prev) => Math.max(prev - 1, 0))
    } else if (event.key === 'Home') {
      event.preventDefault()
      setActiveIndex(0)
    } else if (event.key === 'End') {
      event.preventDefault()
      setActiveIndex(Math.max(filtered.length - 1, 0))
    } else if (event.key === 'Enter') {
      event.preventDefault()
      const option = filtered[safeActive]
      if (option) select(option)
    } else if (event.key === 'Escape') {
      event.preventDefault()
      closeDropdown()
    }
  }

  return (
    <div ref={wrapperRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        id={`${id}-trigger`}
        onClick={() => (open ? closeDropdown() : openDropdown())}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-disabled={disabled || undefined}
        disabled={disabled}
        className={`flex w-full items-center rounded-xl border py-2.5 pl-10 pr-9 text-left text-sm outline-none transition-all ${
          disabled
            ? 'cursor-not-allowed border-hairline bg-slate-100/70 text-body/40'
            : open
              ? 'border-plum-600 bg-white ring-2 ring-plum-500/20 text-ink'
              : 'border-hairline bg-slate-50/50 text-ink hover:border-plum-200 focus:border-plum-600 focus:bg-white focus:ring-2 focus:ring-plum-500/20'
        }`}
      >
        <Icon
          size={18}
          className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${
            disabled ? 'text-body/30' : 'text-body/50'
          }`}
        />
        <span
          className={value ? 'truncate font-medium text-ink' : 'truncate text-body/70'}
        >
          {value || placeholder}
        </span>

        {!disabled && value && !open ? (
          <button
            type="button"
            aria-label={`Clear ${ariaLabel}`}
            onClick={(event) => {
              event.preventDefault()
              event.stopPropagation()
              onChange('')
              triggerRef.current?.focus()
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-body/50 transition-colors hover:bg-slate-100 hover:text-ink"
          >
            <X size={14} />
          </button>
        ) : (
          <ChevronDown
            size={16}
            className={`absolute right-3 top-1/2 -translate-y-1/2 text-body/50 transition-transform ${
              open ? 'rotate-180' : ''
            }`}
          />
        )}
      </button>

      {open && !disabled && (
        <div
          className="absolute z-50 mt-1.5 w-full overflow-hidden rounded-xl border border-hairline bg-white shadow-lg"
          id={`${id}-panel`}
        >
          <div className="relative border-b border-hairline bg-white">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-body/40"
            />
            <input
              role="combobox"
              autoFocus
              value={query}
              onChange={(event) => {
                setQuery(event.target.value)
                setActiveIndex(0)
              }}
              onKeyDown={handleKeyDown}
              placeholder="Search..."
              aria-expanded
              aria-controls={`${id}-listbox`}
              aria-activedescendant={
                filtered.length > 0 ? `${id}-option-${safeActive}` : undefined
              }
              aria-label={ariaLabel}
              className="w-full bg-white py-2.5 pl-8 pr-3 text-sm text-ink outline-none placeholder:text-body/40"
            />
          </div>

          {filtered.length === 0 ? (
            <p className="px-4 py-4 text-center text-xs text-body/70">
              {query.trim() ? emptySearchText : emptyText}
            </p>
          ) : (
            <ul
              role="listbox"
              id={`${id}-listbox`}
              aria-label={ariaLabel}
              className="max-h-60 overflow-y-auto p-1"
            >
              {filtered.map((option, index) => {
                const isActive = index === safeActive
                const isSelected = option === value
                return (
                  <li key={option} role="presentation">
                    <button
                      type="button"
                      role="option"
                      id={`${id}-option-${index}`}
                      aria-selected={isSelected}
                      onMouseEnter={() => setActiveIndex(index)}
                      onClick={() => select(option)}
                      ref={(el) => {
                        if (isActive) el?.scrollIntoView({ block: 'nearest' })
                      }}
                      className={`flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                        isActive
                          ? 'bg-plum-50 text-plum-950'
                          : isSelected
                            ? 'bg-plum-100/70 text-plum-950'
                            : 'text-ink hover:bg-slate-50'
                      }`}
                    >
                      <span className="truncate font-medium">{option}</span>
                      {isSelected && <Check size={15} className="shrink-0 text-plum-800" />}
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}

export interface LocationSelectsProps {
  country: string
  onCountryChange: (country: string) => void
  state: string
  onStateChange: (state: string) => void
  disabled?: boolean
  idPrefix?: string
  countryPlaceholder?: string
  statePlaceholder?: string
  countryRequired?: boolean
  stateRequired?: boolean
}

/**
 * Country + dependent State/Province searchable dropdowns. The country value
 * is stored/sent exactly as a standard country name (matching the backend's
 * `country` string). The state picker stays disabled until a country with
 * known subdivisions is selected, and changing the country clears the state.
 */
export function LocationSelects({
  country,
  onCountryChange,
  state,
  onStateChange,
  disabled,
  idPrefix = 'loc',
  countryPlaceholder = 'Select your country',
  statePlaceholder = 'Select your state / province',
  countryRequired,
  stateRequired,
}: LocationSelectsProps) {
  const subdivisions = useMemo(
    () => (country ? getSubdivisionNames(country) : []),
    [country],
  )

  const handleCountryChange = (name: string) => {
    if (name === country) return
    onCountryChange(name)
    onStateChange('')
  }

  const stateDisabled = disabled || !country || subdivisions.length === 0

  return (
    <div className="space-y-4">
      <div>
        <label
          htmlFor={`${idPrefix}-country-trigger`}
          className="block text-xs font-semibold uppercase tracking-wider text-ink/80"
        >
          Country
          {countryRequired && <span className="ml-0.5 text-rose-500">*</span>}
        </label>
        <div className="relative mt-1.5">
          <SearchSelect
            id={`${idPrefix}-country`}
            options={COUNTRIES.map((entry) => entry.name)}
            value={country}
            onChange={handleCountryChange}
            placeholder={countryPlaceholder}
            ariaLabel="Country"
            disabled={disabled}
            Icon={Globe}
            emptyText="No countries match your search."
            emptySearchText="No countries match your search."
          />
        </div>
      </div>

      <div>
        <label
          htmlFor={`${idPrefix}-state-trigger`}
          className="block text-xs font-semibold uppercase tracking-wider text-ink/80"
        >
          State / Province
          {stateRequired && <span className="ml-0.5 text-rose-500">*</span>}
        </label>
        <div className="relative mt-1.5">
          <SearchSelect
            id={`${idPrefix}-state`}
            options={subdivisions}
            value={state}
            onChange={onStateChange}
            placeholder={
              !country ? 'Select a country first' : statePlaceholder
            }
            ariaLabel="State or province"
            disabled={stateDisabled}
            Icon={MapPin}
            emptyText={
              country
                ? `No states or provinces are listed for ${country} yet.`
                : 'Select a country first.'
            }
            emptySearchText="No matching states or provinces."
          />
        </div>
      </div>
    </div>
  )
}