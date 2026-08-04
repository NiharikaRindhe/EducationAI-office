-- ═════════════════════════════════════════════════════════════
--  ACTIVATE TIMES TABLE / EQUAL SHARE
--  tbl-3 and div-4 were seeded is_active=false in the original
--  games_catalog migration as placeholders for engines that
--  hadn't shipped yet. QuestEngine.tsx already implements both
--  the 'times-table' and 'equal-share' generators (used by other
--  quest-driven catalog rows), so these just need flipping on —
--  no new engine code required.
-- ═════════════════════════════════════════════════════════════

update games_catalog set is_active = true where game_id in ('tbl-3', 'div-4');
