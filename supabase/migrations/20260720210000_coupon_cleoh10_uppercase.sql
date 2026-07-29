-- Unify promo code display / storage as CLEOH10
update public.coupons
set code = 'CLEOH10'
where lower(code) = 'cleoh10';
