-- First-level evolutions with evolution details (trigger, min_level, item, etc.)
-- Joins evolution_chains -> evolves_to -> evolution_details
-- Deduplicates by preferring rows with evolution trigger data, then latest load
select
    chain_id,
    species_name,
    evolves_from,
    evolution_trigger,
    min_level,
    item_required,
    held_item,
    time_of_day,
    trade_species,
    party_species,
    party_type,
    known_move,
    known_move_type,
    location,
    min_happiness,
    min_beauty,
    min_affection,
    relative_physical_stats,
    needs_overworld_rain,
    turn_upside_down,
    needs_multiplayer,
    min_move_count,
    min_steps,
    min_damage_taken,
    gender
from
    (
        select
            ec.id as chain_id,
            ev.species__name as species_name,
            ec.chain__species__name as evolves_from,
            json_extract_string(ed.trigger, '$.name') as evolution_trigger,
            ed.min_level,
            json_extract_string(ed.item, '$.name') as item_required,
            json_extract_string(ed.held_item, '$.name') as held_item,
            ed.time_of_day,
            json_extract_string(ed.trade_species, '$.name') as trade_species,
            json_extract_string(ed.party_species, '$.name') as party_species,
            json_extract_string(ed.party_type, '$.name') as party_type,
            json_extract_string(ed.known_move, '$.name') as known_move,
            json_extract_string(ed.known_move_type, '$.name') as known_move_type,
            json_extract_string(ed.location, '$.name') as location,
            ed.min_happiness,
            ed.min_beauty,
            ed.min_affection,
            ed.relative_physical_stats,
            ed.needs_overworld_rain,
            ed.turn_upside_down,
            ed.needs_multiplayer,
            ed.min_move_count,
            ed.min_steps,
            ed.min_damage_taken,
            ed.gender,
            row_number() over (
                partition by ec.id, ev.species__name
                order by
                    case when ed.trigger is not null then 0 else 1 end,
                    case when ed.min_level is not null then 0 else 1 end,
                    case when ed.item is not null then 0 else 1 end,
                    ec._dlt_load_id desc
            ) as rn
        from {{ source("raw_data", "evolution_chains") }} ec
        join
            {{ source("raw_data", "evolution_chains__chain__evolves_to") }} ev
            on ec._dlt_id = ev._dlt_parent_id
        left join
            {{
                source(
                    "raw_data",
                    "evolution_chains__chain__evolves_to__evolution_details",
                )
            }} ed on ev._dlt_id = ed._dlt_parent_id
    )
where rn = 1
