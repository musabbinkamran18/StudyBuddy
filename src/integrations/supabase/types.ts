export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      ai_recommendations: {
        Row: {
          body: string | null;
          created_at: string;
          expires_at: string | null;
          id: string;
          payload: Json;
          priority: number;
          recommendation_type: string;
          status: Database["public"]["Enums"]["recommendation_status"];
          subject_id: string | null;
          title: string;
          topic_id: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          body?: string | null;
          created_at?: string;
          expires_at?: string | null;
          id?: string;
          payload?: Json;
          priority?: number;
          recommendation_type: string;
          status?: Database["public"]["Enums"]["recommendation_status"];
          subject_id?: string | null;
          title: string;
          topic_id?: string | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          body?: string | null;
          created_at?: string;
          expires_at?: string | null;
          id?: string;
          payload?: Json;
          priority?: number;
          recommendation_type?: string;
          status?: Database["public"]["Enums"]["recommendation_status"];
          subject_id?: string | null;
          title?: string;
          topic_id?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "ai_recommendations_subject_id_fkey";
            columns: ["subject_id"];
            isOneToOne: false;
            referencedRelation: "subjects";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ai_recommendations_topic_id_fkey";
            columns: ["topic_id"];
            isOneToOne: false;
            referencedRelation: "topics";
            referencedColumns: ["id"];
          },
        ];
      };
      badges: {
        Row: {
          code: string;
          created_at: string;
          criteria: Json;
          description: string | null;
          icon: string | null;
          id: string;
          is_active: boolean;
          name: string;
          tier: string;
          xp_reward: number;
        };
        Insert: {
          code: string;
          created_at?: string;
          criteria?: Json;
          description?: string | null;
          icon?: string | null;
          id?: string;
          is_active?: boolean;
          name: string;
          tier?: string;
          xp_reward?: number;
        };
        Update: {
          code?: string;
          created_at?: string;
          criteria?: Json;
          description?: string | null;
          icon?: string | null;
          id?: string;
          is_active?: boolean;
          name?: string;
          tier?: string;
          xp_reward?: number;
        };
        Relationships: [];
      };
      chat_messages: {
        Row: {
          attachments: Json;
          content: string;
          created_at: string;
          id: string;
          model: string | null;
          role: Database["public"]["Enums"]["chat_role"];
          session_id: string;
          tokens_used: number | null;
          user_id: string;
        };
        Insert: {
          attachments?: Json;
          content: string;
          created_at?: string;
          id?: string;
          model?: string | null;
          role: Database["public"]["Enums"]["chat_role"];
          session_id: string;
          tokens_used?: number | null;
          user_id: string;
        };
        Update: {
          attachments?: Json;
          content?: string;
          created_at?: string;
          id?: string;
          model?: string | null;
          role?: Database["public"]["Enums"]["chat_role"];
          session_id?: string;
          tokens_used?: number | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "chat_messages_session_id_fkey";
            columns: ["session_id"];
            isOneToOne: false;
            referencedRelation: "chat_sessions";
            referencedColumns: ["id"];
          },
        ];
      };
      chat_sessions: {
        Row: {
          created_at: string;
          id: string;
          is_archived: boolean;
          subject_id: string | null;
          title: string;
          topic_id: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          is_archived?: boolean;
          subject_id?: string | null;
          title?: string;
          topic_id?: string | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          is_archived?: boolean;
          subject_id?: string | null;
          title?: string;
          topic_id?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "chat_sessions_subject_id_fkey";
            columns: ["subject_id"];
            isOneToOne: false;
            referencedRelation: "subjects";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "chat_sessions_topic_id_fkey";
            columns: ["topic_id"];
            isOneToOne: false;
            referencedRelation: "topics";
            referencedColumns: ["id"];
          },
        ];
      };
      learning_metrics: {
        Row: {
          accuracy: number;
          avg_time_seconds: number;
          correct_attempts: number;
          created_at: string;
          current_difficulty: Database["public"]["Enums"]["difficulty_level"];
          id: string;
          last_practiced_at: string | null;
          mastery_score: number;
          streak_correct: number;
          subject_id: string | null;
          topic_id: string | null;
          total_attempts: number;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          accuracy?: number;
          avg_time_seconds?: number;
          correct_attempts?: number;
          created_at?: string;
          current_difficulty?: Database["public"]["Enums"]["difficulty_level"];
          id?: string;
          last_practiced_at?: string | null;
          mastery_score?: number;
          streak_correct?: number;
          subject_id?: string | null;
          topic_id?: string | null;
          total_attempts?: number;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          accuracy?: number;
          avg_time_seconds?: number;
          correct_attempts?: number;
          created_at?: string;
          current_difficulty?: Database["public"]["Enums"]["difficulty_level"];
          id?: string;
          last_practiced_at?: string | null;
          mastery_score?: number;
          streak_correct?: number;
          subject_id?: string | null;
          topic_id?: string | null;
          total_attempts?: number;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "learning_metrics_subject_id_fkey";
            columns: ["subject_id"];
            isOneToOne: false;
            referencedRelation: "subjects";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "learning_metrics_topic_id_fkey";
            columns: ["topic_id"];
            isOneToOne: false;
            referencedRelation: "topics";
            referencedColumns: ["id"];
          },
        ];
      };
      mistakes: {
        Row: {
          ai_analysis: string | null;
          attempt_id: string | null;
          created_at: string;
          id: string;
          is_resolved: boolean;
          mistake_type: string | null;
          next_review_at: string | null;
          question_id: string;
          reason: string | null;
          times_repeated: number;
          topic_id: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          ai_analysis?: string | null;
          attempt_id?: string | null;
          created_at?: string;
          id?: string;
          is_resolved?: boolean;
          mistake_type?: string | null;
          next_review_at?: string | null;
          question_id: string;
          reason?: string | null;
          times_repeated?: number;
          topic_id?: string | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          ai_analysis?: string | null;
          attempt_id?: string | null;
          created_at?: string;
          id?: string;
          is_resolved?: boolean;
          mistake_type?: string | null;
          next_review_at?: string | null;
          question_id?: string;
          reason?: string | null;
          times_repeated?: number;
          topic_id?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "mistakes_attempt_id_fkey";
            columns: ["attempt_id"];
            isOneToOne: false;
            referencedRelation: "practice_attempts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "mistakes_question_id_fkey";
            columns: ["question_id"];
            isOneToOne: false;
            referencedRelation: "questions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "mistakes_topic_id_fkey";
            columns: ["topic_id"];
            isOneToOne: false;
            referencedRelation: "topics";
            referencedColumns: ["id"];
          },
        ];
      };
      practice_attempts: {
        Row: {
          answer: Json;
          attempt_number: number;
          confidence: number | null;
          created_at: string;
          difficulty: Database["public"]["Enums"]["difficulty_level"];
          hints_used: number;
          id: string;
          is_correct: boolean;
          is_skipped: boolean;
          points_awarded: number;
          question_id: string;
          session_id: string | null;
          time_taken_seconds: number;
          topic_id: string | null;
          user_id: string;
        };
        Insert: {
          answer?: Json;
          attempt_number?: number;
          confidence?: number | null;
          created_at?: string;
          difficulty?: Database["public"]["Enums"]["difficulty_level"];
          hints_used?: number;
          id?: string;
          is_correct?: boolean;
          is_skipped?: boolean;
          points_awarded?: number;
          question_id: string;
          session_id?: string | null;
          time_taken_seconds?: number;
          topic_id?: string | null;
          user_id: string;
        };
        Update: {
          answer?: Json;
          attempt_number?: number;
          confidence?: number | null;
          created_at?: string;
          difficulty?: Database["public"]["Enums"]["difficulty_level"];
          hints_used?: number;
          id?: string;
          is_correct?: boolean;
          is_skipped?: boolean;
          points_awarded?: number;
          question_id?: string;
          session_id?: string | null;
          time_taken_seconds?: number;
          topic_id?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "practice_attempts_question_id_fkey";
            columns: ["question_id"];
            isOneToOne: false;
            referencedRelation: "questions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "practice_attempts_session_id_fkey";
            columns: ["session_id"];
            isOneToOne: false;
            referencedRelation: "practice_sessions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "practice_attempts_topic_id_fkey";
            columns: ["topic_id"];
            isOneToOne: false;
            referencedRelation: "topics";
            referencedColumns: ["id"];
          },
        ];
      };
      practice_sessions: {
        Row: {
          correct_count: number;
          created_at: string;
          difficulty: Database["public"]["Enums"]["difficulty_level"];
          duration_seconds: number;
          ended_at: string | null;
          id: string;
          mode: Database["public"]["Enums"]["practice_mode"];
          score: number;
          started_at: string;
          status: Database["public"]["Enums"]["session_status"];
          subject_id: string | null;
          topic_id: string | null;
          total_questions: number;
          updated_at: string;
          user_id: string;
          xp_earned: number;
        };
        Insert: {
          correct_count?: number;
          created_at?: string;
          difficulty?: Database["public"]["Enums"]["difficulty_level"];
          duration_seconds?: number;
          ended_at?: string | null;
          id?: string;
          mode?: Database["public"]["Enums"]["practice_mode"];
          score?: number;
          started_at?: string;
          status?: Database["public"]["Enums"]["session_status"];
          subject_id?: string | null;
          topic_id?: string | null;
          total_questions?: number;
          updated_at?: string;
          user_id: string;
          xp_earned?: number;
        };
        Update: {
          correct_count?: number;
          created_at?: string;
          difficulty?: Database["public"]["Enums"]["difficulty_level"];
          duration_seconds?: number;
          ended_at?: string | null;
          id?: string;
          mode?: Database["public"]["Enums"]["practice_mode"];
          score?: number;
          started_at?: string;
          status?: Database["public"]["Enums"]["session_status"];
          subject_id?: string | null;
          topic_id?: string | null;
          total_questions?: number;
          updated_at?: string;
          user_id?: string;
          xp_earned?: number;
        };
        Relationships: [
          {
            foreignKeyName: "practice_sessions_subject_id_fkey";
            columns: ["subject_id"];
            isOneToOne: false;
            referencedRelation: "subjects";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "practice_sessions_topic_id_fkey";
            columns: ["topic_id"];
            isOneToOne: false;
            referencedRelation: "topics";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          created_at: string;
          display_name: string | null;
          id: string;
          updated_at: string;
        };
        Insert: {
          avatar_url?: string | null;
          created_at?: string;
          display_name?: string | null;
          id: string;
          updated_at?: string;
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string;
          display_name?: string | null;
          id?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      questions: {
        Row: {
          body: Json;
          choices: Json;
          correct_answer: Json;
          created_at: string;
          created_by: string | null;
          difficulty: Database["public"]["Enums"]["difficulty_level"];
          explanation: string | null;
          hints: Json;
          id: string;
          is_active: boolean;
          points: number;
          prompt: string;
          question_type: Database["public"]["Enums"]["question_type"];
          source: string;
          subject_id: string;
          tags: string[];
          time_limit_seconds: number | null;
          topic_id: string;
          updated_at: string;
        };
        Insert: {
          body?: Json;
          choices?: Json;
          correct_answer?: Json;
          created_at?: string;
          created_by?: string | null;
          difficulty?: Database["public"]["Enums"]["difficulty_level"];
          explanation?: string | null;
          hints?: Json;
          id?: string;
          is_active?: boolean;
          points?: number;
          prompt: string;
          question_type: Database["public"]["Enums"]["question_type"];
          source?: string;
          subject_id: string;
          tags?: string[];
          time_limit_seconds?: number | null;
          topic_id: string;
          updated_at?: string;
        };
        Update: {
          body?: Json;
          choices?: Json;
          correct_answer?: Json;
          created_at?: string;
          created_by?: string | null;
          difficulty?: Database["public"]["Enums"]["difficulty_level"];
          explanation?: string | null;
          hints?: Json;
          id?: string;
          is_active?: boolean;
          points?: number;
          prompt?: string;
          question_type?: Database["public"]["Enums"]["question_type"];
          source?: string;
          subject_id?: string;
          tags?: string[];
          time_limit_seconds?: number | null;
          topic_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "questions_subject_id_fkey";
            columns: ["subject_id"];
            isOneToOne: false;
            referencedRelation: "subjects";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "questions_topic_id_fkey";
            columns: ["topic_id"];
            isOneToOne: false;
            referencedRelation: "topics";
            referencedColumns: ["id"];
          },
        ];
      };
      student_profiles: {
        Row: {
          age: number | null;
          created_at: string;
          curriculum: string | null;
          full_name: string;
          grade: string | null;
          id: string;
          onboarding_completed: boolean;
          preferred_language: string;
          seriousness: Database["public"]["Enums"]["seriousness_level"];
          study_goals: string | null;
          target_daily_minutes: number;
          timezone: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          age?: number | null;
          created_at?: string;
          curriculum?: string | null;
          full_name: string;
          grade?: string | null;
          id?: string;
          onboarding_completed?: boolean;
          preferred_language?: string;
          seriousness?: Database["public"]["Enums"]["seriousness_level"];
          study_goals?: string | null;
          target_daily_minutes?: number;
          timezone?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          age?: number | null;
          created_at?: string;
          curriculum?: string | null;
          full_name?: string;
          grade?: string | null;
          id?: string;
          onboarding_completed?: boolean;
          preferred_language?: string;
          seriousness?: Database["public"]["Enums"]["seriousness_level"];
          study_goals?: string | null;
          target_daily_minutes?: number;
          timezone?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      student_subjects: {
        Row: {
          created_at: string;
          current_level: Database["public"]["Enums"]["difficulty_level"];
          id: string;
          priority: number;
          subject_id: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          current_level?: Database["public"]["Enums"]["difficulty_level"];
          id?: string;
          priority?: number;
          subject_id: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          current_level?: Database["public"]["Enums"]["difficulty_level"];
          id?: string;
          priority?: number;
          subject_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "student_subjects_subject_id_fkey";
            columns: ["subject_id"];
            isOneToOne: false;
            referencedRelation: "subjects";
            referencedColumns: ["id"];
          },
        ];
      };
      subjects: {
        Row: {
          code: string;
          color: string | null;
          created_at: string;
          curriculum: string | null;
          description: string | null;
          icon: string | null;
          id: string;
          is_active: boolean;
          name: string;
          sort_order: number;
          updated_at: string;
        };
        Insert: {
          code: string;
          color?: string | null;
          created_at?: string;
          curriculum?: string | null;
          description?: string | null;
          icon?: string | null;
          id?: string;
          is_active?: boolean;
          name: string;
          sort_order?: number;
          updated_at?: string;
        };
        Update: {
          code?: string;
          color?: string | null;
          created_at?: string;
          curriculum?: string | null;
          description?: string | null;
          icon?: string | null;
          id?: string;
          is_active?: boolean;
          name?: string;
          sort_order?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      topics: {
        Row: {
          created_at: string;
          description: string | null;
          difficulty: Database["public"]["Enums"]["difficulty_level"];
          grade: string | null;
          id: string;
          is_active: boolean;
          name: string;
          parent_topic_id: string | null;
          slug: string | null;
          sort_order: number;
          subject_id: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          difficulty?: Database["public"]["Enums"]["difficulty_level"];
          grade?: string | null;
          id?: string;
          is_active?: boolean;
          name: string;
          parent_topic_id?: string | null;
          slug?: string | null;
          sort_order?: number;
          subject_id: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          difficulty?: Database["public"]["Enums"]["difficulty_level"];
          grade?: string | null;
          id?: string;
          is_active?: boolean;
          name?: string;
          parent_topic_id?: string | null;
          slug?: string | null;
          sort_order?: number;
          subject_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "topics_parent_topic_id_fkey";
            columns: ["parent_topic_id"];
            isOneToOne: false;
            referencedRelation: "topics";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "topics_subject_id_fkey";
            columns: ["subject_id"];
            isOneToOne: false;
            referencedRelation: "subjects";
            referencedColumns: ["id"];
          },
        ];
      };
      user_badges: {
        Row: {
          badge_id: string;
          earned_at: string;
          id: string;
          user_id: string;
        };
        Insert: {
          badge_id: string;
          earned_at?: string;
          id?: string;
          user_id: string;
        };
        Update: {
          badge_id?: string;
          earned_at?: string;
          id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_badges_badge_id_fkey";
            columns: ["badge_id"];
            isOneToOne: false;
            referencedRelation: "badges";
            referencedColumns: ["id"];
          },
        ];
      };
      user_progress: {
        Row: {
          created_at: string;
          current_streak: number;
          last_activity_date: string | null;
          level: number;
          longest_streak: number;
          total_correct: number;
          total_questions_answered: number;
          total_study_minutes: number;
          updated_at: string;
          user_id: string;
          xp: number;
        };
        Insert: {
          created_at?: string;
          current_streak?: number;
          last_activity_date?: string | null;
          level?: number;
          longest_streak?: number;
          total_correct?: number;
          total_questions_answered?: number;
          total_study_minutes?: number;
          updated_at?: string;
          user_id: string;
          xp?: number;
        };
        Update: {
          created_at?: string;
          current_streak?: number;
          last_activity_date?: string | null;
          level?: number;
          longest_streak?: number;
          total_correct?: number;
          total_questions_answered?: number;
          total_study_minutes?: number;
          updated_at?: string;
          user_id?: string;
          xp?: number;
        };
        Relationships: [];
      };
      user_roles: {
        Row: {
          created_at: string;
          id: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          role?: Database["public"]["Enums"]["app_role"];
          user_id?: string;
        };
        Relationships: [];
      };
      xp_events: {
        Row: {
          amount: number;
          created_at: string;
          id: string;
          reason: string;
          source_id: string | null;
          source_type: string | null;
          user_id: string;
        };
        Insert: {
          amount: number;
          created_at?: string;
          id?: string;
          reason: string;
          source_id?: string | null;
          source_type?: string | null;
          user_id: string;
        };
        Update: {
          amount?: number;
          created_at?: string;
          id?: string;
          reason?: string;
          source_id?: string | null;
          source_type?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      game_state: {
        Row: {
          user_id: string;
          coins: Json;
          rewards: Json;
          extended_stats: Json;
          achievements: Json;
          subject_progress: Json;
          mistakes: Json;
          study_log: Json;
          avatar: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          coins?: Json;
          rewards?: Json;
          extended_stats?: Json;
          achievements?: Json;
          subject_progress?: Json;
          mistakes?: Json;
          study_log?: Json;
          avatar?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          coins?: Json;
          rewards?: Json;
          extended_stats?: Json;
          achievements?: Json;
          subject_progress?: Json;
          mistakes?: Json;
          study_log?: Json;
          avatar?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"];
          _user_id: string;
        };
        Returns: boolean;
      };
    };
    Enums: {
      app_role: "admin" | "teacher" | "student";
      chat_role: "user" | "assistant" | "system";
      difficulty_level: "very_easy" | "easy" | "medium" | "hard" | "very_hard";
      practice_mode: "practice" | "quiz" | "timed" | "revision" | "mistake_review" | "adaptive";
      question_type:
        "mcq" | "fill_blank" | "true_false" | "match" | "find_mistake" | "scenario" | "timed";
      recommendation_status: "pending" | "accepted" | "dismissed" | "completed";
      seriousness_level: "casual" | "regular" | "serious" | "intense";
      session_status: "in_progress" | "completed" | "abandoned";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "teacher", "student"],
      chat_role: ["user", "assistant", "system"],
      difficulty_level: ["very_easy", "easy", "medium", "hard", "very_hard"],
      practice_mode: ["practice", "quiz", "timed", "revision", "mistake_review", "adaptive"],
      question_type: [
        "mcq",
        "fill_blank",
        "true_false",
        "match",
        "find_mistake",
        "scenario",
        "timed",
      ],
      recommendation_status: ["pending", "accepted", "dismissed", "completed"],
      seriousness_level: ["casual", "regular", "serious", "intense"],
      session_status: ["in_progress", "completed", "abandoned"],
    },
  },
} as const;
