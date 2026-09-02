-- Remove Emma Wilson from SP102 (Coronation)
-- Emma Wilson is strictly the Strata Manager for Cavalier Grand (SP103)
DELETE FROM public.members
WHERE LOWER(email) = 'emma.wilson@agency.com'
  AND scheme_id = 'SP102';
