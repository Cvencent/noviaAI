interface SliderProps {
  value?: number[]
  onValueChange?: (value: number[]) => void
  min?: number
  max?: number
  step?: number
  className?: string
  disabled?: boolean
}

export function Slider({ 
  value = [0], 
  onValueChange, 
  min = 0, 
  max = 100, 
  step = 1, 
  disabled = false,
  className = '' 
}: SliderProps) {
  const currentValue = value[0] || min
  const percentage = ((currentValue - min) / (max - min)) * 100

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = Number(e.target.value)
    if (onValueChange) {
      onValueChange([newValue])
    }
  }

  return (
    <div className={`relative w-full ${disabled ? 'opacity-50' : ''} ${className}`}>
      <div className="relative h-2 w-full rounded-full bg-gray-200 overflow-hidden">
        <div 
          className="absolute h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full transition-all duration-150"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <input
        type="range"
        value={currentValue}
        onChange={handleChange}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
        style={{ 
          WebkitAppearance: 'none',
          appearance: 'none'
        }}
      />
      <div 
        className="absolute top-1/2 -translate-y-1/2 w-5 h-5 bg-white border-2 border-purple-500 rounded-full shadow-lg pointer-events-none transition-all duration-150"
        style={{ left: `calc(${percentage}% - 10px)` }}
      >
        <div className="absolute inset-1 m-auto">
          <div className="w-2 h-2 bg-purple-500 rounded-full" />
        </div>
      </div>
    </div>
  )
}
