-- Allow public (anon) to read payments joined with their own patient record
CREATE POLICY "select_own_payments" ON payments FOR SELECT
  TO anon
  USING (
    patient_id IN (
      SELECT id FROM patients 
      WHERE phone = current_setting('request.jwt.claims', true)::json->>'phone'
      OR patient_id = current_setting('request.jwt.claims', true)::json->>'patient_id'
    )
  );

-- Alternative: Allow public to read payments by patient_id/phone via edge function
-- Since edge functions use service role, we'll expose a dedicated endpoint instead
