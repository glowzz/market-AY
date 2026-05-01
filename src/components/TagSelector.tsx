import { useState } from 'react'

const PREDEFINED_TAGS = ['财务', '日报', '客服', '运营', '开发', '采购', '自动化', '写作', 'OCR', '邮件']

interface TagSelectorProps {
  selectedTags: string[]
  onChange: (tags: string[]) => void
}

export default function TagSelector({ selectedTags, onChange }: TagSelectorProps) {
  const [customInput, setCustomInput] = useState('')

  function toggleTag(tag: string) {
    if (selectedTags.includes(tag)) {
      onChange(selectedTags.filter((t) => t !== tag))
    } else {
      onChange([...selectedTags, tag])
    }
  }

  function addCustomTag() {
    const tag = customInput.trim()
    if (tag && !selectedTags.includes(tag)) {
      onChange([...selectedTags, tag])
    }
    setCustomInput('')
  }

  return (
    <div className="flex flex-wrap gap-2">
      {PREDEFINED_TAGS.map((tag) => (
        <button
          key={tag}
          type="button"
          onClick={() => toggleTag(tag)}
          className={`px-3 py-1 rounded-full text-sm transition-colors ${
            selectedTags.includes(tag)
              ? 'bg-yellow-400 text-yellow-900'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          {tag}
        </button>
      ))}
      <div className="flex items-center gap-1">
        <input
          type="text"
          value={customInput}
          onChange={(e) => setCustomInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              addCustomTag()
            }
          }}
          placeholder="+ 自定义"
          className="px-3 py-1 rounded-full text-sm border border-dashed border-gray-300 bg-transparent focus:outline-none focus:border-yellow-400 w-24"
        />
      </div>
    </div>
  )
}
