-- Fixtures prove the approved tie-breaker order without touching events.
begin read only;
do $$
declare
  ordering text[];
  result jsonb;
  pair jsonb := '[{"id":"a","dg":9,"gf":10},{"id":"b","dg":-1,"gf":3}]';
  four jsonb := '[{"id":"a","dg":-4,"gf":2},{"id":"b","dg":-2,"gf":4},{"id":"c","dg":10,"gf":15},{"id":"d","dg":9,"gf":14}]';
begin
  result := cfp_private.rank_ties(pair,
    '[{"home":"a","away":"b","kind":"sport","hg":0,"ag":1}]', '{}');
  select array_agg(x->>'id') into ordering from jsonb_array_elements(result) x;
  if ordering is distinct from array['b','a'] or result->0->>'tie_reason' <> 'Enfrentamiento directo' then
    raise exception 'El enfrentamiento directo debe prevalecer sobre DG y GF';
  end if;

  result := cfp_private.rank_ties(
    '[{"id":"a","dg":2,"gf":3},{"id":"b","dg":1,"gf":7},{"id":"c","dg":1,"gf":6}]',
    '[{"home":"b","away":"c","kind":"sport","hg":0,"ag":1}]', '{}');
  select array_agg(x->>'id') into ordering from jsonb_array_elements(result) x;
  if ordering is distinct from array['a','b','c'] then
    raise exception 'Minitabla incompleta debe pasar a DG y GF generales';
  end if;

  result := cfp_private.rank_ties(four, '[
    {"home":"a","away":"b","kind":"sport","hg":1,"ag":0},
    {"home":"a","away":"c","kind":"sport","hg":1,"ag":0},
    {"home":"a","away":"d","kind":"sport","hg":0,"ag":1},
    {"home":"b","away":"c","kind":"sport","hg":1,"ag":0},
    {"home":"b","away":"d","kind":"sport","hg":1,"ag":0},
    {"home":"c","away":"d","kind":"sport","hg":1,"ag":0}
  ]', '{}');
  select array_agg(x->>'id') into ordering from jsonb_array_elements(result) x;
  if ordering is distinct from array['a','b','c','d']
    or result->0->>'tie_mini_wins' <> '2' or result->2->>'tie_mini_wins' <> '1' then
    raise exception 'Minitabla completa debe resolver los subgrupos por separado';
  end if;

  pair := '[{"id":"a","dg":-1,"gf":3},{"id":"b","dg":-1,"gf":3}]';
  result := cfp_private.rank_ties(pair,
    '[{"home":"a","away":"b","kind":"null","hg":0,"ag":0}]', '{}');
  if result->0->>'tie_pending' is distinct from 'true' or result->1->>'tie_key' is distinct from 'a,b' then
    raise exception 'Duelo nulo y estadísticas iguales deben requerir sorteo';
  end if;
  result := cfp_private.rank_ties(pair, '[]', '{"a,b":["b","a"]}');
  select array_agg(x->>'id') into ordering from jsonb_array_elements(result) x;
  if ordering is distinct from array['b','a'] or result->0->>'tie_pending' is distinct from 'false' then
    raise exception 'No se respetó el sorteo registrado';
  end if;
end;
$$;
rollback;
