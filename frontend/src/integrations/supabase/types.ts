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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      admin_audit_log: {
        Row: {
          action: string
          admin_user_id: string
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          metadata: Json | null
          new_value: Json | null
          old_value: Json | null
        }
        Insert: {
          action: string
          admin_user_id: string
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          metadata?: Json | null
          new_value?: Json | null
          old_value?: Json | null
        }
        Update: {
          action?: string
          admin_user_id?: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          metadata?: Json | null
          new_value?: Json | null
          old_value?: Json | null
        }
        Relationships: []
      }
      awards: {
        Row: {
          bucket: Database["public"]["Enums"]["award_bucket"]
          cancelled_at: string | null
          created_at: string
          fulfilled_at: string | null
          id: string
          product_class_id: string
          reserved_cost_usd: number
          reveal_id: string | null
          status: Database["public"]["Enums"]["award_status"]
          user_id: string
        }
        Insert: {
          bucket: Database["public"]["Enums"]["award_bucket"]
          cancelled_at?: string | null
          created_at?: string
          fulfilled_at?: string | null
          id?: string
          product_class_id: string
          reserved_cost_usd: number
          reveal_id?: string | null
          status?: Database["public"]["Enums"]["award_status"]
          user_id: string
        }
        Update: {
          bucket?: Database["public"]["Enums"]["award_bucket"]
          cancelled_at?: string | null
          created_at?: string
          fulfilled_at?: string | null
          id?: string
          product_class_id?: string
          reserved_cost_usd?: number
          reveal_id?: string | null
          status?: Database["public"]["Enums"]["award_status"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "awards_product_class_id_fkey"
            columns: ["product_class_id"]
            isOneToOne: false
            referencedRelation: "product_classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "awards_reveal_id_fkey"
            columns: ["reveal_id"]
            isOneToOne: false
            referencedRelation: "reveals"
            referencedColumns: ["id"]
          },
        ]
      }
      battle_queue: {
        Row: {
          battle_set_id: string
          expires_at: string
          id: string
          queued_at: string
          rating: number
          user_id: string
        }
        Insert: {
          battle_set_id: string
          expires_at?: string
          id?: string
          queued_at?: string
          rating?: number
          user_id: string
        }
        Update: {
          battle_set_id?: string
          expires_at?: string
          id?: string
          queued_at?: string
          rating?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "battle_queue_battle_set_id_fkey"
            columns: ["battle_set_id"]
            isOneToOne: false
            referencedRelation: "battle_sets"
            referencedColumns: ["id"]
          },
        ]
      }
      battle_rounds: {
        Row: {
          a_submitted_at: string | null
          agent_card: Json | null
          b_submitted_at: string | null
          battle_id: string
          category: string
          completed_at: string | null
          created_at: string
          id: string
          reveal_a_id: string | null
          reveal_b_id: string | null
          round_index: number
          score_a: number | null
          score_b: number | null
          winner: Database["public"]["Enums"]["round_winner"] | null
        }
        Insert: {
          a_submitted_at?: string | null
          agent_card?: Json | null
          b_submitted_at?: string | null
          battle_id: string
          category: string
          completed_at?: string | null
          created_at?: string
          id?: string
          reveal_a_id?: string | null
          reveal_b_id?: string | null
          round_index: number
          score_a?: number | null
          score_b?: number | null
          winner?: Database["public"]["Enums"]["round_winner"] | null
        }
        Update: {
          a_submitted_at?: string | null
          agent_card?: Json | null
          b_submitted_at?: string | null
          battle_id?: string
          category?: string
          completed_at?: string | null
          created_at?: string
          id?: string
          reveal_a_id?: string | null
          reveal_b_id?: string | null
          round_index?: number
          score_a?: number | null
          score_b?: number | null
          winner?: Database["public"]["Enums"]["round_winner"] | null
        }
        Relationships: [
          {
            foreignKeyName: "battle_rounds_battle_id_fkey"
            columns: ["battle_id"]
            isOneToOne: false
            referencedRelation: "battles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "battle_rounds_reveal_a_id_fkey"
            columns: ["reveal_a_id"]
            isOneToOne: false
            referencedRelation: "reveals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "battle_rounds_reveal_b_id_fkey"
            columns: ["reveal_b_id"]
            isOneToOne: false
            referencedRelation: "reveals"
            referencedColumns: ["id"]
          },
        ]
      }
      battle_sets: {
        Row: {
          created_at: string
          id: string
          reveal_ids: string[]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          reveal_ids: string[]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          reveal_ids?: string[]
          user_id?: string
        }
        Relationships: []
      }
      battles: {
        Row: {
          agent_deck: Json | null
          agent_seed: string | null
          agent_tier: Database["public"]["Enums"]["agent_tier"] | null
          battle_set_a: string
          battle_set_b: string | null
          completed_at: string | null
          created_at: string
          expires_at: string | null
          id: string
          is_ranked: boolean
          opponent_type: Database["public"]["Enums"]["opponent_type"]
          reward_multiplier: number
          round_categories: string[]
          score_a: number
          score_b: number
          started_at: string | null
          status: Database["public"]["Enums"]["battle_status"]
          user_a: string
          user_b: string | null
          winner_user_id: string | null
        }
        Insert: {
          agent_deck?: Json | null
          agent_seed?: string | null
          agent_tier?: Database["public"]["Enums"]["agent_tier"] | null
          battle_set_a: string
          battle_set_b?: string | null
          completed_at?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          is_ranked?: boolean
          opponent_type?: Database["public"]["Enums"]["opponent_type"]
          reward_multiplier?: number
          round_categories?: string[]
          score_a?: number
          score_b?: number
          started_at?: string | null
          status?: Database["public"]["Enums"]["battle_status"]
          user_a: string
          user_b?: string | null
          winner_user_id?: string | null
        }
        Update: {
          agent_deck?: Json | null
          agent_seed?: string | null
          agent_tier?: Database["public"]["Enums"]["agent_tier"] | null
          battle_set_a?: string
          battle_set_b?: string | null
          completed_at?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          is_ranked?: boolean
          opponent_type?: Database["public"]["Enums"]["opponent_type"]
          reward_multiplier?: number
          round_categories?: string[]
          score_a?: number
          score_b?: number
          started_at?: string | null
          status?: Database["public"]["Enums"]["battle_status"]
          user_a?: string
          user_b?: string | null
          winner_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "battles_battle_set_a_fkey"
            columns: ["battle_set_a"]
            isOneToOne: false
            referencedRelation: "battle_sets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "battles_battle_set_b_fkey"
            columns: ["battle_set_b"]
            isOneToOne: false
            referencedRelation: "battle_sets"
            referencedColumns: ["id"]
          },
        ]
      }
      bucket_balances: {
        Row: {
          balance_usd: number
          bucket: Database["public"]["Enums"]["award_bucket"]
          updated_at: string
        }
        Insert: {
          balance_usd?: number
          bucket: Database["public"]["Enums"]["award_bucket"]
          updated_at?: string
        }
        Update: {
          balance_usd?: number
          bucket?: Database["public"]["Enums"]["award_bucket"]
          updated_at?: string
        }
        Relationships: []
      }
      card_transfers: {
        Row: {
          claim_token: string
          claimed_at: string | null
          created_at: string
          expires_at: string
          from_user_id: string
          id: string
          reveal_id: string
          status: string
          to_user_id: string | null
          transfer_type: string
        }
        Insert: {
          claim_token: string
          claimed_at?: string | null
          created_at?: string
          expires_at?: string
          from_user_id: string
          id?: string
          reveal_id: string
          status?: string
          to_user_id?: string | null
          transfer_type: string
        }
        Update: {
          claim_token?: string
          claimed_at?: string | null
          created_at?: string
          expires_at?: string
          from_user_id?: string
          id?: string
          reveal_id?: string
          status?: string
          to_user_id?: string | null
          transfer_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "card_transfers_reveal_id_fkey"
            columns: ["reveal_id"]
            isOneToOne: false
            referencedRelation: "reveals"
            referencedColumns: ["id"]
          },
        ]
      }
      category_pool_balances: {
        Row: {
          balance_usd: number
          category: Database["public"]["Enums"]["product_category"]
          updated_at: string
        }
        Insert: {
          balance_usd?: number
          category: Database["public"]["Enums"]["product_category"]
          updated_at?: string
        }
        Update: {
          balance_usd?: number
          category?: Database["public"]["Enums"]["product_category"]
          updated_at?: string
        }
        Relationships: []
      }
      category_pool_ledger: {
        Row: {
          amount_usd: number
          category: Database["public"]["Enums"]["product_category"]
          created_at: string
          event_type: Database["public"]["Enums"]["pool_event"]
          id: string
          ref_id: string
          ref_type: string
        }
        Insert: {
          amount_usd: number
          category: Database["public"]["Enums"]["product_category"]
          created_at?: string
          event_type: Database["public"]["Enums"]["pool_event"]
          id?: string
          ref_id: string
          ref_type: string
        }
        Update: {
          amount_usd?: number
          category?: Database["public"]["Enums"]["product_category"]
          created_at?: string
          event_type?: Database["public"]["Enums"]["pool_event"]
          id?: string
          ref_id?: string
          ref_type?: string
        }
        Relationships: []
      }
      category_pricing: {
        Row: {
          category: Database["public"]["Enums"]["product_category"]
          created_at: string
          description: string | null
          display_name: string
          id: string
          is_active: boolean
          price_cents: number
          tier: Database["public"]["Enums"]["pricing_tier"]
          updated_at: string
        }
        Insert: {
          category: Database["public"]["Enums"]["product_category"]
          created_at?: string
          description?: string | null
          display_name: string
          id?: string
          is_active?: boolean
          price_cents: number
          tier: Database["public"]["Enums"]["pricing_tier"]
          updated_at?: string
        }
        Update: {
          category?: Database["public"]["Enums"]["product_category"]
          created_at?: string
          description?: string | null
          display_name?: string
          id?: string
          is_active?: boolean
          price_cents?: number
          tier?: Database["public"]["Enums"]["pricing_tier"]
          updated_at?: string
        }
        Relationships: []
      }
      collector_connections: {
        Row: {
          created_at: string | null
          follower_id: string
          following_id: string
          id: string
          status: string | null
        }
        Insert: {
          created_at?: string | null
          follower_id: string
          following_id: string
          id?: string
          status?: string | null
        }
        Update: {
          created_at?: string | null
          follower_id?: string
          following_id?: string
          id?: string
          status?: string | null
        }
        Relationships: []
      }
      collector_profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          display_name: string | null
          is_public: boolean | null
          status: string
          updated_at: string | null
          user_id: string
          username: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          display_name?: string | null
          is_public?: boolean | null
          status?: string
          updated_at?: string | null
          user_id: string
          username: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          display_name?: string | null
          is_public?: boolean | null
          status?: string
          updated_at?: string | null
          user_id?: string
          username?: string
        }
        Relationships: []
      }
      daily_free_pulls: {
        Row: {
          created_at: string
          id: string
          pull_date: string
          reveal_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          pull_date: string
          reveal_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          pull_date?: string
          reveal_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_free_pulls_reveal_id_fkey"
            columns: ["reveal_id"]
            isOneToOne: false
            referencedRelation: "reveals"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_trivia_credits: {
        Row: {
          created_at: string
          credits_earned: number
          earn_date: string
          id: string
          questions_answered: number
          user_id: string
        }
        Insert: {
          created_at?: string
          credits_earned?: number
          earn_date?: string
          id?: string
          questions_answered?: number
          user_id: string
        }
        Update: {
          created_at?: string
          credits_earned?: number
          earn_date?: string
          id?: string
          questions_answered?: number
          user_id?: string
        }
        Relationships: []
      }
      economy_configs: {
        Row: {
          activated_at: string | null
          config: Json
          created_at: string
          id: string
          is_active: boolean
          version: string
        }
        Insert: {
          activated_at?: string | null
          config: Json
          created_at?: string
          id?: string
          is_active?: boolean
          version: string
        }
        Update: {
          activated_at?: string | null
          config?: Json
          created_at?: string
          id?: string
          is_active?: boolean
          version?: string
        }
        Relationships: []
      }
      escrow_ledger: {
        Row: {
          created_at: string
          delta_cents: number
          id: string
          reason: string
          ref_id: string | null
          room_id: string | null
          scope: string
          tier: string | null
        }
        Insert: {
          created_at?: string
          delta_cents: number
          id?: string
          reason: string
          ref_id?: string | null
          room_id?: string | null
          scope: string
          tier?: string | null
        }
        Update: {
          created_at?: string
          delta_cents?: number
          id?: string
          reason?: string
          ref_id?: string | null
          room_id?: string | null
          scope?: string
          tier?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "escrow_ledger_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_items: {
        Row: {
          cost_usd: number | null
          created_at: string
          id: string
          notes: string | null
          product_class_id: string
          reserved_for_award_id: string | null
          sku: string | null
          status: Database["public"]["Enums"]["inventory_status"]
          supplier_id: string | null
          updated_at: string
        }
        Insert: {
          cost_usd?: number | null
          created_at?: string
          id?: string
          notes?: string | null
          product_class_id: string
          reserved_for_award_id?: string | null
          sku?: string | null
          status?: Database["public"]["Enums"]["inventory_status"]
          supplier_id?: string | null
          updated_at?: string
        }
        Update: {
          cost_usd?: number | null
          created_at?: string
          id?: string
          notes?: string | null
          product_class_id?: string
          reserved_for_award_id?: string | null
          sku?: string | null
          status?: Database["public"]["Enums"]["inventory_status"]
          supplier_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_items_product_class_id_fkey"
            columns: ["product_class_id"]
            isOneToOne: false
            referencedRelation: "product_classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_items_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      kyc_documents: {
        Row: {
          document_type: string
          expires_at: string | null
          file_name: string
          file_url: string
          id: string
          rejection_reason: string | null
          reviewed_at: string | null
          status: string
          submitted_at: string
          user_id: string
        }
        Insert: {
          document_type: string
          expires_at?: string | null
          file_name: string
          file_url: string
          id?: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          status?: string
          submitted_at?: string
          user_id: string
        }
        Update: {
          document_type?: string
          expires_at?: string | null
          file_name?: string
          file_url?: string
          id?: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          status?: string
          submitted_at?: string
          user_id?: string
        }
        Relationships: []
      }
      leaderboard_stats: {
        Row: {
          id: string
          last_battle_at: string | null
          losses: number
          rating: number
          season_id: string
          streak_best: number
          streak_current: number
          updated_at: string
          user_id: string
          wins: number
          wins_by_category: Json
        }
        Insert: {
          id?: string
          last_battle_at?: string | null
          losses?: number
          rating?: number
          season_id?: string
          streak_best?: number
          streak_current?: number
          updated_at?: string
          user_id: string
          wins?: number
          wins_by_category?: Json
        }
        Update: {
          id?: string
          last_battle_at?: string | null
          losses?: number
          rating?: number
          season_id?: string
          streak_best?: number
          streak_current?: number
          updated_at?: string
          user_id?: string
          wins?: number
          wins_by_category?: Json
        }
        Relationships: []
      }
      lot_trivia_questions: {
        Row: {
          answered_at: string
          credits_earned: number
          id: string
          is_correct: boolean
          question_id: string
          room_id: string
          user_id: string
        }
        Insert: {
          answered_at?: string
          credits_earned?: number
          id?: string
          is_correct: boolean
          question_id: string
          room_id: string
          user_id: string
        }
        Update: {
          answered_at?: string
          credits_earned?: number
          id?: string
          is_correct?: boolean
          question_id?: string
          room_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lot_trivia_questions_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "product_questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lot_trivia_questions_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      lottery_draws: {
        Row: {
          client_seed: string | null
          drawn_at: string
          id: string
          nonce: number | null
          random_seed: string | null
          room_id: string
          seed_commitment: string | null
          server_seed: string | null
          total_tickets: number
          verification_hash: string | null
          winner_entry_id: string | null
          winner_user_id: string | null
          winning_ticket_number: number
        }
        Insert: {
          client_seed?: string | null
          drawn_at?: string
          id?: string
          nonce?: number | null
          random_seed?: string | null
          room_id: string
          seed_commitment?: string | null
          server_seed?: string | null
          total_tickets: number
          verification_hash?: string | null
          winner_entry_id?: string | null
          winner_user_id?: string | null
          winning_ticket_number: number
        }
        Update: {
          client_seed?: string | null
          drawn_at?: string
          id?: string
          nonce?: number | null
          random_seed?: string | null
          room_id?: string
          seed_commitment?: string | null
          server_seed?: string | null
          total_tickets?: number
          verification_hash?: string | null
          winner_entry_id?: string | null
          winner_user_id?: string | null
          winning_ticket_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "lottery_draws_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lottery_draws_winner_entry_id_fkey"
            columns: ["winner_entry_id"]
            isOneToOne: false
            referencedRelation: "room_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      moderation_logs: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          id: string
          performed_by: string
          reason: string | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          id?: string
          performed_by: string
          reason?: string | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          id?: string
          performed_by?: string
          reason?: string | null
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          data: Json | null
          id: string
          message: string
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data?: Json | null
          id?: string
          message: string
          read?: boolean
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          data?: Json | null
          id?: string
          message?: string
          read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      pool_ledger: {
        Row: {
          amount_usd: number
          bucket: Database["public"]["Enums"]["award_bucket"]
          created_at: string
          event_type: Database["public"]["Enums"]["pool_event"]
          id: string
          ref_id: string
          ref_type: string
        }
        Insert: {
          amount_usd: number
          bucket: Database["public"]["Enums"]["award_bucket"]
          created_at?: string
          event_type: Database["public"]["Enums"]["pool_event"]
          id?: string
          ref_id: string
          ref_type: string
        }
        Update: {
          amount_usd?: number
          bucket?: Database["public"]["Enums"]["award_bucket"]
          created_at?: string
          event_type?: Database["public"]["Enums"]["pool_event"]
          id?: string
          ref_id?: string
          ref_type?: string
        }
        Relationships: []
      }
      product_classes: {
        Row: {
          band: Database["public"]["Enums"]["rarity_band"]
          brand: string
          bucket: Database["public"]["Enums"]["award_bucket"]
          category: Database["public"]["Enums"]["product_category"]
          created_at: string
          description: string | null
          expected_fulfillment_cost_usd: number
          id: string
          image_url: string | null
          inventory_required_status: Database["public"]["Enums"]["inventory_status"][]
          is_active: boolean
          is_jackpot: boolean
          model: string
          name: string
          retail_value_usd: number
          traits: string[] | null
        }
        Insert: {
          band: Database["public"]["Enums"]["rarity_band"]
          brand: string
          bucket: Database["public"]["Enums"]["award_bucket"]
          category: Database["public"]["Enums"]["product_category"]
          created_at?: string
          description?: string | null
          expected_fulfillment_cost_usd: number
          id?: string
          image_url?: string | null
          inventory_required_status?: Database["public"]["Enums"]["inventory_status"][]
          is_active?: boolean
          is_jackpot?: boolean
          model: string
          name: string
          retail_value_usd: number
          traits?: string[] | null
        }
        Update: {
          band?: Database["public"]["Enums"]["rarity_band"]
          brand?: string
          bucket?: Database["public"]["Enums"]["award_bucket"]
          category?: Database["public"]["Enums"]["product_category"]
          created_at?: string
          description?: string | null
          expected_fulfillment_cost_usd?: number
          id?: string
          image_url?: string | null
          inventory_required_status?: Database["public"]["Enums"]["inventory_status"][]
          is_active?: boolean
          is_jackpot?: boolean
          model?: string
          name?: string
          retail_value_usd?: number
          traits?: string[] | null
        }
        Relationships: []
      }
      product_questions: {
        Row: {
          bonus_tickets: number
          correct_option: string
          created_at: string
          display_order: number
          id: string
          is_active: boolean
          option_a: string
          option_b: string
          option_c: string
          option_d: string
          product_class_id: string
          question_text: string
        }
        Insert: {
          bonus_tickets?: number
          correct_option: string
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          option_a: string
          option_b: string
          option_c: string
          option_d: string
          product_class_id: string
          question_text: string
        }
        Update: {
          bonus_tickets?: number
          correct_option?: string
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          option_a?: string
          option_b?: string
          option_c?: string
          option_d?: string
          product_class_id?: string
          question_text?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_questions_product_class_id_fkey"
            columns: ["product_class_id"]
            isOneToOne: false
            referencedRelation: "product_classes"
            referencedColumns: ["id"]
          },
        ]
      }
      promo_spend_daily: {
        Row: {
          spend_date: string
          spent_usd: number
          updated_at: string
        }
        Insert: {
          spend_date: string
          spent_usd?: number
          updated_at?: string
        }
        Update: {
          spend_date?: string
          spent_usd?: number
          updated_at?: string
        }
        Relationships: []
      }
      purchases: {
        Row: {
          created_at: string
          id: string
          net_revenue_usd: number | null
          pool_contribution_usd: number | null
          quantity: number
          stripe_amount_total_cents: number
          stripe_payment_intent_id: string | null
          stripe_session_id: string
          tier: Database["public"]["Enums"]["pricing_tier"]
          total_price_usd: number
          unit_price_usd: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          net_revenue_usd?: number | null
          pool_contribution_usd?: number | null
          quantity: number
          stripe_amount_total_cents: number
          stripe_payment_intent_id?: string | null
          stripe_session_id: string
          tier: Database["public"]["Enums"]["pricing_tier"]
          total_price_usd: number
          unit_price_usd: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          net_revenue_usd?: number | null
          pool_contribution_usd?: number | null
          quantity?: number
          stripe_amount_total_cents?: number
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string
          tier?: Database["public"]["Enums"]["pricing_tier"]
          total_price_usd?: number
          unit_price_usd?: number
          user_id?: string
        }
        Relationships: []
      }
      reveals: {
        Row: {
          award_id: string | null
          band: Database["public"]["Enums"]["rarity_band"]
          card_data: Json | null
          card_state: string
          created_at: string
          credits_awarded: number
          id: string
          is_award: boolean
          is_golden: boolean
          priority_points: number
          product_class_id: string
          product_credits_awarded: number
          purchase_id: string | null
          redeem_credits_cents: number
          redeemed_at: string | null
          revealed_at: string | null
          serial_number: string
          staked_at: string | null
          staked_room_id: string | null
          universal_credits_awarded: number
          user_id: string
        }
        Insert: {
          award_id?: string | null
          band: Database["public"]["Enums"]["rarity_band"]
          card_data?: Json | null
          card_state?: string
          created_at?: string
          credits_awarded?: number
          id?: string
          is_award?: boolean
          is_golden?: boolean
          priority_points?: number
          product_class_id: string
          product_credits_awarded?: number
          purchase_id?: string | null
          redeem_credits_cents?: number
          redeemed_at?: string | null
          revealed_at?: string | null
          serial_number: string
          staked_at?: string | null
          staked_room_id?: string | null
          universal_credits_awarded?: number
          user_id: string
        }
        Update: {
          award_id?: string | null
          band?: Database["public"]["Enums"]["rarity_band"]
          card_data?: Json | null
          card_state?: string
          created_at?: string
          credits_awarded?: number
          id?: string
          is_award?: boolean
          is_golden?: boolean
          priority_points?: number
          product_class_id?: string
          product_credits_awarded?: number
          purchase_id?: string | null
          redeem_credits_cents?: number
          redeemed_at?: string | null
          revealed_at?: string | null
          serial_number?: string
          staked_at?: string | null
          staked_room_id?: string | null
          universal_credits_awarded?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reveals_product_class_id_fkey"
            columns: ["product_class_id"]
            isOneToOne: false
            referencedRelation: "product_classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reveals_purchase_id_fkey"
            columns: ["purchase_id"]
            isOneToOne: false
            referencedRelation: "purchases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reveals_staked_room_id_fkey"
            columns: ["staked_room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      reward_pack_grants: {
        Row: {
          created_at: string
          id: string
          opened_at: string | null
          source_id: string | null
          source_type: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          opened_at?: string | null
          source_id?: string | null
          source_type?: string
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          opened_at?: string | null
          source_id?: string | null
          source_type?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      room_entries: {
        Row: {
          amount_spent_cents: number
          credits_awarded: number | null
          credits_converted: number | null
          early_stake_bonus: number | null
          entry_type: string
          id: string
          outcome: string
          packs_awarded: number | null
          percentile_band: string | null
          priority_score: number | null
          rank: number | null
          reveal_id: string | null
          room_id: string
          stake_snapshot: Json
          staked_at: string
          status: string
          tickets: number
          trivia_tickets: number
          user_id: string
        }
        Insert: {
          amount_spent_cents?: number
          credits_awarded?: number | null
          credits_converted?: number | null
          early_stake_bonus?: number | null
          entry_type?: string
          id?: string
          outcome?: string
          packs_awarded?: number | null
          percentile_band?: string | null
          priority_score?: number | null
          rank?: number | null
          reveal_id?: string | null
          room_id: string
          stake_snapshot: Json
          staked_at?: string
          status?: string
          tickets?: number
          trivia_tickets?: number
          user_id: string
        }
        Update: {
          amount_spent_cents?: number
          credits_awarded?: number | null
          credits_converted?: number | null
          early_stake_bonus?: number | null
          entry_type?: string
          id?: string
          outcome?: string
          packs_awarded?: number | null
          percentile_band?: string | null
          priority_score?: number | null
          rank?: number | null
          reveal_id?: string | null
          room_id?: string
          stake_snapshot?: Json
          staked_at?: string
          status?: string
          tickets?: number
          trivia_tickets?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "room_entries_reveal_id_fkey"
            columns: ["reveal_id"]
            isOneToOne: false
            referencedRelation: "reveals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_entries_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      room_entry_credit_purchases: {
        Row: {
          created_at: string
          credits_spent: number
          entries_granted: number
          entry_id: string | null
          id: string
          room_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          credits_spent: number
          entries_granted: number
          entry_id?: string | null
          id?: string
          room_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          credits_spent?: number
          entries_granted?: number
          entry_id?: string | null
          id?: string
          room_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "room_entry_credit_purchases_entry_id_fkey"
            columns: ["entry_id"]
            isOneToOne: false
            referencedRelation: "room_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_entry_credit_purchases_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      room_entry_purchases: {
        Row: {
          amount_cents: number
          created_at: string
          entry_id: string | null
          id: string
          room_id: string
          stripe_payment_intent_id: string | null
          stripe_session_id: string | null
          tickets_granted: number
          user_id: string
        }
        Insert: {
          amount_cents: number
          created_at?: string
          entry_id?: string | null
          id?: string
          room_id: string
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          tickets_granted: number
          user_id: string
        }
        Update: {
          amount_cents?: number
          created_at?: string
          entry_id?: string | null
          id?: string
          room_id?: string
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          tickets_granted?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "room_entry_purchases_entry_id_fkey"
            columns: ["entry_id"]
            isOneToOne: false
            referencedRelation: "room_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_entry_purchases_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      room_reward_config: {
        Row: {
          base_packs: number
          base_participation_credits: number
          multiplier: number
          packs_cap: number
          tier: string
        }
        Insert: {
          base_packs?: number
          base_participation_credits: number
          multiplier: number
          packs_cap?: number
          tier: string
        }
        Update: {
          base_packs?: number
          base_participation_credits?: number
          multiplier?: number
          packs_cap?: number
          tier?: string
        }
        Relationships: []
      }
      room_rewards: {
        Row: {
          created_at: string
          credits_awarded: number
          entry_id: string
          final_rank: number
          id: string
          packs_awarded: number
          percentile_band: string
          room_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          credits_awarded?: number
          entry_id: string
          final_rank: number
          id?: string
          packs_awarded?: number
          percentile_band: string
          room_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          credits_awarded?: number
          entry_id?: string
          final_rank?: number
          id?: string
          packs_awarded?: number
          percentile_band?: string
          room_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "room_rewards_entry_id_fkey"
            columns: ["entry_id"]
            isOneToOne: false
            referencedRelation: "room_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_rewards_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      room_trivia_attempts: {
        Row: {
          attempts_used: number
          created_at: string
          id: string
          last_failed_at: string | null
          room_id: string
          unlocked_at: string | null
          user_id: string
        }
        Insert: {
          attempts_used?: number
          created_at?: string
          id?: string
          last_failed_at?: string | null
          room_id: string
          unlocked_at?: string | null
          user_id: string
        }
        Update: {
          attempts_used?: number
          created_at?: string
          id?: string
          last_failed_at?: string | null
          room_id?: string
          unlocked_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "room_trivia_attempts_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      room_trivia_entries: {
        Row: {
          created_at: string
          id: string
          room_id: string
          trivia_tickets: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          room_id: string
          trivia_tickets?: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          room_id?: string
          trivia_tickets?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "room_trivia_entries_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      rooms: {
        Row: {
          category: string | null
          created_at: string
          deadline_at: string | null
          end_at: string
          escrow_balance_cents: number
          escrow_target_cents: number
          funding_target_cents: number | null
          id: string
          is_mystery: boolean
          leaderboard_visibility: string | null
          lock_at: string | null
          max_participants: number
          min_participants: number
          mystery_product_id: string | null
          product_class_id: string | null
          reward_budget_cents: number | null
          start_at: string
          status: string
          tier: string
          tier_cap_cents: number
          winner_entry_id: string | null
          winner_user_id: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          deadline_at?: string | null
          end_at: string
          escrow_balance_cents?: number
          escrow_target_cents: number
          funding_target_cents?: number | null
          id?: string
          is_mystery?: boolean
          leaderboard_visibility?: string | null
          lock_at?: string | null
          max_participants?: number
          min_participants?: number
          mystery_product_id?: string | null
          product_class_id?: string | null
          reward_budget_cents?: number | null
          start_at: string
          status?: string
          tier: string
          tier_cap_cents: number
          winner_entry_id?: string | null
          winner_user_id?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string
          deadline_at?: string | null
          end_at?: string
          escrow_balance_cents?: number
          escrow_target_cents?: number
          funding_target_cents?: number | null
          id?: string
          is_mystery?: boolean
          leaderboard_visibility?: string | null
          lock_at?: string | null
          max_participants?: number
          min_participants?: number
          mystery_product_id?: string | null
          product_class_id?: string | null
          reward_budget_cents?: number | null
          start_at?: string
          status?: string
          tier?: string
          tier_cap_cents?: number
          winner_entry_id?: string | null
          winner_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rooms_mystery_product_id_fkey"
            columns: ["mystery_product_id"]
            isOneToOne: false
            referencedRelation: "product_classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rooms_product_class_id_fkey"
            columns: ["product_class_id"]
            isOneToOne: false
            referencedRelation: "product_classes"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          api_endpoint: string | null
          api_key_encrypted: string | null
          contact_email: string | null
          created_at: string
          id: string
          is_active: boolean
          name: string
          notes: string | null
          updated_at: string
        }
        Insert: {
          api_endpoint?: string | null
          api_key_encrypted?: string | null
          contact_email?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          notes?: string | null
          updated_at?: string
        }
        Update: {
          api_endpoint?: string | null
          api_key_encrypted?: string | null
          contact_email?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          notes?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      swap_offers: {
        Row: {
          created_at: string
          id: string
          offerer_transfer_id: string
          receiver_reveal_id: string | null
          resolved_at: string | null
          status: string
        }
        Insert: {
          created_at?: string
          id?: string
          offerer_transfer_id: string
          receiver_reveal_id?: string | null
          resolved_at?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          id?: string
          offerer_transfer_id?: string
          receiver_reveal_id?: string | null
          resolved_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "swap_offers_offerer_transfer_id_fkey"
            columns: ["offerer_transfer_id"]
            isOneToOne: false
            referencedRelation: "card_transfers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "swap_offers_receiver_reveal_id_fkey"
            columns: ["receiver_reveal_id"]
            isOneToOne: false
            referencedRelation: "reveals"
            referencedColumns: ["id"]
          },
        ]
      }
      tier_escrow_pools: {
        Row: {
          balance_cents: number
          tier: string
          tier_cap_cents: number
          updated_at: string
        }
        Insert: {
          balance_cents?: number
          tier: string
          tier_cap_cents: number
          updated_at?: string
        }
        Update: {
          balance_cents?: number
          tier?: string
          tier_cap_cents?: number
          updated_at?: string
        }
        Relationships: []
      }
      trivia_credit_config: {
        Row: {
          description: string | null
          key: string
          updated_at: string
          value: number
        }
        Insert: {
          description?: string | null
          key: string
          updated_at?: string
          value: number
        }
        Update: {
          description?: string | null
          key?: string
          updated_at?: string
          value?: number
        }
        Relationships: []
      }
      trivia_credit_transactions: {
        Row: {
          amount: number
          balance_after: number
          created_at: string
          id: string
          question_id: string | null
          room_id: string | null
          transaction_type: Database["public"]["Enums"]["trivia_credit_transaction_type"]
          user_id: string
        }
        Insert: {
          amount: number
          balance_after: number
          created_at?: string
          id?: string
          question_id?: string | null
          room_id?: string | null
          transaction_type: Database["public"]["Enums"]["trivia_credit_transaction_type"]
          user_id: string
        }
        Update: {
          amount?: number
          balance_after?: number
          created_at?: string
          id?: string
          question_id?: string | null
          room_id?: string | null
          transaction_type?: Database["public"]["Enums"]["trivia_credit_transaction_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trivia_credit_transactions_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "product_questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trivia_credit_transactions_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      user_notification_settings: {
        Row: {
          created_at: string
          email_enabled: boolean
          id: string
          in_app_enabled: boolean
          notify_battles: boolean
          notify_gifts: boolean
          notify_marketing: boolean
          notify_rewards: boolean
          notify_rooms: boolean
          notify_swaps: boolean
          push_enabled: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email_enabled?: boolean
          id?: string
          in_app_enabled?: boolean
          notify_battles?: boolean
          notify_gifts?: boolean
          notify_marketing?: boolean
          notify_rewards?: boolean
          notify_rooms?: boolean
          notify_swaps?: boolean
          push_enabled?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email_enabled?: boolean
          id?: string
          in_app_enabled?: boolean
          notify_battles?: boolean
          notify_gifts?: boolean
          notify_marketing?: boolean
          notify_rewards?: boolean
          notify_rooms?: boolean
          notify_swaps?: boolean
          push_enabled?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_product_credits: {
        Row: {
          credits: number
          id: string
          product_class_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          credits?: number
          id?: string
          product_class_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          credits?: number
          id?: string
          product_class_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_product_credits_product_class_id_fkey"
            columns: ["product_class_id"]
            isOneToOne: false
            referencedRelation: "product_classes"
            referencedColumns: ["id"]
          },
        ]
      }
      user_question_answers: {
        Row: {
          answered_at: string
          bonus_tickets_awarded: number
          id: string
          is_correct: boolean
          question_id: string
          room_id: string
          selected_option: string
          user_id: string
        }
        Insert: {
          answered_at?: string
          bonus_tickets_awarded?: number
          id?: string
          is_correct: boolean
          question_id: string
          room_id: string
          selected_option: string
          user_id: string
        }
        Update: {
          answered_at?: string
          bonus_tickets_awarded?: number
          id?: string
          is_correct?: boolean
          question_id?: string
          room_id?: string
          selected_option?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_question_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "product_questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_question_answers_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
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
          role: Database["public"]["Enums"]["app_role"]
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
      user_sessions: {
        Row: {
          created_at: string
          device_info: string | null
          id: string
          ip_address: string | null
          is_current: boolean
          last_active_at: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          device_info?: string | null
          id?: string
          ip_address?: string | null
          is_current?: boolean
          last_active_at?: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          device_info?: string | null
          id?: string
          ip_address?: string | null
          is_current?: boolean
          last_active_at?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_trivia_credits: {
        Row: {
          created_at: string
          credits: number
          id: string
          lifetime_earned: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          credits?: number
          id?: string
          lifetime_earned?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          credits?: number
          id?: string
          lifetime_earned?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_universal_credits: {
        Row: {
          credits: number
          updated_at: string
          user_id: string
        }
        Insert: {
          credits?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          credits?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      webhook_events: {
        Row: {
          created_at: string
          event_id: string
          event_type: string | null
          id: string
          payload: Json
          processed: boolean
          processed_at: string | null
          provider: string
        }
        Insert: {
          created_at?: string
          event_id: string
          event_type?: string | null
          id?: string
          payload: Json
          processed?: boolean
          processed_at?: string | null
          provider: string
        }
        Update: {
          created_at?: string
          event_id?: string
          event_type?: string | null
          id?: string
          payload?: Json
          processed?: boolean
          processed_at?: string | null
          provider?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      answer_trivia_question: {
        Args: {
          p_question_id: string
          p_room_id: string
          p_selected_option: string
        }
        Returns: Json
      }
      attempt_trivia_for_purchase: {
        Args: {
          p_question_id: string
          p_room_id: string
          p_selected_option: string
        }
        Returns: Json
      }
      buy_entries_with_credits: {
        Args: { p_credits_to_spend: number; p_room_id: string }
        Returns: Json
      }
      buy_room_entry: {
        Args: {
          p_amount_cents: number
          p_room_id: string
          p_stripe_payment_intent_id?: string
          p_stripe_session_id?: string
          p_user_id?: string
        }
        Returns: Json
      }
      calculate_collector_score: {
        Args: {
          p_battles_lost: number
          p_battles_won: number
          p_card_count: number
          p_collection_value: number
          p_gifts_given: number
          p_redemptions: number
          p_swaps_completed: number
        }
        Returns: number
      }
      cancel_transfer: { Args: { p_transfer_id: string }; Returns: Json }
      claim_gift: { Args: { p_claim_token: string }; Returns: Json }
      claim_redemption: { Args: { p_room_id: string }; Returns: Json }
      claim_reward_pack: { Args: { p_pack_id: string }; Returns: Json }
      claim_swap: {
        Args: { p_claim_token: string; p_offered_reveal_id: string }
        Returns: Json
      }
      complete_battle: { Args: { p_battle_id: string }; Returns: undefined }
      compute_agent_card_score: {
        Args: { p_card_data: Json; p_is_joker?: boolean }
        Returns: number
      }
      compute_card_score: {
        Args: { p_is_joker?: boolean; p_reveal_id: string }
        Returns: number
      }
      convert_to_credits: { Args: { p_room_id: string }; Returns: Json }
      create_gift_transfer: {
        Args: {
          p_claim_token: string
          p_reveal_id: string
          p_to_user_id?: string
        }
        Returns: Json
      }
      create_swap_offer: {
        Args: {
          p_claim_token: string
          p_reveal_id: string
          p_to_user_id?: string
        }
        Returns: Json
      }
      draw_room_winner: { Args: { p_room_id: string }; Returns: Json }
      earn_trivia_credits: {
        Args: {
          p_question_id: string
          p_room_id: string
          p_selected_option: string
          p_source?: string
        }
        Returns: Json
      }
      enter_lot_with_trivia_credits: {
        Args: { p_room_id: string; p_tickets_to_buy?: number }
        Returns: Json
      }
      follow_collector: { Args: { p_target_user_id: string }; Returns: Json }
      get_active_battle: { Args: never; Returns: Json }
      get_active_rooms: { Args: { p_tier?: string }; Returns: Json }
      get_battle_set_categories: {
        Args: { p_battle_set_id: string }
        Returns: string[]
      }
      get_collector_collection: { Args: { p_user_id: string }; Returns: Json }
      get_collector_profile: { Args: { p_user_id: string }; Returns: Json }
      get_collector_score: { Args: { p_user_id: string }; Returns: Json }
      get_collectors_list: {
        Args: { p_filter?: string; p_limit?: number }
        Returns: Json
      }
      get_lot_trivia_stats: { Args: { p_room_id: string }; Returns: Json }
      get_my_eligible_cards: { Args: { p_room_id: string }; Returns: Json }
      get_my_room_entry: { Args: { p_room_id: string }; Returns: Json }
      get_my_trivia_credits: { Args: never; Returns: Json }
      get_my_trivia_entry: { Args: { p_room_id: string }; Returns: Json }
      get_pending_transfers_with_collector: {
        Args: { p_collector_user_id: string }
        Returns: Json
      }
      get_room_details: { Args: { p_room_id: string }; Returns: Json }
      get_room_entry_by_session: {
        Args: { p_session_id: string }
        Returns: Json
      }
      get_room_leaderboard: { Args: { p_room_id: string }; Returns: Json }
      get_transfer_details_by_claim_token: {
        Args: { p_claim_token: string }
        Returns: Json
      }
      get_trivia_config: { Args: { p_key: string }; Returns: number }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      join_room: {
        Args: { p_reveal_id: string; p_room_id: string }
        Returns: Json
      }
      leave_room:
        | { Args: { p_room_id: string }; Returns: Json }
        | { Args: { p_reveal_id: string; p_room_id: string }; Returns: Json }
      mark_all_notifications_read: { Args: never; Returns: undefined }
      mark_notification_read: {
        Args: { p_notification_id: string }
        Returns: undefined
      }
      mark_reveal_seen: { Args: { p_reveal_id: string }; Returns: undefined }
      process_category_pack_purchase: {
        Args: {
          p_category: string
          p_quantity: number
          p_stripe_payment_intent_id: string
          p_stripe_session_id: string
          p_tier: string
          p_total_cents: number
          p_unit_price_cents: number
          p_user_id: string
        }
        Returns: Json
      }
      process_daily_free_pull: { Args: { p_user_id: string }; Returns: Json }
      process_mystery_card_purchase: {
        Args: {
          p_quantity: number
          p_stripe_payment_intent_id: string
          p_stripe_session_id: string
          p_tier: string
          p_total_cents: number
          p_unit_price_cents: number
          p_user_id: string
        }
        Returns: Json
      }
      request_room_refund: { Args: { p_room_id: string }; Returns: Json }
      reveal_mystery_product: { Args: { p_room_id: string }; Returns: Json }
      save_battle_set: { Args: { p_reveal_ids: string[] }; Returns: string }
      search_collectors: {
        Args: { p_limit?: number; p_query: string }
        Returns: Json
      }
      settle_room: { Args: { p_room_id: string }; Returns: Json }
      spend_credits_for_progress: {
        Args: {
          p_credits_to_spend: number
          p_product_class_id: string
          p_user_id: string
        }
        Returns: Json
      }
      start_agent_battle: { Args: { p_battle_set_id: string }; Returns: Json }
      start_battle: { Args: { p_battle_set_id: string }; Returns: Json }
      submit_round_pick: {
        Args: {
          p_battle_id: string
          p_reveal_id: string
          p_round_index: number
        }
        Returns: Json
      }
      unfollow_collector: { Args: { p_target_user_id: string }; Returns: Json }
      verify_lottery_draw: { Args: { p_draw_id: string }; Returns: Json }
    }
    Enums: {
      agent_tier: "rookie" | "skilled" | "pro" | "elite"
      app_role: "admin" | "moderator" | "user"
      award_bucket:
        | "microWins"
        | "midWins"
        | "services"
        | "jackpot"
        | "superJackpot"
        | "reserve"
        | "promo"
      award_status: "RESERVED" | "FULFILLED" | "CANCELLED" | "EXPIRED"
      battle_status: "QUEUED" | "ACTIVE" | "COMPLETE" | "EXPIRED" | "CANCELLED"
      inventory_status:
        | "IN_CUSTODY"
        | "GUARANTEED_SELLER"
        | "SOFT_LISTING_OK"
        | "UNAVAILABLE"
      opponent_type: "human" | "agent"
      pool_event: "ADD" | "RESERVE" | "RELEASE" | "CAPTURE"
      pricing_tier: "T5" | "T10" | "T20"
      product_category:
        | "POKEMON"
        | "SNEAKERS"
        | "WATCHES"
        | "HANDBAGS"
        | "WINE"
        | "CLOTHING"
        | "JEWELLERY"
        | "ART_TOYS"
        | "SPORT_MEMORABILIA"
      rarity_band: "ICON" | "RARE" | "GRAIL" | "MYTHIC"
      round_winner: "A" | "B" | "TIE"
      trivia_credit_transaction_type:
        | "EARNED_TRIVIA_GATE"
        | "EARNED_KNOWLEDGE_BOOST"
        | "SPENT_FREE_ENTRY"
        | "BONUS"
        | "ADMIN_ADJUSTMENT"
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
      agent_tier: ["rookie", "skilled", "pro", "elite"],
      app_role: ["admin", "moderator", "user"],
      award_bucket: [
        "microWins",
        "midWins",
        "services",
        "jackpot",
        "superJackpot",
        "reserve",
        "promo",
      ],
      award_status: ["RESERVED", "FULFILLED", "CANCELLED", "EXPIRED"],
      battle_status: ["QUEUED", "ACTIVE", "COMPLETE", "EXPIRED", "CANCELLED"],
      inventory_status: [
        "IN_CUSTODY",
        "GUARANTEED_SELLER",
        "SOFT_LISTING_OK",
        "UNAVAILABLE",
      ],
      opponent_type: ["human", "agent"],
      pool_event: ["ADD", "RESERVE", "RELEASE", "CAPTURE"],
      pricing_tier: ["T5", "T10", "T20"],
      product_category: [
        "POKEMON",
        "SNEAKERS",
        "WATCHES",
        "HANDBAGS",
        "WINE",
        "CLOTHING",
        "JEWELLERY",
        "ART_TOYS",
        "SPORT_MEMORABILIA",
      ],
      rarity_band: ["ICON", "RARE", "GRAIL", "MYTHIC"],
      round_winner: ["A", "B", "TIE"],
      trivia_credit_transaction_type: [
        "EARNED_TRIVIA_GATE",
        "EARNED_KNOWLEDGE_BOOST",
        "SPENT_FREE_ENTRY",
        "BONUS",
        "ADMIN_ADJUSTMENT",
      ],
    },
  },
} as const
