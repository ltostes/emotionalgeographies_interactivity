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

export interface RoomConfig {
  colors: string[]
}

export interface ContributionData {
  color: string
}

export interface RoomWithCount {
  id: string
  code: string
  config: Json
  creator_user_id: string
  created_at: string
  contribution_count: number
}
