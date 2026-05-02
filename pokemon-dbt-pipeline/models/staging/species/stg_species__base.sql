with
    species as (
        select
            id,
            pokemon_id,
            any_value(color__name) as color,
            any_value(capture_rate) as capture_rate,
            any_value(base_happiness) as base_happiness,
            min(_dlt_id) as _dlt_id
        from {{ source("raw_data", "pokemon_species") }}
        group by id, pokemon_id
    ),
    names as (
        select _dlt_parent_id, max(name) as japanese_name
        from {{ source("raw_data", "pokemon_species__names") }}
        where language__name = 'ja-roma'
        group by _dlt_parent_id
    )
select s.id, s.pokemon_id, s.color, s.capture_rate, s.base_happiness, n.japanese_name
from species s
left join names n on s._dlt_id = n._dlt_parent_id
