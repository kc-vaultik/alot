-- Drop the old function signature that causes PostgREST ambiguity
DROP FUNCTION IF EXISTS public.get_room_leaderboard(uuid, integer);