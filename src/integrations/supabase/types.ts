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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      comm_conversations: {
        Row: {
          created_at: string
          created_by: string
          description: string
          harvest_id: string | null
          id: string
          kind: string
          name: string
          org_id: string
          private: boolean
          request_id: string | null
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string
          harvest_id?: string | null
          id?: string
          kind: string
          name: string
          org_id: string
          private?: boolean
          request_id?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string
          harvest_id?: string | null
          id?: string
          kind?: string
          name?: string
          org_id?: string
          private?: boolean
          request_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "comm_conversations_harvest_id_fkey"
            columns: ["harvest_id"]
            isOneToOne: false
            referencedRelation: "harvests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comm_conversations_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "comm_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comm_conversations_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "trade_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      comm_invitations: {
        Row: {
          accepted_by: string | null
          conversation_id: string | null
          created_at: string
          expires_at: string
          id: string
          invited_by: string
          org_id: string
          token: string
        }
        Insert: {
          accepted_by?: string | null
          conversation_id?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          invited_by: string
          org_id: string
          token?: string
        }
        Update: {
          accepted_by?: string | null
          conversation_id?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          invited_by?: string
          org_id?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "comm_invitations_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "comm_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comm_invitations_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "comm_organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      comm_messages: {
        Row: {
          attachments: Json
          body: string
          conversation_id: string
          created_at: string
          deleted_at: string | null
          edited_at: string | null
          id: string
          mentions: string[]
          parent_id: string | null
          sender_id: string
        }
        Insert: {
          attachments?: Json
          body?: string
          conversation_id: string
          created_at?: string
          deleted_at?: string | null
          edited_at?: string | null
          id?: string
          mentions?: string[]
          parent_id?: string | null
          sender_id: string
        }
        Update: {
          attachments?: Json
          body?: string
          conversation_id?: string
          created_at?: string
          deleted_at?: string | null
          edited_at?: string | null
          id?: string
          mentions?: string[]
          parent_id?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comm_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "comm_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comm_messages_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "comm_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comm_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      comm_org_members: {
        Row: {
          org_id: string
          role: string
          user_id: string
        }
        Insert: {
          org_id: string
          role?: string
          user_id: string
        }
        Update: {
          org_id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comm_org_members_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "comm_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comm_org_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      comm_organizations: {
        Row: {
          created_at: string
          created_by: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      comm_participants: {
        Row: {
          conversation_id: string
          last_read_at: string
          muted: boolean
          org_id: string
          user_id: string
        }
        Insert: {
          conversation_id: string
          last_read_at?: string
          muted?: boolean
          org_id: string
          user_id: string
        }
        Update: {
          conversation_id?: string
          last_read_at?: string
          muted?: boolean
          org_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comm_participants_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "comm_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comm_participants_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "comm_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comm_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      comm_reactions: {
        Row: {
          id: string
          message_id: string
          reaction: string
          user_id: string
        }
        Insert: {
          id?: string
          message_id?: string
          reaction: string
          user_id: string
        }
        Update: {
          id?: string
          message_id?: string
          reaction?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comm_reaction_message"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "comm_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      farm_monitor_events: {
        Row: {
          created_at: string
          event_key: string
          fingerprint: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_key: string
          fingerprint: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_key?: string
          fingerprint?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "farm_monitor_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      farm_monitor_state: {
        Row: {
          dirty: boolean
          last_checked_at: string | null
          last_error: string | null
          user_id: string
        }
        Insert: {
          dirty?: boolean
          last_checked_at?: string | null
          last_error?: string | null
          user_id: string
        }
        Update: {
          dirty?: boolean
          last_checked_at?: string | null
          last_error?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "farm_monitor_state_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      farm_reports: {
        Row: {
          created_at: string
          currency: string
          id: string
          period_end: string
          period_start: string
          snapshot: Json
          time_zone: string
          user_id: string
          week_starts_on: string
        }
        Insert: {
          created_at?: string
          currency: string
          id?: string
          period_end: string
          period_start: string
          snapshot: Json
          time_zone: string
          user_id: string
          week_starts_on: string
        }
        Update: {
          created_at?: string
          currency?: string
          id?: string
          period_end?: string
          period_start?: string
          snapshot?: Json
          time_zone?: string
          user_id?: string
          week_starts_on?: string
        }
        Relationships: [
          {
            foreignKeyName: "farm_reports_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      farmer_goals: {
        Row: {
          baseline: number | null
          baseline_date: string
          created_at: string
          crop: string | null
          currency: string
          current_value: number | null
          due_date: string
          id: string
          measurement: string
          metric: string
          status: string
          target: number
          title: string
          user_id: string
        }
        Insert: {
          baseline?: number | null
          baseline_date?: string
          created_at?: string
          crop?: string | null
          currency?: string
          current_value?: number | null
          due_date: string
          id?: string
          measurement?: string
          metric: string
          status?: string
          target: number
          title: string
          user_id?: string
        }
        Update: {
          baseline?: number | null
          baseline_date?: string
          created_at?: string
          crop?: string | null
          currency?: string
          current_value?: number | null
          due_date?: string
          id?: string
          measurement?: string
          metric?: string
          status?: string
          target?: number
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      farmer_guide_preferences: {
        Row: {
          recall_enabled: boolean
          user_id: string
        }
        Insert: {
          recall_enabled?: boolean
          user_id?: string
        }
        Update: {
          recall_enabled?: boolean
          user_id?: string
        }
        Relationships: []
      }
      farmer_memories: {
        Row: {
          content: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      fi_activity: {
        Row: {
          actor_id: string
          body: string
          created_at: string
          id: string
          internal: boolean
          kind: string
          report_id: string
        }
        Insert: {
          actor_id: string
          body?: string
          created_at?: string
          id?: string
          internal?: boolean
          kind: string
          report_id: string
        }
        Update: {
          actor_id?: string
          body?: string
          created_at?: string
          id?: string
          internal?: boolean
          kind?: string
          report_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fi_activity_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "fi_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      fi_assignments: {
        Row: {
          field_id: string
          user_id: string
        }
        Insert: {
          field_id: string
          user_id: string
        }
        Update: {
          field_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fi_assignments_field_id_fkey"
            columns: ["field_id"]
            isOneToOne: false
            referencedRelation: "fi_fields"
            referencedColumns: ["id"]
          },
        ]
      }
      fi_boundaries: {
        Row: {
          area_m2: number
          created_at: string
          created_by: string
          field_id: string
          geometry: Json
          id: string
          version: number
        }
        Insert: {
          area_m2?: number
          created_at?: string
          created_by: string
          field_id: string
          geometry: Json
          id?: string
          version: number
        }
        Update: {
          area_m2?: number
          created_at?: string
          created_by?: string
          field_id?: string
          geometry?: Json
          id?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "fi_boundaries_field_id_fkey"
            columns: ["field_id"]
            isOneToOne: false
            referencedRelation: "fi_fields"
            referencedColumns: ["id"]
          },
        ]
      }
      fi_evidence: {
        Row: {
          created_at: string
          id: string
          mime: string
          name: string
          path: string
          report_id: string
          source: string
          uploaded_by: string
        }
        Insert: {
          created_at?: string
          id?: string
          mime: string
          name: string
          path: string
          report_id: string
          source?: string
          uploaded_by: string
        }
        Update: {
          created_at?: string
          id?: string
          mime?: string
          name?: string
          path?: string
          report_id?: string
          source?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "fi_evidence_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "fi_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      fi_farms: {
        Row: {
          created_at: string
          created_by: string
          demo: boolean
          id: string
          location: string
          name: string
          org_id: string | null
        }
        Insert: {
          created_at?: string
          created_by: string
          demo?: boolean
          id?: string
          location?: string
          name: string
          org_id?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string
          demo?: boolean
          id?: string
          location?: string
          name?: string
          org_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fi_farms_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "comm_organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      fi_fields: {
        Row: {
          active: boolean
          code: string
          created_at: string
          crop: string
          farm_id: string
          id: string
          name: string
        }
        Insert: {
          active?: boolean
          code: string
          created_at?: string
          crop?: string
          farm_id: string
          id?: string
          name: string
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string
          crop?: string
          farm_id?: string
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "fi_fields_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "fi_farms"
            referencedColumns: ["id"]
          },
        ]
      }
      fi_reports: {
        Row: {
          affected_area_m2: number | null
          assigned_to: string | null
          boundary_id: string
          category: string
          created_at: string
          crop: string
          description: string
          field_id: string
          harvest_id: string | null
          id: string
          observed_at: string
          quantity_kg: number | null
          request_id: string | null
          sample: boolean
          status: string
          submitted_by: string
        }
        Insert: {
          affected_area_m2?: number | null
          assigned_to?: string | null
          boundary_id: string
          category: string
          created_at?: string
          crop?: string
          description: string
          field_id: string
          harvest_id?: string | null
          id?: string
          observed_at?: string
          quantity_kg?: number | null
          request_id?: string | null
          sample?: boolean
          status?: string
          submitted_by: string
        }
        Update: {
          affected_area_m2?: number | null
          assigned_to?: string | null
          boundary_id?: string
          category?: string
          created_at?: string
          crop?: string
          description?: string
          field_id?: string
          harvest_id?: string | null
          id?: string
          observed_at?: string
          quantity_kg?: number | null
          request_id?: string | null
          sample?: boolean
          status?: string
          submitted_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "fi_reports_boundary_id_fkey"
            columns: ["boundary_id"]
            isOneToOne: false
            referencedRelation: "fi_boundaries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fi_reports_field_id_fkey"
            columns: ["field_id"]
            isOneToOne: false
            referencedRelation: "fi_fields"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fi_reports_harvest_id_fkey"
            columns: ["harvest_id"]
            isOneToOne: false
            referencedRelation: "harvests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fi_reports_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "trade_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      guide_messages: {
        Row: {
          created_at: string
          id: string
          management_only: boolean
          message: Json
          message_id: string
          thread_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          management_only?: boolean
          message: Json
          message_id: string
          thread_id: string
          user_id?: string
        }
        Update: {
          created_at?: string
          id?: string
          management_only?: boolean
          message?: Json
          message_id?: string
          thread_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "guide_messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "guide_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      guide_threads: {
        Row: {
          auto_topic: string | null
          created_at: string
          goal_id: string | null
          harvest_id: string | null
          id: string
          title: string
          title_custom: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          auto_topic?: string | null
          created_at?: string
          goal_id?: string | null
          harvest_id?: string | null
          id?: string
          title?: string
          title_custom?: boolean
          updated_at?: string
          user_id?: string
        }
        Update: {
          auto_topic?: string | null
          created_at?: string
          goal_id?: string | null
          harvest_id?: string | null
          id?: string
          title?: string
          title_custom?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "guide_threads_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "farmer_goals"
            referencedColumns: ["id"]
          },
        ]
      }
      harvests: {
        Row: {
          ai_summary: string | null
          cost: number
          created_at: string
          currency: string
          destination: string
          expected_revenue: number
          farmer_id: string
          field_name: string | null
          grade: string
          harvest_date: string
          id: string
          notes: string | null
          photo_path: string | null
          quantity: number
          report_type: string
          review_note: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["harvest_status"]
          unit: string
          vegetable: string
          visual_items: Json | null
        }
        Insert: {
          ai_summary?: string | null
          cost?: number
          created_at?: string
          currency?: string
          destination?: string
          expected_revenue?: number
          farmer_id?: string
          field_name?: string | null
          grade?: string
          harvest_date?: string
          id?: string
          notes?: string | null
          photo_path?: string | null
          quantity: number
          report_type?: string
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["harvest_status"]
          unit?: string
          vegetable: string
          visual_items?: Json | null
        }
        Update: {
          ai_summary?: string | null
          cost?: number
          created_at?: string
          currency?: string
          destination?: string
          expected_revenue?: number
          farmer_id?: string
          field_name?: string | null
          grade?: string
          harvest_date?: string
          id?: string
          notes?: string | null
          photo_path?: string | null
          quantity?: number
          report_type?: string
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["harvest_status"]
          unit?: string
          vegetable?: string
          visual_items?: Json | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string
          created_at: string
          details: Json | null
          event_type: string | null
          harvest_id: string | null
          id: string
          read: boolean
          title: string
          user_id: string
        }
        Insert: {
          body?: string
          created_at?: string
          details?: Json | null
          event_type?: string | null
          harvest_id?: string | null
          id?: string
          read?: boolean
          title: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          details?: Json | null
          event_type?: string | null
          harvest_id?: string | null
          id?: string
          read?: boolean
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string
          farm_name: string | null
          id: string
        }
        Insert: {
          created_at?: string
          display_name?: string
          farm_name?: string | null
          id: string
        }
        Update: {
          created_at?: string
          display_name?: string
          farm_name?: string | null
          id?: string
        }
        Relationships: []
      }
      reflections: {
        Row: {
          created_at: string
          id: string
          mood: number
          note: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          mood: number
          note?: string
          user_id?: string
        }
        Update: {
          created_at?: string
          id?: string
          mood?: number
          note?: string
          user_id?: string
        }
        Relationships: []
      }
      trade_requests: {
        Row: {
          created_at: string
          created_by: string
          destination: string
          direction: string
          id: string
          notes: string
          org_id: string
          origin: string
          partner_org_id: string | null
          quantity: number
          review_note: string
          reviewed_by: string | null
          status: string
          title: string
          vegetable: string
        }
        Insert: {
          created_at?: string
          created_by: string
          destination: string
          direction: string
          id?: string
          notes?: string
          org_id: string
          origin: string
          partner_org_id?: string | null
          quantity: number
          review_note?: string
          reviewed_by?: string | null
          status?: string
          title: string
          vegetable: string
        }
        Update: {
          created_at?: string
          created_by?: string
          destination?: string
          direction?: string
          id?: string
          notes?: string
          org_id?: string
          origin?: string
          partner_org_id?: string | null
          quantity?: number
          review_note?: string
          reviewed_by?: string | null
          status?: string
          title?: string
          vegetable?: string
        }
        Relationships: [
          {
            foreignKeyName: "trade_requests_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "comm_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trade_requests_partner_org_id_fkey"
            columns: ["partner_org_id"]
            isOneToOne: false
            referencedRelation: "comm_organizations"
            referencedColumns: ["id"]
          },
        ]
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
      user_settings: {
        Row: {
          currency: string
          language: string
          monitoring_enabled: boolean
          proactive_notifications: boolean
          time_zone: string
          updated_at: string
          user_id: string
          week_starts_on: string
        }
        Insert: {
          currency?: string
          language?: string
          monitoring_enabled?: boolean
          proactive_notifications?: boolean
          time_zone?: string
          updated_at?: string
          user_id?: string
          week_starts_on?: string
        }
        Update: {
          currency?: string
          language?: string
          monitoring_enabled?: boolean
          proactive_notifications?: boolean
          time_zone?: string
          updated_at?: string
          user_id?: string
          week_starts_on?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_manage_farm: { Args: { p_farmer: string }; Returns: boolean }
      comm_accept_invitation: {
        Args: { p_org?: string; p_token: string }
        Returns: Json
      }
      comm_access: { Args: { p_conversation: string }; Returns: boolean }
      comm_manager: { Args: { p_org: string }; Returns: boolean }
      comm_member: { Args: { p_org: string }; Returns: boolean }
      deliver_farm_alert: {
        Args: {
          p_details: Json
          p_fingerprint: string
          p_key: string
          p_user_id: string
        }
        Returns: boolean
      }
      deliver_farm_report: {
        Args: {
          p_currency: string
          p_end: string
          p_notify: boolean
          p_snapshot: Json
          p_start: string
          p_user_id: string
          p_week: string
          p_zone: string
        }
        Returns: boolean
      }
      fi_access: { Args: { p_farm: string }; Returns: boolean }
      fi_create_farm_map: {
        Args: {
          p_fields: Json
          p_location: string
          p_name: string
          p_org: string
        }
        Returns: string
      }
      fi_field_access: { Args: { p_field: string }; Returns: boolean }
      fi_import_farm: {
        Args: {
          p_farm: string
          p_fields: Json
          p_location: string
          p_name: string
          p_org: string
        }
        Returns: string
      }
      fi_manage: { Args: { p_farm: string }; Returns: boolean }
      fi_report_access: { Args: { p_report: string }; Returns: boolean }
      fi_review: {
        Args: {
          p_assigned?: string
          p_body: string
          p_internal: boolean
          p_report: string
          p_status: string
        }
        Returns: undefined
      }
      harvest_photo_attached: { Args: { p_path: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_staff: { Args: { _user_id: string }; Returns: boolean }
      operational_harvests: { Args: never; Returns: Json }
      submit_operational_harvest: { Args: { p_record: Json }; Returns: string }
      workspace_management: { Args: never; Returns: boolean }
    }
    Enums: {
      app_role: "farmer" | "hq" | "ceo"
      harvest_status: "pending" | "approved" | "rejected"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["farmer", "hq", "ceo"],
      harvest_status: ["pending", "approved", "rejected"],
    },
  },
} as const
