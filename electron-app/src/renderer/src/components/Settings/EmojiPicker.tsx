import { useState } from 'react'
import { Button } from '../ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover'
import { Input } from '../ui/input'
import { Search, Smile } from 'lucide-react'

interface EmojiPickerProps {
  selectedEmoji: string
  onEmojiSelect: (emoji: string) => void
  disabled?: boolean
}

// Organized emoji categories with searchable keywords
const emojiCategories = [
  {
    name: 'Work & Productivity',
    emojis: [
      { emoji: '��', keywords: 'briefcase work office business' },
      { emoji: '💻', keywords: 'laptop computer coding programming' },
      { emoji: '🖥️', keywords: 'desktop computer monitor screen' },
      { emoji: '��', keywords: 'phone call telephone communication' },
      { emoji: '��', keywords: 'email mail message communication' },
      { emoji: '��', keywords: 'chart bar graph analytics data' },
      { emoji: '��', keywords: 'trending up growth increase' },
      { emoji: '📋', keywords: 'clipboard list tasks checklist' },
      { emoji: '📝', keywords: 'memo note writing document' },
      { emoji: '✏️', keywords: 'pencil writing drawing edit' },
      { emoji: '��', keywords: 'books reading study education' },
      { emoji: '👔', keywords: 'tie business formal professional' },
      { emoji: '��', keywords: 'microscope science research lab' },
      { emoji: '🧪', keywords: 'test tube chemistry experiment' },
      { emoji: '📖', keywords: 'book reading literature' },
      { emoji: '��', keywords: 'graduation cap degree education' },
      { emoji: '��', keywords: 'lightbulb idea innovation' },
      { emoji: '⚙️', keywords: 'gear settings configuration' },
      { emoji: '🔧', keywords: 'wrench tool repair maintenance' },
      { emoji: '📱', keywords: 'mobile phone smartphone' },
      { emoji: '⌨️', keywords: 'keyboard typing input' },
      { emoji: '🖨️', keywords: 'printer print document' },
      { emoji: '💾', keywords: 'floppy disk save storage' },
      { emoji: '🔌', keywords: 'plug power electricity' },
      { emoji: '🔋', keywords: 'battery power energy' }
    ]
  },
  {
    name: 'Communication & Social',
    emojis: [
      { emoji: '💬', keywords: 'speech bubble chat message talk' },
      { emoji: '��', keywords: 'phone call telephone' },
      { emoji: '��', keywords: 'email mail message' },
      { emoji: '💌', keywords: 'love letter mail romantic' },
      { emoji: '📮', keywords: 'mailbox post office' },
      { emoji: '��', keywords: 'globe world internet web' },
      { emoji: '📡', keywords: 'satellite antenna signal' },
      { emoji: '📺', keywords: 'television tv broadcast' },
      { emoji: '��', keywords: 'radio broadcast music' },
      { emoji: '📢', keywords: 'loudspeaker announcement' },
      { emoji: '🔊', keywords: 'speaker sound volume' },
      { emoji: '👥', keywords: 'people group team' },
      { emoji: '🤝', keywords: 'handshake agreement deal' },
      { emoji: '💭', keywords: 'thought bubble thinking' },
      { emoji: '🗣️', keywords: 'speaking talking voice' }
    ]
  },
  {
    name: 'Entertainment & Media',
    emojis: [
      { emoji: '🎮', keywords: 'game controller gaming play' },
      { emoji: '��', keywords: 'movie film cinema' },
      { emoji: '��', keywords: 'music note sound melody' },
      { emoji: '🎨', keywords: 'art painting creative' },
      { emoji: '📷', keywords: 'camera photo photography' },
      { emoji: '🎭', keywords: 'performing arts theater drama' },
      { emoji: '🎪', keywords: 'circus tent entertainment' },
      { emoji: '🎯', keywords: 'target goal aim focus' },
      { emoji: '🎲', keywords: 'dice game random chance' },
      { emoji: '🎸', keywords: 'guitar music instrument' },
      { emoji: '��', keywords: 'piano music instrument' },
      { emoji: '🎻', keywords: 'violin music instrument' },
      { emoji: '��', keywords: 'microphone singing karaoke' },
      { emoji: '🎧', keywords: 'headphones music audio' },
      { emoji: '📺', keywords: 'television tv show' },
      { emoji: '��', keywords: 'movie camera film' },
      { emoji: '��️', keywords: 'film frames movie' },
      { emoji: '🎟️', keywords: 'ticket admission pass' },
      { emoji: '🎪', keywords: 'circus tent show' },
      { emoji: '🎨', keywords: 'palette art colors' },
      { emoji: '��', keywords: 'masks theater drama' },
      { emoji: '🎪', keywords: 'circus tent entertainment' }
    ]
  },
  {
    name: 'Food & Dining',
    emojis: [
      { emoji: '��', keywords: 'pizza italian food' },
      { emoji: '🍔', keywords: 'hamburger burger fast food' },
      { emoji: '🍜', keywords: 'noodles ramen asian food' },
      { emoji: '��', keywords: 'sushi japanese food' },
      { emoji: '��', keywords: 'bento box lunch meal' },
      { emoji: '🍙', keywords: 'rice ball onigiri japanese' },
      { emoji: '🍪', keywords: 'cookie dessert sweet' },
      { emoji: '☕', keywords: 'coffee hot drink caffeine' },
      { emoji: '🍵', keywords: 'tea hot drink' },
      { emoji: '🥤', keywords: 'soda pop soft drink' },
      { emoji: '🍺', keywords: 'beer alcohol drink' },
      { emoji: '🍷', keywords: 'wine alcohol drink' },
      { emoji: '🍽️', keywords: 'plate fork knife dining' },
      { emoji: '🍴', keywords: 'fork knife utensils' },
      { emoji: '��', keywords: 'spoon utensil eating' },
      { emoji: '🍳', keywords: 'cooking pan kitchen' },
      { emoji: '🥘', keywords: 'pan food cooking' },
      { emoji: '🍲', keywords: 'pot stew soup' },
      { emoji: '��', keywords: 'salad healthy vegetables' },
      { emoji: '��', keywords: 'apple fruit healthy' },
      { emoji: '🍌', keywords: 'banana fruit yellow' },
      { emoji: '🍊', keywords: 'orange fruit citrus' },
      { emoji: '��', keywords: 'strawberry fruit red' }
    ]
  },
  {
    name: 'Health & Fitness',
    emojis: [
      { emoji: '🏃', keywords: 'running exercise workout' },
      { emoji: '🏋️', keywords: 'weight lifting gym strength' },
      { emoji: '⚽', keywords: 'soccer football sports' },
      { emoji: '🏀', keywords: 'basketball sports game' },
      { emoji: '🎾', keywords: 'tennis sports racket' },
      { emoji: '🏸', keywords: 'badminton sports' },
      { emoji: '🏓', keywords: 'ping pong table tennis' },
      { emoji: '🎯', keywords: 'target archery aim' },
      { emoji: '🏹', keywords: 'bow arrow archery' },
      { emoji: '🏊', keywords: 'swimming pool water' },
      { emoji: '🚴', keywords: 'cycling bike bicycle' },
      { emoji: '🧘', keywords: 'yoga meditation zen' },
      { emoji: '💪', keywords: 'muscle strength flex' },
      { emoji: '❤️', keywords: 'heart love health' },
      { emoji: '��', keywords: 'lungs breathing health' },
      { emoji: '��', keywords: 'brain mind thinking' },
      { emoji: '🦴', keywords: 'bone skeleton health' },
      { emoji: '��', keywords: 'stethoscope doctor medical' },
      { emoji: '💊', keywords: 'pill medicine health' },
      { emoji: '🩹', keywords: 'bandage injury heal' },
      { emoji: '��', keywords: 'blood drop medical' },
      { emoji: '🏥', keywords: 'hospital medical care' }
    ]
  },
  {
    name: 'Travel & Transportation',
    emojis: [
      { emoji: '✈️', keywords: 'airplane flight travel' },
      { emoji: '🚗', keywords: 'car automobile drive' },
      { emoji: '🚲', keywords: 'bicycle bike cycling' },
      { emoji: '🚅', keywords: 'bullet train fast travel' },
      { emoji: '🚢', keywords: 'ship boat water travel' },
      { emoji: '��', keywords: 'helicopter air travel' },
      { emoji: '🎡', keywords: 'ferris wheel amusement park' },
      { emoji: '🗽', keywords: 'statue liberty new york' },
      { emoji: '🏖️', keywords: 'beach sand ocean vacation' },
      { emoji: '🌅', keywords: 'sunrise morning dawn' },
      { emoji: '🌄', keywords: 'sunset evening dusk' },
      { emoji: '🗺️', keywords: 'map location navigation' },
      { emoji: '🧳', keywords: 'luggage suitcase travel' },
      { emoji: '🎫', keywords: 'ticket admission pass' },
      { emoji: '��', keywords: 'hotel accommodation stay' },
      { emoji: '⛺', keywords: 'tent camping outdoor' },
      { emoji: '��️', keywords: 'camping tent outdoor' },
      { emoji: '��', keywords: 'earth globe world' },
      { emoji: '��', keywords: 'earth america globe' },
      { emoji: '��', keywords: 'earth asia globe' },
      { emoji: '🗺️', keywords: 'map location navigation' },
      { emoji: '📍', keywords: 'pin location marker' },
      { emoji: '🎯', keywords: 'target location aim' }
    ]
  },
  {
    name: 'Shopping & Commerce',
    emojis: [
      { emoji: '🛒', keywords: 'shopping cart buy purchase' },
      { emoji: '🏪', keywords: 'convenience store shop' },
      { emoji: '📦', keywords: 'package box delivery' },
      { emoji: '📮', keywords: 'mailbox post office' },
      { emoji: '🏦', keywords: 'bank money finance' },
      { emoji: '��', keywords: 'trending up growth profit' },
      { emoji: '��', keywords: 'trending down loss decline' },
      { emoji: '��', keywords: 'money bag cash wealth' },
      { emoji: '💳', keywords: 'credit card payment' },
      { emoji: '💵', keywords: 'dollar bill money cash' },
      { emoji: '��', keywords: 'money wings flying cash' },
      { emoji: '🪙', keywords: 'coin money currency' },
      { emoji: '��', keywords: 'store shop retail' },
      { emoji: '🛍️', keywords: 'shopping bags retail' },
      { emoji: '🎁', keywords: 'gift present surprise' },
      { emoji: '🛒', keywords: 'cart shopping buy' },
      { emoji: '📦', keywords: 'box package delivery' },
      { emoji: '��', keywords: 'truck delivery transport' },
      { emoji: '📮', keywords: 'mailbox post office' },
      { emoji: '🏪', keywords: 'convenience store shop' },
      { emoji: '🛒', keywords: 'shopping cart buy' }
    ]
  },
  {
    name: 'Education & Learning',
    emojis: [
      { emoji: '��', keywords: 'books reading study' },
      { emoji: '��', keywords: 'graduation cap degree' },
      { emoji: '✏️', keywords: 'pencil writing drawing' },
      { emoji: '📝', keywords: 'memo note writing' },
      { emoji: '��', keywords: 'microscope science lab' },
      { emoji: '🧪', keywords: 'test tube chemistry' },
      { emoji: '🔭', keywords: 'telescope astronomy space' },
      { emoji: '📖', keywords: 'book reading literature' },
      { emoji: '��', keywords: 'green book reading' },
      { emoji: '📘', keywords: 'blue book reading' },
      { emoji: '📙', keywords: 'orange book reading' },
      { emoji: '📔', keywords: 'notebook writing notes' },
      { emoji: '📒', keywords: 'ledger accounting book' },
      { emoji: '📕', keywords: 'red book reading' },
      { emoji: '📓', keywords: 'notebook writing' },
      { emoji: '📔', keywords: 'notebook blank writing' },
      { emoji: '📒', keywords: 'ledger accounting' },
      { emoji: '📕', keywords: 'red book' },
      { emoji: '📓', keywords: 'notebook' },
      { emoji: '📔', keywords: 'notebook blank' },
      { emoji: '📒', keywords: 'ledger' },
      { emoji: '📕', keywords: 'red book' },
      { emoji: '📓', keywords: 'notebook' }
    ]
  },
  {
    name: 'Home & Lifestyle',
    emojis: [
      { emoji: '��', keywords: 'house home building' },
      { emoji: '��', keywords: 'house garden home' },
      { emoji: '🏘️', keywords: 'houses neighborhood' },
      { emoji: '🏚️', keywords: 'derelict house abandoned' },
      { emoji: '🏗️', keywords: 'construction building' },
      { emoji: '🏭', keywords: 'factory industrial' },
      { emoji: '🏢', keywords: 'office building work' },
      { emoji: '🏬', keywords: 'department store shopping' },
      { emoji: '🏣', keywords: 'post office mail' },
      { emoji: '🏤', keywords: 'european post office' },
      { emoji: '🏥', keywords: 'hospital medical care' },
      { emoji: '🏦', keywords: 'bank money finance' },
      { emoji: '��', keywords: 'hotel accommodation' },
      { emoji: '🏩', keywords: 'love hotel romantic' },
      { emoji: '🏪', keywords: 'convenience store' },
      { emoji: '🏫', keywords: 'school education' },
      { emoji: '🏬', keywords: 'department store' },
      { emoji: '🏭', keywords: 'factory industrial' },
      { emoji: '🏮', keywords: 'red lantern light' },
      { emoji: '🏯', keywords: 'japanese castle' },
      { emoji: '🏰', keywords: 'castle european' },
      { emoji: '💒', keywords: 'wedding chapel' },
      { emoji: '��', keywords: 'tokyo tower' },
      { emoji: '🗽', keywords: 'statue liberty' }
    ]
  },
  {
    name: 'Nature & Outdoors',
    emojis: [
      { emoji: '🌲', keywords: 'evergreen tree pine' },
      { emoji: '��', keywords: 'deciduous tree oak' },
      { emoji: '🌴', keywords: 'palm tree tropical' },
      { emoji: '🌵', keywords: 'cactus desert plant' },
      { emoji: '��', keywords: 'sheaf rice grain' },
      { emoji: '🌿', keywords: 'herb plant leaf' },
      { emoji: '☘️', keywords: 'shamrock clover luck' },
      { emoji: '🍀', keywords: 'four leaf clover luck' },
      { emoji: '🌺', keywords: 'hibiscus flower tropical' },
      { emoji: '🌸', keywords: 'cherry blossom spring' },
      { emoji: '��', keywords: 'daisy flower white' },
      { emoji: '🌹', keywords: 'rose flower love' },
      { emoji: '��', keywords: 'tulip flower spring' },
      { emoji: '🌻', keywords: 'sunflower yellow' },
      { emoji: '��', keywords: 'daisy flower' },
      { emoji: '��', keywords: 'tulip flower' },
      { emoji: '🌹', keywords: 'rose flower' },
      { emoji: '🌺', keywords: 'hibiscus flower' },
      { emoji: '🌻', keywords: 'sunflower' },
      { emoji: '��', keywords: 'daisy' },
      { emoji: '��', keywords: 'tulip' },
      { emoji: '��', keywords: 'rose' },
      { emoji: '🌺', keywords: 'hibiscus' },
      { emoji: '🌻', keywords: 'sunflower' }
    ]
  },
  {
    name: 'Technology & Digital',
    emojis: [
      { emoji: '💻', keywords: 'laptop computer coding' },
      { emoji: '🖥️', keywords: 'desktop computer monitor' },
      { emoji: '📱', keywords: 'mobile phone smartphone' },
      { emoji: '🖨️', keywords: 'printer print document' },
      { emoji: '⌨️', keywords: 'keyboard typing input' },
      { emoji: '💾', keywords: 'floppy disk save storage' },
      { emoji: '🔌', keywords: 'plug power electricity' },
      { emoji: '🔋', keywords: 'battery power energy' },
      { emoji: '📡', keywords: 'satellite antenna signal' },
      { emoji: '��', keywords: 'globe world internet' },
      { emoji: '💾', keywords: 'floppy disk save' },
      { emoji: '🔌', keywords: 'plug power' },
      { emoji: '🔋', keywords: 'battery power' },
      { emoji: '📡', keywords: 'satellite antenna' },
      { emoji: '��', keywords: 'globe world' },
      { emoji: '💾', keywords: 'floppy disk' },
      { emoji: '��', keywords: 'plug' },
      { emoji: '🔋', keywords: 'battery' },
      { emoji: '📡', keywords: 'satellite' },
      { emoji: '��', keywords: 'globe' },
      { emoji: '💾', keywords: 'floppy' },
      { emoji: '��', keywords: 'plug' },
      { emoji: '🔋', keywords: 'battery' }
    ]
  },
  {
    name: 'Miscellaneous',
    emojis: [
      { emoji: '⭐', keywords: 'star rating favorite' },
      { emoji: '🌟', keywords: 'glowing star sparkle' },
      { emoji: '✨', keywords: 'sparkles shine glitter' },
      { emoji: '⚡', keywords: 'lightning bolt energy' },
      { emoji: '🔥', keywords: 'fire flame hot' },
      { emoji: '💧', keywords: 'droplet water liquid' },
      { emoji: '🌊', keywords: 'wave ocean sea' },
      { emoji: '☀️', keywords: 'sun sunny weather' },
      { emoji: '💎', keywords: 'gem diamond precious' },
      { emoji: '🎯', keywords: 'target goal aim' },
      { emoji: '🎪', keywords: 'circus tent show' },
      { emoji: '🎨', keywords: 'palette art colors' },
      { emoji: '��', keywords: 'masks theater drama' },
      { emoji: '🎪', keywords: 'circus tent' },
      { emoji: '🎨', keywords: 'palette art' },
      { emoji: '��', keywords: 'masks theater' },
      { emoji: '🎪', keywords: 'circus' },
      { emoji: '🎨', keywords: 'palette' },
      { emoji: '��', keywords: 'masks' },
      { emoji: '🎪', keywords: 'circus' },
      { emoji: '🎨', keywords: 'palette' },
      { emoji: '��', keywords: 'masks' },
      { emoji: '🎪', keywords: 'circus' }
    ]
  }
]

