export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      notifications: {
        Row: {
          action_url: string | null
          body: string | null
          created_at: string
          id: string
          is_read: boolean
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Insert: {
          action_url?: string | null
          body?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          title: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Update: {
          action_url?: string | null
          body?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string
        }
        Relationships: []
      }
      parking_history: {
        Row: {
          created_at: string
          duration_hours: number | null
          entry_time: string
          exit_time: string | null
          id: string
          lot_id: string | null
          lot_name: string
          reservation_id: string | null
          slot_number: string | null
          status: string | null
          total_paid: number | null
          user_id: string
        }
        Insert: {
          created_at?: string
          duration_hours?: number | null
          entry_time: string
          exit_time?: string | null
          id?: string
          lot_id?: string | null
          lot_name: string
          reservation_id?: string | null
          slot_number?: string | null
          status?: string | null
          total_paid?: number | null
          user_id: string
        }
        Update: {
          created_at?: string
          duration_hours?: number | null
          entry_time?: string
          exit_time?: string | null
          id?: string
          lot_id?: string | null
          lot_name?: string
          reservation_id?: string | null
          slot_number?: string | null
          status?: string | null
          total_paid?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "parking_history_lot_id_fkey"
            columns: ["lot_id"]
            isOneToOne: false
            referencedRelation: "parking_lots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parking_history_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
        ]
      }
      parking_lots: {
        Row: {
          address: string
          amenities: string[] | null
          city: string | null
          closing_time: string | null
          created_at: string
          description: string | null
          hourly_price: number
          id: string
          image_url: string | null
          is_active: boolean
          latitude: number
          longitude: number
          name: string
          opening_time: string | null
          rating: number | null
          review_count: number
          total_slots: number
          updated_at: string
        }
        Insert: {
          address: string
          amenities?: string[] | null
          city?: string | null
          closing_time?: string | null
          created_at?: string
          description?: string | null
          hourly_price?: number
          id?: string
          image_url?: string | null
          is_active?: boolean
          latitude: number
          longitude: number
          name: string
          opening_time?: string | null
          rating?: number | null
          review_count?: number
          total_slots?: number
          updated_at?: string
        }
        Update: {
          address?: string
          amenities?: string[] | null
          city?: string | null
          closing_time?: string | null
          created_at?: string
          description?: string | null
          hourly_price?: number
          id?: string
          image_url?: string | null
          is_active?: boolean
          latitude?: number
          longitude?: number
          name?: string
          opening_time?: string | null
          rating?: number | null
          review_count?: number
          total_slots?: number
          updated_at?: string
        }
        Relationships: []
      }
      parking_slots: {
        Row: {
          created_at: string
          floor: string | null
          id: string
          lot_id: string
          slot_number: string
          slot_type: Database["public"]["Enums"]["slot_type"]
          status: Database["public"]["Enums"]["slot_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          floor?: string | null
          id?: string
          lot_id: string
          slot_number: string
          slot_type?: Database["public"]["Enums"]["slot_type"]
          status?: Database["public"]["Enums"]["slot_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          floor?: string | null
          id?: string
          lot_id?: string
          slot_number?: string
          slot_type?: Database["public"]["Enums"]["slot_type"]
          status?: Database["public"]["Enums"]["slot_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "parking_slots_lot_id_fkey"
            columns: ["lot_id"]
            isOneToOne: false
            referencedRelation: "parking_lots"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          id: string
          method: Database["public"]["Enums"]["payment_method"]
          paid_at: string | null
          reservation_id: string
          status: Database["public"]["Enums"]["payment_status"]
          transaction_ref: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          method: Database["public"]["Enums"]["payment_method"]
          paid_at?: string | null
          reservation_id: string
          status?: Database["public"]["Enums"]["payment_status"]
          transaction_ref?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          method?: Database["public"]["Enums"]["payment_method"]
          paid_at?: string | null
          reservation_id?: string
          status?: Database["public"]["Enums"]["payment_status"]
          transaction_ref?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      reservations: {
        Row: {
          checked_in_at: string | null
          checked_out_at: string | null
          created_at: string
          discount: number
          duration_hours: number
          end_time: string
          hourly_price: number
          id: string
          lot_id: string
          qr_code: string | null
          reservation_expires_at: string | null
          slot_id: string
          start_time: string
          status: Database["public"]["Enums"]["reservation_status"]
          tax: number
          total_amount: number
          updated_at: string
          user_id: string
          vehicle_id: string | null
        }
        Insert: {
          checked_in_at?: string | null
          checked_out_at?: string | null
          created_at?: string
          discount?: number
          duration_hours: number
          end_time: string
          hourly_price: number
          id?: string
          lot_id: string
          qr_code?: string | null
          reservation_expires_at?: string | null
          slot_id: string
          start_time: string
          status?: Database["public"]["Enums"]["reservation_status"]
          tax?: number
          total_amount: number
          updated_at?: string
          user_id: string
          vehicle_id?: string | null
        }
        Update: {
          checked_in_at?: string | null
          checked_out_at?: string | null
          created_at?: string
          discount?: number
          duration_hours?: number
          end_time?: string
          hourly_price?: number
          id?: string
          lot_id?: string
          qr_code?: string | null
          reservation_expires_at?: string | null
          slot_id?: string
          start_time?: string
          status?: Database["public"]["Enums"]["reservation_status"]
          tax?: number
          total_amount?: number
          updated_at?: string
          user_id?: string
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reservations_lot_id_fkey"
            columns: ["lot_id"]
            isOneToOne: false
            referencedRelation: "parking_lots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_slot_id_fkey"
            columns: ["slot_id"]
            isOneToOne: false
            referencedRelation: "parking_slots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vehicles: {
        Row: {
          color: string | null
          created_at: string
          id: string
          is_default: boolean
          license_plate: string
          make: string | null
          model: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          id?: string
          is_default?: boolean
          license_plate: string
          make?: string | null
          model?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string
          id?: string
          is_default?: boolean
          license_plate?: string
          make?: string | null
          model?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
      notification_type:
        | "reservation"
        | "payment"
        | "reminder"
        | "offer"
        | "system"
      payment_method: "upi" | "card" | "wallet"
      payment_status: "pending" | "paid" | "failed" | "refunded"
      reservation_status:
        | "pending"
        | "confirmed"
        | "active"
        | "completed"
        | "cancelled"
        | "expired"
      slot_status: "available" | "occupied" | "reserved" | "disabled"
      slot_type: "standard" | "compact" | "ev" | "handicap" | "bike"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
      notification_type: [
        "reservation",
        "payment",
        "reminder",
        "offer",
        "system",
      ],
      payment_method: ["upi", "card", "wallet"],
      payment_status: ["pending", "paid", "failed", "refunded"],
      reservation_status: [
        "pending",
        "confirmed",
        "active",
        "completed",
        "cancelled",
        "expired",
      ],
      slot_status: ["available", "occupied", "reserved", "disabled"],
      slot_type: ["standard", "compact", "ev", "handicap", "bike"],
    },
  },
} as const
