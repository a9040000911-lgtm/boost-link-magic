-- Allow admins to update transactions (for manual payment confirmation)
CREATE POLICY "Admins can update transactions"
ON public.transactions
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
