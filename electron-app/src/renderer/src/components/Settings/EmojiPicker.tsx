import EmojiPicker, { Categories, EmojiClickData, Theme } from 'emoji-picker-react'
import { Smile } from 'lucide-react'
import { useState } from 'react'
import { Button } from '../ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover'

interface EmojiPickerProps {
  selectedEmoji: string
  onEmojiSelect: (emoji: string) => void
  disabled?: boolean
}

export function EmojiPickerComponent({
  selectedEmoji,
  onEmojiSelect,
  disabled = false
}: EmojiPickerProps) {
  const [isOpen, setIsOpen] = useState(false)

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    onEmojiSelect(emojiData.emoji)
    setIsOpen(false)
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" disabled={disabled} className="h-10 w-10 p-0 text-lg">
          {selectedEmoji || <Smile className="h-4 w-4" />}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0" align="start">
        <EmojiPicker
          onEmojiClick={handleEmojiClick}
          theme={Theme.AUTO}
          width={350}
          height={400}
          searchPlaceholder="Search emojis..."
          autoFocusSearch={true}
          categories={[
            { category: Categories.SUGGESTED, name: 'Recently Used' },
            { category: Categories.SMILEYS_PEOPLE, name: 'Smileys & People' },
            { category: Categories.ANIMALS_NATURE, name: 'Animals & Nature' },
            { category: Categories.FOOD_DRINK, name: 'Food & Drink' },
            { category: Categories.TRAVEL_PLACES, name: 'Travel & Places' },
            { category: Categories.ACTIVITIES, name: 'Activities' },
            { category: Categories.OBJECTS, name: 'Objects' },
            { category: Categories.SYMBOLS, name: 'Symbols' },
            { category: Categories.FLAGS, name: 'Flags' }
          ]}
          previewConfig={{
            showPreview: false
          }}
        />
      </PopoverContent>
    </Popover>
  )
}
