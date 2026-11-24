-- Limita el bucket público de evidencias a fotos y PDF de hasta 4 MB.
-- La API ya valida los archivos, pero la política de Storage permite que
-- cualquier usuario con sesión suba directo al bucket con la anon key:
-- así Supabase rechaza también esas subidas (p. ej. un .html que se
-- serviría desde el dominio público del bucket).
update storage.buckets
set allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
    file_size_limit = 4194304
where id = 'evidencias';