export function EmojiPickerComponent({
  selectedEmoji,
  onEmojiSelect,
  disabled = false
}: EmojiPickerProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState(0)

  // Filter emojis based on search term
  const filteredCategories = emojiCategories
    .map((category) => ({
      ...category,
      emojis: category.emojis.filter(
        (emojiItem) =>
          emojiItem.keywords.toLowerCase().includes(searchTerm.toLowerCase()) ||
          emojiItem.emoji.includes(searchTerm)
      )
    }))
    .filter((category) => category.emojis.length > 0)

  const handleEmojiSelect = (emoji: string) => {
    onEmojiSelect(emoji)
    setIsOpen(false)
    setSearchTerm('')
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" disabled={disabled} className="h-10 w-10 p-0 text-lg">
          {selectedEmoji || <Smile className="h-4 w-4" />}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="start">
        <div className="p-3 border-b">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search for an emoji"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>

        {searchTerm ? (
          <div className="p-3 max-h-64 overflow-y-auto">
            <div className="grid grid-cols-8 gap-2">
              {filteredCategories.flatMap((category) =>
                category.emojis.map((emojiItem, index) => (
                  <button
                    key={`${category.name}-${index}`}
                    onClick={() => handleEmojiSelect(emojiItem.emoji)}
                    className="h-8 w-8 flex items-center justify-center text-lg hover:bg-accent hover:text-accent-foreground rounded-md transition-colors"
                    title={`${emojiItem.emoji} - ${emojiItem.keywords}`}
                  >
                    {emojiItem.emoji}
                  </button>
                ))
              )}
            </div>
          </div>
        ) : (
          <div className="max-h-64 overflow-y-auto">
            <div className="flex border-b overflow-x-auto">
              {emojiCategories.map((category, index) => (
                <button
                  key={category.name}
                  onClick={() => setSelectedCategory(index)}
                  className={`px-3 py-2 text-xs font-medium whitespace-nowrap border-b-2 transition-colors ${
                    selectedCategory === index
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>

            <div className="p-3">
              <div className="grid grid-cols-8 gap-2">
                {emojiCategories[selectedCategory]?.emojis.map((emojiItem, index) => (
                  <button
                    key={index}
                    onClick={() => handleEmojiSelect(emojiItem.emoji)}
                    className="h-8 w-8 flex items-center justify-center text-lg hover:bg-accent hover:text-accent-foreground rounded-md transition-colors"
                    title={`${emojiItem.emoji} - ${emojiItem.keywords}`}
                  >
                    {emojiItem.emoji}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
