export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      accounts: {
        Row: {
          balance: number
          created_at: string
          id: string
          name: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          created_at?: string
          id?: string
          name: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          created_at?: string
          id?: string
          name?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      bills: {
        Row: {
          amount: number
          created_at: string
          due: string
          id: string
          label: string
          paid: boolean
          recurring: string
          sub: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          due: string
          id?: string
          label: string
          paid?: boolean
          recurring?: string
          sub?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          due?: string
          id?: string
          label?: string
          paid?: boolean
          recurring?: string
          sub?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      cutoff_budgets: {
        Row: {
          committed: boolean
          created_at: string
          date_received: string
          days_in_cutoff: number
          id: string
          label: string
          linked_period_end: string | null
          linked_period_start: string | null
          net_pay: number
          updated_at: string
          user_id: string
        }
        Insert: {
          committed?: boolean
          created_at?: string
          date_received?: string
          days_in_cutoff?: number
          id?: string
          label: string
          linked_period_end?: string | null
          linked_period_start?: string | null
          net_pay?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          committed?: boolean
          created_at?: string
          date_received?: string
          days_in_cutoff?: number
          id?: string
          label?: string
          linked_period_end?: string | null
          linked_period_start?: string | null
          net_pay?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      debts: {
        Row: {
          balance: number
          created_at: string
          id: string
          note: string | null
          updated_at: string
          user_id: string
          who: string
        }
        Insert: {
          balance?: number
          created_at?: string
          id?: string
          note?: string | null
          updated_at?: string
          user_id: string
          who: string
        }
        Update: {
          balance?: number
          created_at?: string
          id?: string
          note?: string | null
          updated_at?: string
          user_id?: string
          who?: string
        }
        Relationships: []
      }
      expenses: {
        Row: {
          account_id: string | null
          amount: number
          category: string
          created_at: string
          date: string
          id: string
          label: string
          updated_at: string
          user_id: string
        }
        Insert: {
          account_id?: string | null
          amount: number
          category: string
          created_at?: string
          date?: string
          id?: string
          label: string
          updated_at?: string
          user_id: string
        }
        Update: {
          account_id?: string | null
          amount?: number
          category?: string
          created_at?: string
          date?: string
          id?: string
          label?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "expenses_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      settings: {
        Row: {
          budget: Json
          created_at: string
          deductions: Json
          default_account_id: string | null
          monthly_salary: number
          pay: Json
          updated_at: string
          user_id: string
          work_days: number
        }
        Insert: {
          budget?: Json
          created_at?: string
          deductions?: Json
          default_account_id?: string | null
          monthly_salary?: number
          pay?: Json
          updated_at?: string
          user_id: string
          work_days?: number
        }
        Update: {
          budget?: Json
          created_at?: string
          deductions?: Json
          default_account_id?: string | null
          monthly_salary?: number
          pay?: Json
          updated_at?: string
          user_id?: string
          work_days?: number
        }
        Relationships: [
          {
            foreignKeyName: "settings_default_account_id_fkey"
            columns: ["default_account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      time_entries: {
        Row: {
          created_at: string
          date: string
          holiday: string
          id: string
          time_in: string
          time_out: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          date: string
          holiday?: string
          id?: string
          time_in: string
          time_out?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string
          holiday?: string
          id?: string
          time_in?: string
          time_out?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: { [_ in never]: never }
    Functions: {
      commit_cutoff: {
        Args: { p_cutoff_id: string }
        Returns: Database["public"]["Tables"]["cutoff_budgets"]["Row"]
      }
      adjust_balance: {
        Args: { p_account_id: string; p_delta: number }
        Returns: Database["public"]["Tables"]["accounts"]["Row"]
      }
    }
    Enums: { [_ in never]: never }
    CompositeTypes: { [_ in never]: never }
  }
}
