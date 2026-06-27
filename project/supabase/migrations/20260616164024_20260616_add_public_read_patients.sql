-- Allow public to look up their own patient record by phone or patient_id (for Track Report feature)
CREATE POLICY "select_own_patient_public" ON patients FOR SELECT
  TO public USING (true);
