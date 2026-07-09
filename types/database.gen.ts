// GERADO do projeto oficial wetvjyfrmnfxargsynnn (scienceplay-platform)
// via Supabase MCP generate_typescript_types em 2026-07-09.
// Para regenerar: npx supabase gen types typescript --project-id wetvjyfrmnfxargsynnn > types/database.gen.ts
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
      admin_audit_logs: {
        Row: {
          action: string
          admin_id: string | null
          after: Json | null
          before: Json | null
          created_at: string
          entity: string | null
          entity_id: string | null
          id: string
        }
        Insert: {
          action: string
          admin_id?: string | null
          after?: Json | null
          before?: Json | null
          created_at?: string
          entity?: string | null
          entity_id?: string | null
          id?: string
        }
        Update: {
          action?: string
          admin_id?: string | null
          after?: Json | null
          before?: Json | null
          created_at?: string
          entity?: string | null
          entity_id?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_audit_logs_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_logs: {
        Row: {
          cost_usd: number
          created_at: string
          error: string | null
          feature: string
          id: string
          input_tokens: number
          latency_ms: number
          model: string | null
          output_tokens: number
          provider: string | null
          status: string
          user_id: string | null
        }
        Insert: {
          cost_usd?: number
          created_at?: string
          error?: string | null
          feature: string
          id?: string
          input_tokens?: number
          latency_ms?: number
          model?: string | null
          output_tokens?: number
          provider?: string | null
          status?: string
          user_id?: string | null
        }
        Update: {
          cost_usd?: number
          created_at?: string
          error?: string | null
          feature?: string
          id?: string
          input_tokens?: number
          latency_ms?: number
          model?: string | null
          output_tokens?: number
          provider?: string | null
          status?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string
          id: string
          kind: string
          name: string
          parent_id: string | null
          slug: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          kind?: string
          name: string
          parent_id?: string | null
          slug: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          kind?: string
          name?: string
          parent_id?: string | null
          slug?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      collection_items: {
        Row: {
          collection_id: string
          created_at: string
          generation_id: string | null
          id: string
          news_id: string | null
        }
        Insert: {
          collection_id: string
          created_at?: string
          generation_id?: string | null
          id?: string
          news_id?: string | null
        }
        Update: {
          collection_id?: string
          created_at?: string
          generation_id?: string | null
          id?: string
          news_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "collection_items_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "collections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collection_items_generation_id_fkey"
            columns: ["generation_id"]
            isOneToOne: false
            referencedRelation: "content_generations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collection_items_news_id_fkey"
            columns: ["news_id"]
            isOneToOne: false
            referencedRelation: "news_reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      collections: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "collections_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      content_generations: {
        Row: {
          branded: boolean
          created_at: string
          format: string
          id: string
          locale: string
          news_id: string | null
          payload: Json
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          branded?: boolean
          created_at?: string
          format: string
          id?: string
          locale?: string
          news_id?: string | null
          payload?: Json
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          branded?: boolean
          created_at?: string
          format?: string
          id?: string
          locale?: string
          news_id?: string | null
          payload?: Json
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_generations_news_id_fkey"
            columns: ["news_id"]
            isOneToOne: false
            referencedRelation: "news_reviews"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_generations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      cron_logs: {
        Row: {
          created_at: string
          detail: Json
          finished_at: string | null
          id: string
          job: string
          started_at: string | null
          status: string
        }
        Insert: {
          created_at?: string
          detail?: Json
          finished_at?: string | null
          id?: string
          job: string
          started_at?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          detail?: Json
          finished_at?: string | null
          id?: string
          job?: string
          started_at?: string | null
          status?: string
        }
        Relationships: []
      }
      legacy_posts: {
        Row: {
          author: string | null
          body: string | null
          category: string | null
          created_at: string
          description: string | null
          id: string
          indexable: boolean
          original_url: string
          published_at_original: string | null
          reading_time: number | null
          redirect_to: string | null
          slug: string
          thumb: string | null
          thumb_alt: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          author?: string | null
          body?: string | null
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          indexable?: boolean
          original_url: string
          published_at_original?: string | null
          reading_time?: number | null
          redirect_to?: string | null
          slug: string
          thumb?: string | null
          thumb_alt?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          author?: string | null
          body?: string | null
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          indexable?: boolean
          original_url?: string
          published_at_original?: string | null
          reading_time?: number | null
          redirect_to?: string | null
          slug?: string
          thumb?: string | null
          thumb_alt?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      news_i18n: {
        Row: {
          body: Json
          bottom_line: string | null
          created_at: string
          id: string
          locale: string
          news_id: string
          seo_description: string | null
          seo_title: string | null
          slug: string
          title: string
          updated_at: string | null
        }
        Insert: {
          body?: Json
          bottom_line?: string | null
          created_at?: string
          id?: string
          locale: string
          news_id: string
          seo_description?: string | null
          seo_title?: string | null
          slug: string
          title: string
          updated_at?: string | null
        }
        Update: {
          body?: Json
          bottom_line?: string | null
          created_at?: string
          id?: string
          locale?: string
          news_id?: string
          seo_description?: string | null
          seo_title?: string | null
          slug?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "news_i18n_news_id_fkey"
            columns: ["news_id"]
            isOneToOne: false
            referencedRelation: "news_reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      news_reviews: {
        Row: {
          approved_by: string | null
          area: string | null
          auto_published: boolean
          bottom_line: string | null
          category_id: string | null
          clinical_application: string | null
          content_type: Database["public"]["Enums"]["content_type"]
          created_at: string
          created_by: string | null
          do_not_claim: string | null
          duplicate_of: string | null
          duplicate_reason: string | null
          duplicate_score: number | null
          evidence_grade: string | null
          evidence_grade_rationale: string | null
          id: string
          limitations: string | null
          main_result: string | null
          method: string | null
          origin_type: Database["public"]["Enums"]["origin_type"]
          population: string | null
          published_at: string | null
          reference_text: string | null
          sample: string | null
          source_id: string | null
          specialty_id: string | null
          status: Database["public"]["Enums"]["editorial_status"]
          study_type: string | null
          updated_at: string | null
        }
        Insert: {
          approved_by?: string | null
          area?: string | null
          auto_published?: boolean
          bottom_line?: string | null
          category_id?: string | null
          clinical_application?: string | null
          content_type?: Database["public"]["Enums"]["content_type"]
          created_at?: string
          created_by?: string | null
          do_not_claim?: string | null
          duplicate_of?: string | null
          duplicate_reason?: string | null
          duplicate_score?: number | null
          evidence_grade?: string | null
          evidence_grade_rationale?: string | null
          id?: string
          limitations?: string | null
          main_result?: string | null
          method?: string | null
          origin_type?: Database["public"]["Enums"]["origin_type"]
          population?: string | null
          published_at?: string | null
          reference_text?: string | null
          sample?: string | null
          source_id?: string | null
          specialty_id?: string | null
          status?: Database["public"]["Enums"]["editorial_status"]
          study_type?: string | null
          updated_at?: string | null
        }
        Update: {
          approved_by?: string | null
          area?: string | null
          auto_published?: boolean
          bottom_line?: string | null
          category_id?: string | null
          clinical_application?: string | null
          content_type?: Database["public"]["Enums"]["content_type"]
          created_at?: string
          created_by?: string | null
          do_not_claim?: string | null
          duplicate_of?: string | null
          duplicate_reason?: string | null
          duplicate_score?: number | null
          evidence_grade?: string | null
          evidence_grade_rationale?: string | null
          id?: string
          limitations?: string | null
          main_result?: string | null
          method?: string | null
          origin_type?: Database["public"]["Enums"]["origin_type"]
          population?: string | null
          published_at?: string | null
          reference_text?: string | null
          sample?: string | null
          source_id?: string | null
          specialty_id?: string | null
          status?: Database["public"]["Enums"]["editorial_status"]
          study_type?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "news_reviews_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "news_reviews_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "news_reviews_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "news_reviews_duplicate_of_fkey"
            columns: ["duplicate_of"]
            isOneToOne: false
            referencedRelation: "news_reviews"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "news_reviews_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "sources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "news_reviews_specialty_id_fkey"
            columns: ["specialty_id"]
            isOneToOne: false
            referencedRelation: "specialties"
            referencedColumns: ["id"]
          },
        ]
      }
      news_tags: {
        Row: {
          news_id: string
          tag_id: string
        }
        Insert: {
          news_id: string
          tag_id: string
        }
        Update: {
          news_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "news_tags_news_id_fkey"
            columns: ["news_id"]
            isOneToOne: false
            referencedRelation: "news_reviews"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "news_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      newsletter_campaigns: {
        Row: {
          created_at: string
          id: string
          name: string
          schedule: string | null
          segment: Json
          stats: Json
          status: string
          template: string | null
          updated_at: string | null
          variables: Json
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          schedule?: string | null
          segment?: Json
          stats?: Json
          status?: string
          template?: string | null
          updated_at?: string | null
          variables?: Json
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          schedule?: string | null
          segment?: Json
          stats?: Json
          status?: string
          template?: string | null
          updated_at?: string | null
          variables?: Json
        }
        Relationships: []
      }
      plans: {
        Row: {
          created_at: string
          id: string
          key: string
          limits: Json
          name: string
          period: string
          price_cents: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          limits?: Json
          name: string
          period?: string
          price_cents?: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          limits?: Json
          name?: string
          period?: string
          price_cents?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      practice_translations: {
        Row: {
          context: string
          created_at: string
          id: string
          locale: string
          news_id: string
          payload: Json
          profession_id: string | null
          updated_at: string | null
        }
        Insert: {
          context: string
          created_at?: string
          id?: string
          locale?: string
          news_id: string
          payload?: Json
          profession_id?: string | null
          updated_at?: string | null
        }
        Update: {
          context?: string
          created_at?: string
          id?: string
          locale?: string
          news_id?: string
          payload?: Json
          profession_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "practice_translations_news_id_fkey"
            columns: ["news_id"]
            isOneToOne: false
            referencedRelation: "news_reviews"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "practice_translations_profession_id_fkey"
            columns: ["profession_id"]
            isOneToOne: false
            referencedRelation: "professions"
            referencedColumns: ["id"]
          },
        ]
      }
      professions: {
        Row: {
          created_at: string
          id: string
          labels: Json
          name: string
          slug: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          labels?: Json
          name: string
          slug: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          labels?: Json
          name?: string
          slug?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      rdstation_events: {
        Row: {
          attempts: number
          created_at: string
          event: string
          id: string
          payload: Json
          status: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          attempts?: number
          created_at?: string
          event: string
          id?: string
          payload?: Json
          status?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          attempts?: number
          created_at?: string
          event?: string
          id?: string
          payload?: Json
          status?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rdstation_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_news: {
        Row: {
          created_at: string
          id: string
          news_id: string
          relationship: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          news_id: string
          relationship?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          news_id?: string
          relationship?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_news_news_id_fkey"
            columns: ["news_id"]
            isOneToOne: false
            referencedRelation: "news_reviews"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_news_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      sources: {
        Row: {
          abstract_hash: string | null
          canonical_url: string | null
          content_hash: string | null
          content_key: string
          created_at: string
          doi: string | null
          id: string
          kind: Database["public"]["Enums"]["source_kind"]
          metadata: Json
          pdf_storage_path: string | null
          pmid: string | null
          title_normalized: string | null
          title_original: string | null
          updated_at: string | null
        }
        Insert: {
          abstract_hash?: string | null
          canonical_url?: string | null
          content_hash?: string | null
          content_key: string
          created_at?: string
          doi?: string | null
          id?: string
          kind: Database["public"]["Enums"]["source_kind"]
          metadata?: Json
          pdf_storage_path?: string | null
          pmid?: string | null
          title_normalized?: string | null
          title_original?: string | null
          updated_at?: string | null
        }
        Update: {
          abstract_hash?: string | null
          canonical_url?: string | null
          content_hash?: string | null
          content_key?: string
          created_at?: string
          doi?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["source_kind"]
          metadata?: Json
          pdf_storage_path?: string | null
          pmid?: string | null
          title_normalized?: string | null
          title_original?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      specialties: {
        Row: {
          created_at: string
          id: string
          labels: Json
          name: string
          slug: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          labels?: Json
          name: string
          slug: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          labels?: Json
          name?: string
          slug?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      tags: {
        Row: {
          created_at: string
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      usage_events: {
        Row: {
          created_at: string
          entity_id: string | null
          event: string
          id: string
          ip_hash: string | null
          meta: Json
          user_id: string | null
        }
        Insert: {
          created_at?: string
          entity_id?: string | null
          event: string
          id?: string
          ip_hash?: string | null
          meta?: Json
          user_id?: string | null
        }
        Update: {
          created_at?: string
          entity_id?: string | null
          event?: string
          id?: string
          ip_hash?: string | null
          meta?: Json
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "usage_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          auth_id: string
          created_at: string
          email: string
          first_name: string | null
          id: string
          last_name: string | null
          locale: string
          optin_email: boolean
          optin_whatsapp: boolean
          plan_id: string | null
          privacy_accepted_at: string | null
          profession_id: string | null
          role: Database["public"]["Enums"]["user_role"]
          specialty_id: string | null
          terms_accepted_at: string | null
          terms_version: string | null
          updated_at: string | null
          whatsapp: string | null
        }
        Insert: {
          auth_id: string
          created_at?: string
          email: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          locale?: string
          optin_email?: boolean
          optin_whatsapp?: boolean
          plan_id?: string | null
          privacy_accepted_at?: string | null
          profession_id?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          specialty_id?: string | null
          terms_accepted_at?: string | null
          terms_version?: string | null
          updated_at?: string | null
          whatsapp?: string | null
        }
        Update: {
          auth_id?: string
          created_at?: string
          email?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          locale?: string
          optin_email?: boolean
          optin_whatsapp?: boolean
          plan_id?: string | null
          privacy_accepted_at?: string | null
          profession_id?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          specialty_id?: string | null
          terms_accepted_at?: string | null
          terms_version?: string | null
          updated_at?: string | null
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "users_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "users_profession_id_fkey"
            columns: ["profession_id"]
            isOneToOne: false
            referencedRelation: "professions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "users_specialty_id_fkey"
            columns: ["specialty_id"]
            isOneToOne: false
            referencedRelation: "specialties"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_events: {
        Row: {
          created_at: string
          external_id: string | null
          id: string
          payload: Json
          processed_at: string | null
          provider: string
          signature_valid: boolean
          status: string
        }
        Insert: {
          created_at?: string
          external_id?: string | null
          id?: string
          payload?: Json
          processed_at?: string | null
          provider: string
          signature_valid?: boolean
          status?: string
        }
        Update: {
          created_at?: string
          external_id?: string | null
          id?: string
          payload?: Json
          processed_at?: string | null
          provider?: string
          signature_valid?: boolean
          status?: string
        }
        Relationships: []
      }
      whatsapp_templates: {
        Row: {
          approved: boolean
          body: string
          created_at: string
          id: string
          name: string
          status: string
          updated_at: string | null
          variables: Json
        }
        Insert: {
          approved?: boolean
          body: string
          created_at?: string
          id?: string
          name: string
          status?: string
          updated_at?: string | null
          variables?: Json
        }
        Update: {
          approved?: boolean
          body?: string
          created_at?: string
          id?: string
          name?: string
          status?: string
          updated_at?: string | null
          variables?: Json
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      current_app_user: { Args: never; Returns: string }
      is_admin: { Args: never; Returns: boolean }
      is_editor_or_admin: { Args: never; Returns: boolean }
      match_source_title: {
        Args: { q: string; threshold: number }
        Returns: {
          id: string
          sim: number
        }[]
      }
    }
    Enums: {
      content_type:
        | "scientific_article"
        | "article_summary"
        | "science_news"
        | "clinical_analysis"
        | "guideline_update"
        | "evidence_update"
        | "editorial_note"
        | "manual_content"
        | "user_submitted_article"
      editorial_status:
        | "draft"
        | "generated"
        | "needs_review"
        | "possible_duplicate"
        | "approved"
        | "published"
        | "archived"
        | "rejected"
        | "blocked_duplicate"
        | "merged"
        | "updated_existing"
      origin_type:
        | "user_upload"
        | "team_automated"
        | "team_manual"
        | "external_source"
        | "legacy_import"
        | "admin_created"
        | "system_generated"
      source_kind: "doi" | "pmid" | "crossref" | "url" | "pdf" | "text"
      user_role: "user" | "editor" | "admin"
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
      content_type: [
        "scientific_article",
        "article_summary",
        "science_news",
        "clinical_analysis",
        "guideline_update",
        "evidence_update",
        "editorial_note",
        "manual_content",
        "user_submitted_article",
      ],
      editorial_status: [
        "draft",
        "generated",
        "needs_review",
        "possible_duplicate",
        "approved",
        "published",
        "archived",
        "rejected",
        "blocked_duplicate",
        "merged",
        "updated_existing",
      ],
      origin_type: [
        "user_upload",
        "team_automated",
        "team_manual",
        "external_source",
        "legacy_import",
        "admin_created",
        "system_generated",
      ],
      source_kind: ["doi", "pmid", "crossref", "url", "pdf", "text"],
      user_role: ["user", "editor", "admin"],
    },
  },
} as const
