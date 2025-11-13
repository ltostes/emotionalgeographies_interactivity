export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      rooms: {
        Row: {
          id: string
          code: string
          config: Json
          creator_user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          code: string
          config?: Json
          creator_user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          code?: string
          config?: Json
          creator_user_id?: string
          created_at?: string
        }
      }
      contributions: {
        Row: {
          id: string
          room_id: string
          identifier: string
          data: Json
          created_at: string
        }
        Insert: {
          id?: string
          room_id: string
          identifier: string
          data: Json
          created_at?: string
        }
        Update: {
          id?: string
          room_id?: string
          identifier?: string
          data?: Json
          created_at?: string
        }
      }
    }
  }
}

export interface ImageData {
  image_id: string
  url: string
  details: Record<string, unknown>
}

export interface RangeQuestion {
  id: string
  prompt: string
  details: string
  type: 'range'
  implementation: [number, number] // [min, max]
}

export interface OpenQuestion {
  id: string
  prompt: string
  details: string
  type: 'open'
  implementation: null
}

export type Question = RangeQuestion | OpenQuestion

export interface QuestionConfig {
  type: 'single-randomly-picked' | 'series' | 'simultaneous'
  questions: Question[]
}

export interface RoomConfig {
  images: ImageData[]
  questions: QuestionConfig
}

export interface ContributionData {
  image_id: string
  question_id: string
  answer: number | string
}

export interface RoomWithCount {
  id: string
  code: string
  config: Json
  creator_user_id: string
  created_at: string
  contribution_count: number
}

export interface ImageStats {
  image_id: string
  contribution_count: number
  mean_valence: number | null
  mean_arousal: number | null
}
