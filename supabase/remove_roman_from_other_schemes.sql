-- Remove Roman Joe from SP101 (Duplex), SP102 (Coronation), SP103 (Cavaller)
-- Roman Joe is strictly the Strata Manager for Spear Empire (SP823)
DELETE FROM public.members
WHERE LOWER(email) = 'romanjoe@gmail.com'
  AND scheme_id IN ('SP101', 'SP102', 'SP103');
