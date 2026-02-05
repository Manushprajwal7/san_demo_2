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
      branches: {
        Row: {
          id: string
          company_id: string
          name: string
          location: string | null
          approved_manpower: number
          actual_manpower: number
          total_salary: number
          created_at: string
        }
        Insert: {
          id?: string
          company_id: string
          name: string
          location?: string | null
          approved_manpower?: number
          actual_manpower?: number
          total_salary?: number
          created_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          name?: string
          location?: string | null
          approved_manpower?: number
          actual_manpower?: number
          total_salary?: number
          created_at?: string
        }
      }
      branch_status: {
        Row: {
          id: string
          company_id: string
          branch_type: string
          expiry_date: string | null
          status: string
          created_at: string
        }
        Insert: {
          id?: string
          company_id: string
          branch_type: string
          expiry_date?: string | null
          status?: string
          created_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          branch_type?: string
          expiry_date?: string | null
          status?: string
          created_at?: string
        }
      }
      companies: {
        Row: {
          id: string
          name: string
          code: string
          email: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          code: string
          email?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          code?: string
          email?: string | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
