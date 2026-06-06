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
      certificate_audit_log: {
        Row: {
          certificate_id: string | null
          course_id: string
          created_at: string
          id: string
          outcome: string
          quizzes_passed: number | null
          quizzes_required: number | null
          reason: string | null
          user_id: string
        }
        Insert: {
          certificate_id?: string | null
          course_id: string
          created_at?: string
          id?: string
          outcome: string
          quizzes_passed?: number | null
          quizzes_required?: number | null
          reason?: string | null
          user_id: string
        }
        Update: {
          certificate_id?: string | null
          course_id?: string
          created_at?: string
          id?: string
          outcome?: string
          quizzes_passed?: number | null
          quizzes_required?: number | null
          reason?: string | null
          user_id?: string
        }
        Relationships: []
      }
      certificates: {
        Row: {
          course_id: string
          id: string
          issued_at: string
          serial: string
          user_id: string
        }
        Insert: {
          course_id: string
          id?: string
          issued_at?: string
          serial: string
          user_id: string
        }
        Update: {
          course_id?: string
          id?: string
          issued_at?: string
          serial?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "certificates_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      chapter_progress: {
        Row: {
          chapter_id: string
          completed_at: string
          id: string
          user_id: string
        }
        Insert: {
          chapter_id: string
          completed_at?: string
          id?: string
          user_id: string
        }
        Update: {
          chapter_id?: string
          completed_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chapter_progress_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          },
        ]
      }
      chapters: {
        Row: {
          body_markdown: string
          estimated_minutes: number
          id: string
          module_id: string
          order_idx: number
          title: string
          video_url: string | null
        }
        Insert: {
          body_markdown?: string
          estimated_minutes?: number
          id?: string
          module_id: string
          order_idx: number
          title: string
          video_url?: string | null
        }
        Update: {
          body_markdown?: string
          estimated_minutes?: number
          id?: string
          module_id?: string
          order_idx?: number
          title?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chapters_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          created_at: string
          description: string
          id: string
          job_role: Database["public"]["Enums"]["job_role"] | null
          outlet_id: string | null
          title: string
        }
        Insert: {
          created_at?: string
          description?: string
          id?: string
          job_role?: Database["public"]["Enums"]["job_role"] | null
          outlet_id?: string | null
          title: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          job_role?: Database["public"]["Enums"]["job_role"] | null
          outlet_id?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "courses_outlet_id_fkey"
            columns: ["outlet_id"]
            isOneToOne: false
            referencedRelation: "outlets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "courses_outlet_id_fkey"
            columns: ["outlet_id"]
            isOneToOne: false
            referencedRelation: "outlets_public"
            referencedColumns: ["id"]
          },
        ]
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      invites: {
        Row: {
          code: string
          created_at: string
          created_by: string | null
          expires_at: string
          id: string
          invitee_email: string | null
          job_role: Database["public"]["Enums"]["job_role"]
          outlet_id: string
          used_at: string | null
          used_by: string | null
        }
        Insert: {
          code: string
          created_at?: string
          created_by?: string | null
          expires_at?: string
          id?: string
          invitee_email?: string | null
          job_role: Database["public"]["Enums"]["job_role"]
          outlet_id: string
          used_at?: string | null
          used_by?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          created_by?: string | null
          expires_at?: string
          id?: string
          invitee_email?: string | null
          job_role?: Database["public"]["Enums"]["job_role"]
          outlet_id?: string
          used_at?: string | null
          used_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invites_outlet_id_fkey"
            columns: ["outlet_id"]
            isOneToOne: false
            referencedRelation: "outlets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invites_outlet_id_fkey"
            columns: ["outlet_id"]
            isOneToOne: false
            referencedRelation: "outlets_public"
            referencedColumns: ["id"]
          },
        ]
      }
      modules: {
        Row: {
          course_id: string
          day_number: number
          description: string
          id: string
          order_idx: number
          title: string
        }
        Insert: {
          course_id: string
          day_number: number
          description?: string
          id?: string
          order_idx: number
          title: string
        }
        Update: {
          course_id?: string
          day_number?: number
          description?: string
          id?: string
          order_idx?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "modules_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      outlets: {
        Row: {
          brand_description: string
          concept: string
          created_at: string
          director_name: string
          hours: string
          id: string
          manager_name: string
          name: string
          terminal: string
        }
        Insert: {
          brand_description?: string
          concept: string
          created_at?: string
          director_name?: string
          hours?: string
          id?: string
          manager_name?: string
          name: string
          terminal?: string
        }
        Update: {
          brand_description?: string
          concept?: string
          created_at?: string
          director_name?: string
          hours?: string
          id?: string
          manager_name?: string
          name?: string
          terminal?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string
          hired_at: string
          id: string
          is_test_account: boolean
          job_role: Database["public"]["Enums"]["job_role"] | null
          outlet_id: string | null
        }
        Insert: {
          created_at?: string
          email?: string
          full_name?: string
          hired_at?: string
          id: string
          is_test_account?: boolean
          job_role?: Database["public"]["Enums"]["job_role"] | null
          outlet_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          hired_at?: string
          id?: string
          is_test_account?: boolean
          job_role?: Database["public"]["Enums"]["job_role"] | null
          outlet_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_outlet_id_fkey"
            columns: ["outlet_id"]
            isOneToOne: false
            referencedRelation: "outlets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_outlet_id_fkey"
            columns: ["outlet_id"]
            isOneToOne: false
            referencedRelation: "outlets_public"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_attempts: {
        Row: {
          answers: Json
          id: string
          passed: boolean
          quiz_id: string
          score: number
          taken_at: string
          user_id: string
        }
        Insert: {
          answers?: Json
          id?: string
          passed: boolean
          quiz_id: string
          score: number
          taken_at?: string
          user_id: string
        }
        Update: {
          answers?: Json
          id?: string
          passed?: boolean
          quiz_id?: string
          score?: number
          taken_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_attempts_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_questions: {
        Row: {
          choices: Json
          correct_index: number
          id: string
          order_idx: number
          prompt: string
          quiz_id: string
        }
        Insert: {
          choices: Json
          correct_index: number
          id?: string
          order_idx: number
          prompt: string
          quiz_id: string
        }
        Update: {
          choices?: Json
          correct_index?: number
          id?: string
          order_idx?: number
          prompt?: string
          quiz_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_questions_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      quizzes: {
        Row: {
          id: string
          module_id: string
          pass_threshold: number
          title: string
        }
        Insert: {
          id?: string
          module_id: string
          pass_threshold?: number
          title: string
        }
        Update: {
          id?: string
          module_id?: string
          pass_threshold?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "quizzes_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
        ]
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      outlets_public: {
        Row: {
          created_at: string | null
          id: string | null
          name: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string | null
          name?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string | null
          name?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      claim_first_admin: { Args: never; Returns: boolean }
      claim_invite: {
        Args: { _code: string }
        Returns: {
          job_role: Database["public"]["Enums"]["job_role"]
          outlet_id: string
        }[]
      }
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      get_quiz_questions: {
        Args: { _quiz_id: string }
        Returns: {
          choices: Json
          id: string
          order_idx: number
          prompt: string
        }[]
      }
      grade_quiz: {
        Args: { _answers: Json; _quiz_id: string }
        Returns: {
          attempt_id: string
          passed: boolean
          score: number
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      issue_certificate_if_complete: {
        Args: { _course_id: string }
        Returns: {
          already_existed: boolean
          certificate_id: string
          issued_at: string
          outcome: string
          serial: string
        }[]
      }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
      set_user_role: {
        Args: {
          _grant: boolean
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: undefined
      }
      validate_invite: {
        Args: { _code: string }
        Returns: {
          id: string
          job_role: Database["public"]["Enums"]["job_role"]
          outlet_id: string
        }[]
      }
    }
    Enums: {
      app_role: "employee" | "manager" | "admin"
      job_role:
        | "line_cook"
        | "hostess"
        | "server"
        | "bartender"
        | "food_runner"
        | "dishwasher"
        | "prep_cook"
        | "supervisor"
        | "new_manager"
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
      app_role: ["employee", "manager", "admin"],
      job_role: [
        "line_cook",
        "hostess",
        "server",
        "bartender",
        "food_runner",
        "dishwasher",
        "prep_cook",
        "supervisor",
        "new_manager",
      ],
    },
  },
} as const
