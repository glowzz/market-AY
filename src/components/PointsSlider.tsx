interface PointsSliderProps {
  value: number
  onChange: (value: number) => void
  max: number
}

export default function PointsSlider({ value, onChange, max }: PointsSliderProps) {
  const effectiveMax = Math.min(max, 100)
  const disabled = max === 0

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-2xl">💰 {value}</span>
        <span className="text-sm text-gray-500">余额: {max}</span>
      </div>
      {disabled ? (
        <p className="text-red-500 text-sm">积分不足</p>
      ) : (
        <input
          type="range"
          min={0}
          max={effectiveMax}
          step={5}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full accent-yellow-500"
        />
      )}
    </div>
  )
}
