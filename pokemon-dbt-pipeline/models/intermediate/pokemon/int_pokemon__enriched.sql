with
    type_agg as (
        select pokemon_id, group_concat(type_name) as type_names
        from {{ ref("stg_pokemon__types") }}
        group by pokemon_id
    ),
    stat_pivot as (
        select
            pokemon_id,
            max(case when stat_name = 'hp' then base_stat end) as hp,
            max(case when stat_name = 'attack' then base_stat end) as attack,
            max(case when stat_name = 'defense' then base_stat end) as defense,
            max(
                case when stat_name = 'special-attack' then base_stat end
            ) as special_attack,
            max(
                case when stat_name = 'special-defense' then base_stat end
            ) as special_defense,
            max(case when stat_name = 'speed' then base_stat end) as speed
        from {{ ref("stg_pokemon__stats") }}
        group by pokemon_id
    )
select
    p.id,
    p.name,
    p.height,
    p.weight,
    p.sprite_url,
    s.color,
    s.japanese_name,
    t.type_names,
    st.hp,
    st.attack,
    st.defense,
    st.special_attack,
    st.special_defense,
    st.speed,
    (
        st.hp
        + st.attack
        + st.defense
        + st.special_attack
        + st.special_defense
        + st.speed
    ) as total_stats
from {{ ref("stg_pokemon__base") }} p
left join {{ ref("stg_species__base") }} s on p.id = s.pokemon_id
left join type_agg t on p.id = t.pokemon_id
left join stat_pivot st on p.id = st.pokemon_id
