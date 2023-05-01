
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

interface Term {
  class: string
  evaluated?: boolean
  number?: number
  faces?: number
  results?: {
    result?: number
    active?: boolean
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

export type { Message, Term, Roll }