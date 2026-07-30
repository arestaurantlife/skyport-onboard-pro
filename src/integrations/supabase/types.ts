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
      app_role_assignments: {
        Row: {
          app_role: Database["public"]["Enums"]["platform_role"]
          created_at: string
          granted_at: string
          granted_by: string | null
          id: string
          org_id: string
          outlet_scope_id: string | null
          revoked_at: string | null
          revoked_by: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          app_role: Database["public"]["Enums"]["platform_role"]
          created_at?: string
          granted_at?: string
          granted_by?: string | null
          id?: string
          org_id: string
          outlet_scope_id?: string | null
          revoked_at?: string | null
          revoked_by?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          app_role?: Database["public"]["Enums"]["platform_role"]
          created_at?: string
          granted_at?: string
          granted_by?: string | null
          id?: string
          org_id?: string
          outlet_scope_id?: string | null
          revoked_at?: string | null
          revoked_by?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "app_role_assignments_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "app_role_assignments_outlet_scope_id_fkey"
            columns: ["outlet_scope_id"]
            isOneToOne: false
            referencedRelation: "outlets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "app_role_assignments_outlet_scope_id_fkey"
            columns: ["outlet_scope_id"]
            isOneToOne: false
            referencedRelation: "outlets_public"
            referencedColumns: ["id"]
          },
        ]
      }
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
      content_block_translations: {
        Row: {
          body_markdown: string
          content_block_id: string
          created_at: string
          id: string
          locale: string
          org_id: string
          reviewed_by: string | null
          status: string
          title: string
          translated_by: string | null
          updated_at: string
        }
        Insert: {
          body_markdown?: string
          content_block_id: string
          created_at?: string
          id?: string
          locale: string
          org_id: string
          reviewed_by?: string | null
          status?: string
          title?: string
          translated_by?: string | null
          updated_at?: string
        }
        Update: {
          body_markdown?: string
          content_block_id?: string
          created_at?: string
          id?: string
          locale?: string
          org_id?: string
          reviewed_by?: string | null
          status?: string
          title?: string
          translated_by?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_block_translations_content_block_id_fkey"
            columns: ["content_block_id"]
            isOneToOne: false
            referencedRelation: "content_blocks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_block_translations_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      content_blocks: {
        Row: {
          block_type: string
          core_block_id: string | null
          created_at: string
          id: string
          is_active: boolean
          module_id: string
          org_id: string
          payload: Json
          sort_order: number
          source: string
          updated_at: string
        }
        Insert: {
          block_type: string
          core_block_id?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          module_id: string
          org_id: string
          payload?: Json
          sort_order?: number
          source: string
          updated_at?: string
        }
        Update: {
          block_type?: string
          core_block_id?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          module_id?: string
          org_id?: string
          payload?: Json
          sort_order?: number
          source?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_blocks_core_block_id_fkey"
            columns: ["core_block_id"]
            isOneToOne: false
            referencedRelation: "core_library_blocks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_blocks_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "curriculum_modules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_blocks_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      core_library_block_translations: {
        Row: {
          body_markdown: string
          core_library_block_id: string
          created_at: string
          id: string
          locale: string
          reviewed_by: string | null
          status: string
          title: string
          translated_by: string | null
          updated_at: string
        }
        Insert: {
          body_markdown?: string
          core_library_block_id: string
          created_at?: string
          id?: string
          locale: string
          reviewed_by?: string | null
          status?: string
          title?: string
          translated_by?: string | null
          updated_at?: string
        }
        Update: {
          body_markdown?: string
          core_library_block_id?: string
          created_at?: string
          id?: string
          locale?: string
          reviewed_by?: string | null
          status?: string
          title?: string
          translated_by?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "core_library_block_translations_core_library_block_id_fkey"
            columns: ["core_library_block_id"]
            isOneToOne: false
            referencedRelation: "core_library_blocks"
            referencedColumns: ["id"]
          },
        ]
      }
      core_library_blocks: {
        Row: {
          block_type: string
          created_at: string
          id: string
          is_active: boolean
          key: string
          payload: Json
          sort_order: number
          topic: string | null
          updated_at: string
        }
        Insert: {
          block_type: string
          created_at?: string
          id?: string
          is_active?: boolean
          key: string
          payload?: Json
          sort_order?: number
          topic?: string | null
          updated_at?: string
        }
        Update: {
          block_type?: string
          created_at?: string
          id?: string
          is_active?: boolean
          key?: string
          payload?: Json
          sort_order?: number
          topic?: string | null
          updated_at?: string
        }
        Relationships: []
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
      curricula: {
        Row: {
          created_at: string
          description: string
          id: string
          is_active: boolean
          job_role_key: string | null
          key: string
          org_id: string
          outlet_id: string | null
          pass_threshold: number
          status: string
          title: string
          updated_at: string
          version: number
        }
        Insert: {
          created_at?: string
          description?: string
          id?: string
          is_active?: boolean
          job_role_key?: string | null
          key: string
          org_id: string
          outlet_id?: string | null
          pass_threshold?: number
          status?: string
          title?: string
          updated_at?: string
          version?: number
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          is_active?: boolean
          job_role_key?: string | null
          key?: string
          org_id?: string
          outlet_id?: string | null
          pass_threshold?: number
          status?: string
          title?: string
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "curricula_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "curricula_outlet_id_fkey"
            columns: ["outlet_id"]
            isOneToOne: false
            referencedRelation: "outlets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "curricula_outlet_id_fkey"
            columns: ["outlet_id"]
            isOneToOne: false
            referencedRelation: "outlets_public"
            referencedColumns: ["id"]
          },
        ]
      }
      curriculum_module_translations: {
        Row: {
          created_at: string
          curriculum_module_id: string
          description: string
          id: string
          locale: string
          org_id: string
          reviewed_by: string | null
          status: string
          title: string
          translated_by: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          curriculum_module_id: string
          description?: string
          id?: string
          locale: string
          org_id: string
          reviewed_by?: string | null
          status?: string
          title?: string
          translated_by?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          curriculum_module_id?: string
          description?: string
          id?: string
          locale?: string
          org_id?: string
          reviewed_by?: string | null
          status?: string
          title?: string
          translated_by?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "curriculum_module_translations_curriculum_module_id_fkey"
            columns: ["curriculum_module_id"]
            isOneToOne: false
            referencedRelation: "curriculum_modules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "curriculum_module_translations_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      curriculum_modules: {
        Row: {
          created_at: string
          curriculum_id: string
          estimated_minutes: number
          id: string
          is_required: boolean
          key: string
          module_index: number
          org_id: string
          pass_threshold: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          curriculum_id: string
          estimated_minutes?: number
          id?: string
          is_required?: boolean
          key: string
          module_index: number
          org_id: string
          pass_threshold?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          curriculum_id?: string
          estimated_minutes?: number
          id?: string
          is_required?: boolean
          key?: string
          module_index?: number
          org_id?: string
          pass_threshold?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "curriculum_modules_curriculum_id_fkey"
            columns: ["curriculum_id"]
            isOneToOne: false
            referencedRelation: "curricula"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "curriculum_modules_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
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
      job_role_translations: {
        Row: {
          created_at: string
          description: string
          id: string
          job_role_id: string
          label: string
          locale: string
          reviewed_by: string | null
          status: string
          translated_by: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string
          id?: string
          job_role_id: string
          label?: string
          locale: string
          reviewed_by?: string | null
          status?: string
          translated_by?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          job_role_id?: string
          label?: string
          locale?: string
          reviewed_by?: string | null
          status?: string
          translated_by?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_role_translations_job_role_id_fkey"
            columns: ["job_role_id"]
            isOneToOne: false
            referencedRelation: "job_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      job_roles: {
        Row: {
          created_at: string
          id: string
          is_management: boolean
          key: string
          org_id: string | null
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_management?: boolean
          key: string
          org_id?: string | null
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_management?: boolean
          key?: string
          org_id?: string | null
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_roles_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
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
      organizations: {
        Row: {
          created_at: string
          id: string
          invite_expiry_days: number
          legal_name: string
          logo_url: string | null
          name: string
          pass_threshold_default: number
          slug: string
          unit_label: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          invite_expiry_days?: number
          legal_name?: string
          logo_url?: string | null
          name: string
          pass_threshold_default?: number
          slug: string
          unit_label?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          invite_expiry_days?: number
          legal_name?: string
          logo_url?: string | null
          name?: string
          pass_threshold_default?: number
          slug?: string
          unit_label?: string
          updated_at?: string
        }
        Relationships: []
      }
      outlets: {
        Row: {
          brand_description: string
          concept: string
          concourse: string | null
          created_at: string
          director_name: string
          hours: string
          id: string
          manager_name: string
          name: string
          org_id: string | null
          terminal: string
        }
        Insert: {
          brand_description?: string
          concept: string
          concourse?: string | null
          created_at?: string
          director_name?: string
          hours?: string
          id?: string
          manager_name?: string
          name: string
          org_id?: string | null
          terminal?: string
        }
        Update: {
          brand_description?: string
          concept?: string
          concourse?: string | null
          created_at?: string
          director_name?: string
          hours?: string
          id?: string
          manager_name?: string
          name?: string
          org_id?: string | null
          terminal?: string
        }
        Relationships: [
          {
            foreignKeyName: "outlets_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string
          hire_date: string | null
          hired_at: string
          id: string
          is_test_account: boolean
          job_role: Database["public"]["Enums"]["job_role"] | null
          job_role_key: string | null
          org_id: string | null
          outlet_id: string | null
          preferred_language: string
          primary_outlet_id: string | null
        }
        Insert: {
          created_at?: string
          email?: string
          full_name?: string
          hire_date?: string | null
          hired_at?: string
          id: string
          is_test_account?: boolean
          job_role?: Database["public"]["Enums"]["job_role"] | null
          job_role_key?: string | null
          org_id?: string | null
          outlet_id?: string | null
          preferred_language?: string
          primary_outlet_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          hire_date?: string | null
          hired_at?: string
          id?: string
          is_test_account?: boolean
          job_role?: Database["public"]["Enums"]["job_role"] | null
          job_role_key?: string | null
          org_id?: string | null
          outlet_id?: string | null
          preferred_language?: string
          primary_outlet_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
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
          {
            foreignKeyName: "profiles_primary_outlet_id_fkey"
            columns: ["primary_outlet_id"]
            isOneToOne: false
            referencedRelation: "outlets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_primary_outlet_id_fkey"
            columns: ["primary_outlet_id"]
            isOneToOne: false
            referencedRelation: "outlets_public"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_attempt_answers: {
        Row: {
          attempt_id: string
          created_at: string
          id: string
          is_correct: boolean
          question_id: string
          selected_option_ids: string[]
          topic_tag: string | null
        }
        Insert: {
          attempt_id: string
          created_at?: string
          id?: string
          is_correct?: boolean
          question_id: string
          selected_option_ids?: string[]
          topic_tag?: string | null
        }
        Update: {
          attempt_id?: string
          created_at?: string
          id?: string
          is_correct?: boolean
          question_id?: string
          selected_option_ids?: string[]
          topic_tag?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quiz_attempt_answers_attempt_id_fkey"
            columns: ["attempt_id"]
            isOneToOne: false
            referencedRelation: "quiz_attempts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_attempt_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "quiz_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_attempt_questions: {
        Row: {
          attempt_id: string
          created_at: string
          id: string
          option_order: Json
          ordering: number
          question_id: string
        }
        Insert: {
          attempt_id: string
          created_at?: string
          id?: string
          option_order?: Json
          ordering?: number
          question_id: string
        }
        Update: {
          attempt_id?: string
          created_at?: string
          id?: string
          option_order?: Json
          ordering?: number
          question_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_attempt_questions_attempt_id_fkey"
            columns: ["attempt_id"]
            isOneToOne: false
            referencedRelation: "quiz_attempts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_attempt_questions_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "quiz_questions"
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
      quiz_option_translations: {
        Row: {
          created_at: string
          id: string
          label: string
          locale: string
          option_id: string
          org_id: string
          reviewed_by: string | null
          status: string
          translated_by: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          label?: string
          locale: string
          option_id: string
          org_id: string
          reviewed_by?: string | null
          status?: string
          translated_by?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          label?: string
          locale?: string
          option_id?: string
          org_id?: string
          reviewed_by?: string | null
          status?: string
          translated_by?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_option_translations_option_id_fkey"
            columns: ["option_id"]
            isOneToOne: false
            referencedRelation: "quiz_options"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_option_translations_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_options: {
        Row: {
          created_at: string
          id: string
          is_correct: boolean
          ordering: number
          org_id: string
          question_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_correct?: boolean
          ordering?: number
          org_id: string
          question_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_correct?: boolean
          ordering?: number
          org_id?: string
          question_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_options_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_options_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "quiz_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_question_translations: {
        Row: {
          created_at: string
          explanation: string
          id: string
          locale: string
          org_id: string
          prompt: string
          question_id: string
          reviewed_by: string | null
          status: string
          translated_by: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          explanation?: string
          id?: string
          locale: string
          org_id: string
          prompt?: string
          question_id: string
          reviewed_by?: string | null
          status?: string
          translated_by?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          explanation?: string
          id?: string
          locale?: string
          org_id?: string
          prompt?: string
          question_id?: string
          reviewed_by?: string | null
          status?: string
          translated_by?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_question_translations_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_question_translations_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "quiz_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_questions: {
        Row: {
          choices: Json
          correct_index: number
          created_at: string
          id: string
          is_active: boolean
          order_idx: number
          org_id: string | null
          prompt: string
          question_type: string
          quiz_id: string
          topic_tag: string | null
          updated_at: string
        }
        Insert: {
          choices: Json
          correct_index: number
          created_at?: string
          id?: string
          is_active?: boolean
          order_idx: number
          org_id?: string | null
          prompt: string
          question_type?: string
          quiz_id: string
          topic_tag?: string | null
          updated_at?: string
        }
        Update: {
          choices?: Json
          correct_index?: number
          created_at?: string
          id?: string
          is_active?: boolean
          order_idx?: number
          org_id?: string | null
          prompt?: string
          question_type?: string
          quiz_id?: string
          topic_tag?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_questions_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
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
          created_at: string
          curriculum_module_id: string | null
          id: string
          is_active: boolean
          module_id: string
          org_id: string | null
          pass_threshold: number
          questions_to_draw: number
          retake_cooldown_minutes: number
          shuffle_options: boolean
          shuffle_questions: boolean
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          curriculum_module_id?: string | null
          id?: string
          is_active?: boolean
          module_id: string
          org_id?: string | null
          pass_threshold?: number
          questions_to_draw?: number
          retake_cooldown_minutes?: number
          shuffle_options?: boolean
          shuffle_questions?: boolean
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          curriculum_module_id?: string | null
          id?: string
          is_active?: boolean
          module_id?: string
          org_id?: string | null
          pass_threshold?: number
          questions_to_draw?: number
          retake_cooldown_minutes?: number
          shuffle_options?: boolean
          shuffle_questions?: boolean
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quizzes_curriculum_module_id_fkey"
            columns: ["curriculum_module_id"]
            isOneToOne: false
            referencedRelation: "curriculum_modules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quizzes_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quizzes_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
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
      current_org_ids: { Args: never; Returns: string[] }
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      email_queue_dispatch: { Args: never; Returns: undefined }
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
      has_app_role: {
        Args: { target_org: string; target_role: string }
        Returns: boolean
      }
      has_manager_tier: { Args: { target_org: string }; Returns: boolean }
      has_org_admin_tier: { Args: { target_org: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      invite_code_is_valid: { Args: { _code: string }; Returns: boolean }
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
      platform_role:
        | "super_admin"
        | "org_admin"
        | "director_of_operations"
        | "general_manager"
        | "manager"
        | "assistant_manager"
        | "trainee"
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
      platform_role: [
        "super_admin",
        "org_admin",
        "director_of_operations",
        "general_manager",
        "manager",
        "assistant_manager",
        "trainee",
      ],
    },
  },
} as const
