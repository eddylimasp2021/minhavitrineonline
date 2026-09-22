DROP POLICY IF EXISTS "product_images_public_read" ON storage.objects;

CREATE POLICY "product_images_owner_read" ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id = 'product-images' AND (storage.foldername(name))[1] = auth.uid()::text);