
interface Message {
  user: string
  type: number
  flavor?: string
  speaker: {
    alias: string
  }
  content?: string
  rolls: string[]
  blind: boolean
  timestamp: number
  flags?: {
    pf2e?: {
      context?: {
        type?: string
        domains?: string[]
      }
      casting?: {
        id?: string
        level?: number
        tradition?: "string"
      }
      origin?: {
        type?: string
      }
      isFromConsumable?: boolean
    }
  }
}

interface Messages {
  messages: Message[]
  lastUpdated: Date | undefined
}

interface Term {
  class: string
  evaluated?: boolean
  number?: number
  faces?: number
  results?: {
    result?: number
    active?: boolean
  }[]
  rolls?: {
    class: string
    formula: string
    total: number
    evaluated: boolean
  }[]
  operator?: string
}

interface Roll {
  class: string
  type: number
  domains: string[]
  formula: string
  options: {
    rollerId: string
    isReroll: boolean
    domains: string[]
    degreeOfSuccess?: number
    flavor?: string
    damage?: {
      traits?: string[]
    }
  }
  terms: Term[]
  total?: number
  flags?: {
    pf2e?: {
      context?: {
        type?: string
      }
    }
  }
}

export type { Message, Messages, Term, Roll }