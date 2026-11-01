/**
 * Database types for Supabase.
 *
 * Hand-authored for Milestone 1. Regenerate once you have a real project:
 *   npx supabase gen types typescript --project-id <id> --schema public > src/lib/supabase/types.ts
 * Mirrors supabase/migrations/0001_initial.sql.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type MemberRole = "owner" | "admin" | "editor" | "viewer";
export type WebsiteStatus = "draft" | "published" | "archived";
export type WebsiteSource = "native" | "github";
export type DeploymentStatus =
  | "queued"
  | "building"
  | "ready"
  | "error"
  | "canceled";
export type DeploymentTarget = "preview" | "production";
export type AiChangeStatus = "proposed" | "approved" | "rejected" | "applied";

type Timestamps = {
  created_at: string;
  updated_at: string;
};

type TimestampsInsert = {
  created_at?: string;
  updated_at?: string;
};

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Timestamps & {
          id: string;
          email: string;
          display_name: string | null;
          avatar_url: string | null;
          locale: string;
        };
        Insert: TimestampsInsert & {
          id: string;
          email: string;
          display_name?: string | null;
          avatar_url?: string | null;
          locale?: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
        Relationships: [];
      };
      organizations: {
        Row: Timestamps & {
          id: string;
          name: string;
          slug: string;
          owner_id: string;
        };
        Insert: TimestampsInsert & {
          id?: string;
          name: string;
          slug: string;
          owner_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["organizations"]["Insert"]>;
        Relationships: [];
      };
      organization_members: {
        Row: {
          organization_id: string;
          user_id: string;
          role: MemberRole;
          invited_by: string | null;
          joined_at: string;
        };
        Insert: {
          organization_id: string;
          user_id: string;
          role: MemberRole;
          invited_by?: string | null;
          joined_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["organization_members"]["Insert"]
        >;
        Relationships: [];
      };
      clients: {
        Row: Timestamps & {
          id: string;
          organization_id: string;
          name: string;
          contact_email: string | null;
          notes: string | null;
        };
        Insert: TimestampsInsert & {
          id?: string;
          organization_id: string;
          name: string;
          contact_email?: string | null;
          notes?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["clients"]["Insert"]>;
        Relationships: [];
      };
      websites: {
        Row: Timestamps & {
          id: string;
          organization_id: string;
          client_id: string | null;
          name: string;
          slug: string;
          source: WebsiteSource;
          status: WebsiteStatus;
          github_repo: string | null;
        };
        Insert: TimestampsInsert & {
          id?: string;
          organization_id: string;
          client_id?: string | null;
          name: string;
          slug: string;
          source?: WebsiteSource;
          status?: WebsiteStatus;
          github_repo?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["websites"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      member_role: MemberRole;
      website_status: WebsiteStatus;
      website_source: WebsiteSource;
      deployment_status: DeploymentStatus;
      deployment_target: DeploymentTarget;
      ai_change_status: AiChangeStatus;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
