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
      profiles: {
        Row: {
          id: string
          full_name: string | null
          created_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          full_name?: string | null
          created_at?: string
        }
      }
      modules: {
        Row: {
          id: number
          order_number: number
          title: string
          description: string | null
          gamma_embed_url: string
          created_at: string
        }
        Insert: {
          id?: number
          order_number: number
          title: string
          description?: string | null
          gamma_embed_url: string
          created_at?: string
        }
        Update: {
          id?: number
          order_number?: number
          title?: string
          description?: string | null
          gamma_embed_url?: string
          created_at?: string
        }
      }
      questions: {
        Row: {
          id: number
          module_id: number
          question_text: string
          option_a: string
          option_b: string
          option_c: string
          option_d: string
          correct_answer: string
          order_number: number | null
        }
        Insert: {
          id?: number
          module_id: number
          question_text: string
          option_a: string
          option_b: string
          option_c: string
          option_d: string
          correct_answer: string
          order_number?: number | null
        }
        Update: {
          id?: number
          module_id?: number
          question_text?: string
          option_a?: string
          option_b?: string
          option_c?: string
          option_d?: string
          correct_answer?: string
          order_number?: number | null
        }
      }
      user_progress: {
        Row: {
          id: number
          user_id: string
          module_id: number
          view_time_seconds: number
          quiz_score: number | null
          quiz_completed: boolean
          completed_at: string | null
        }
        Insert: {
          id?: number
          user_id: string
          module_id: number
          view_time_seconds?: number
          quiz_score?: number | null
          quiz_completed?: boolean
          completed_at?: string | null
        }
        Update: {
          id?: number
          user_id?: string
          module_id?: number
          view_time_seconds?: number
          quiz_score?: number | null
          quiz_completed?: boolean
          completed_at?: string | null
        }
      }
      certificates: {
        Row: {
          id: number
          user_id: string
          verification_code: string
          average_score: number | null
          issued_at: string
        }
        Insert: {
          id?: number
          user_id: string
          verification_code: string
          average_score?: number | null
          issued_at?: string
        }
        Update: {
          id?: number
          user_id?: string
          verification_code?: string
          average_score?: number | null
          issued_at?: string
        }
      }
    }
  }
}

export type Profile = Database['public']['Tables']['profiles']['Row']
export type Module = Database['public']['Tables']['modules']['Row']
export type Question = Database['public']['Tables']['questions']['Row']
export type UserProgress = Database['public']['Tables']['user_progress']['Row']
export type Certificate = Database['public']['Tables']['certificates']['Row']
