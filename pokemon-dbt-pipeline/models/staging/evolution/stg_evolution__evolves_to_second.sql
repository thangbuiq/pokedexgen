-- Second-level evolutions (third Pokemon in chain) with JSON-extracted trigger data
-- evolution_details is stored as JSON array in the grandchild table
-- Deduplicates by preferring rows with non-empty evolution_details, then latest load
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
            json_extract_string(ev3.species, '$.name') as species_name,
            ev2.species__name as evolves_from,
            json_extract_string(
                ev3.evolution_details[0], '$.trigger.name'
            ) as evolution_trigger,
            try_cast(
                json_extract_string(ev3.evolution_details[0], '$.min_level') as bigint
            ) as min_level,
            json_extract_string(
                ev3.evolution_details[0], '$.item.name'
            ) as item_required,
            json_extract_string(
                ev3.evolution_details[0], '$.held_item.name'
            ) as held_item,
            json_extract_string(
                ev3.evolution_details[0], '$.time_of_day'
            ) as time_of_day,
            json_extract_string(
                ev3.evolution_details[0], '$.trade_species.name'
            ) as trade_species,
            json_extract_string(
                ev3.evolution_details[0], '$.party_species.name'
            ) as party_species,
            json_extract_string(
                ev3.evolution_details[0], '$.party_type.name'
            ) as party_type,
            json_extract_string(
                ev3.evolution_details[0], '$.known_move.name'
            ) as known_move,
            json_extract_string(
                ev3.evolution_details[0], '$.known_move_type.name'
            ) as known_move_type,
            json_extract_string(
                ev3.evolution_details[0], '$.location.name'
            ) as location,
            try_cast(
                json_extract_string(
                    ev3.evolution_details[0], '$.min_happiness'
                ) as bigint
            ) as min_happiness,
            try_cast(
                json_extract_string(ev3.evolution_details[0], '$.min_beauty') as bigint
            ) as min_beauty,
            try_cast(
                json_extract_string(
                    ev3.evolution_details[0], '$.min_affection'
                ) as bigint
            ) as min_affection,
            try_cast(
                json_extract_string(
                    ev3.evolution_details[0], '$.relative_physical_stats'
                ) as bigint
            ) as relative_physical_stats,
            try_cast(
                json_extract_string(
                    ev3.evolution_details[0], '$.needs_overworld_rain'
                ) as boolean
            ) as needs_overworld_rain,
            try_cast(
                json_extract_string(
                    ev3.evolution_details[0], '$.turn_upside_down'
                ) as boolean
            ) as turn_upside_down,
            try_cast(
                json_extract_string(
                    ev3.evolution_details[0], '$.needs_multiplayer'
                ) as boolean
            ) as needs_multiplayer,
            try_cast(
                json_extract_string(
                    ev3.evolution_details[0], '$.min_move_count'
                ) as bigint
            ) as min_move_count,
            try_cast(
                json_extract_string(ev3.evolution_details[0], '$.min_steps') as bigint
            ) as min_steps,
            try_cast(
                json_extract_string(
                    ev3.evolution_details[0], '$.min_damage_taken'
                ) as bigint
            ) as min_damage_taken,
            try_cast(
                json_extract_string(ev3.evolution_details[0], '$.gender') as bigint
            ) as gender,
            row_number() over (
                partition by ec.id, json_extract_string(ev3.species, '$.name')
                order by
                    case
                        when json_array_length(ev3.evolution_details) > 0 then 0 else 1
                    end,
                    ec._dlt_load_id desc
            ) as rn
        from {{ source("raw_data", "evolution_chains") }} ec
        join
            {{ source("raw_data", "evolution_chains__chain__evolves_to") }} ev2
            on ec._dlt_id = ev2._dlt_parent_id
        join
            {{ source("raw_data", "evolution_chains__chain__evolves_to__evolves_to") }} ev3
            on ev2._dlt_id = ev3._dlt_parent_id
        where json_extract_string(ev3.species, '$.name') is not null
    )
where rn = 1
