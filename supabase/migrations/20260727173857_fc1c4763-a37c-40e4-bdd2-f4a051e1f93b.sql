
CREATE TABLE public.analytics_rate (
  session_id text NOT NULL,
  minute_bucket timestamptz NOT NULL,
  count integer NOT NULL DEFAULT 0,
  PRIMARY KEY (session_id, minute_bucket)
);

GRANT ALL ON public.analytics_rate TO service_role;
-- No anon/authenticated grants: only the SECURITY DEFINER trigger touches it.

ALTER TABLE public.analytics_rate ENABLE ROW LEVEL SECURITY;
-- No policies: locked to service_role + SECURITY DEFINER functions.

CREATE INDEX analytics_rate_bucket_idx ON public.analytics_rate (minute_bucket);

CREATE OR REPLACE FUNCTION public.enforce_analytics_rate_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  bucket timestamptz := date_trunc('minute', now());
  current_count integer;
  max_per_minute constant integer := 120;
BEGIN
  IF NEW.session_id IS NULL OR length(NEW.session_id) = 0 THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.analytics_rate (session_id, minute_bucket, count)
  VALUES (NEW.session_id, bucket, 1)
  ON CONFLICT (session_id, minute_bucket)
  DO UPDATE SET count = public.analytics_rate.count + 1
  RETURNING count INTO current_count;

  IF current_count > max_per_minute THEN
    RAISE EXCEPTION 'analytics rate limit exceeded' USING ERRCODE = '42901';
  END IF;

  -- Opportunistic cleanup: 0.5% chance, drop buckets older than 10 minutes.
  IF random() < 0.005 THEN
    DELETE FROM public.analytics_rate WHERE minute_bucket < now() - interval '10 minutes';
  END IF;

  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.enforce_analytics_rate_limit() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER analytics_events_rate_limit
BEFORE INSERT ON public.analytics_events
FOR EACH ROW EXECUTE FUNCTION public.enforce_analytics_rate_limit();
