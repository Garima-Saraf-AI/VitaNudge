-- Migration: Add subscription_status column if missing
-- Date: 2026-06-11
-- Purpose: Fix registration error - USER_SELECT includes subscription_status

ALTER TABLE users ADD COLUMN subscription_status TEXT DEFAULT 'active';
