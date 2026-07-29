-- Batas en menú principal; eliminar categoría Bodies
update public.categories
set is_nav = true, updated_at = now()
where slug = 'batas';

delete from public.categories
where slug = 'bodies';
