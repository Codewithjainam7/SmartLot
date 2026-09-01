-- 1. Link existing members to profiles where emails match (e.g. Roman Joe)
UPDATE public.members m
SET user_id = p.id
FROM public.profiles p
WHERE LOWER(m.email) = LOWER(p.email);

-- 2. Create trigger to automatically link members when a user signs up / profile is created
CREATE OR REPLACE FUNCTION public.handle_profile_member_link()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.members
  SET user_id = NEW.id
  WHERE LOWER(email) = LOWER(NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_link_profile_to_members ON public.profiles;
CREATE TRIGGER tr_link_profile_to_members
AFTER INSERT OR UPDATE OF email ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.handle_profile_member_link();
