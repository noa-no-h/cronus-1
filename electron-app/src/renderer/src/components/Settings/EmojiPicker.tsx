import { useState } from 'react'
import { Button } from '../ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover'
import { Smile } from 'lucide-react'
import EmojiPicker, { EmojiClickData, Theme } from 'emoji-picker-react'

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
            'suggested',
            'smileys_people',
            'animals_nature',
            'food_drink',
            'travel_places',
            'activities',
            'objects',
            'symbols',
            'flags'
          ]}
          previewConfig={{
            showPreview: false
          }}
        />
      </PopoverContent>
    </Popover>
  )
}
