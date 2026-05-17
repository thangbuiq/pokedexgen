-- Flattened evolution model using staging layers
-- Stage 1: base Pokemon (no evolution trigger), Stage 2+: evolutions with trigger
-- details
with
    stage1 as (
        select
            chain_id,
            species_name,
            1 as stage,
            null::varchar as evolves_from,
            null::varchar as evolution_trigger,
            null::bigint as min_level,
            null::varchar as item_required
        from {{ ref("stg_evolution__chains") }}
    ),

    stage2 as (
        select
            chain_id,
            species_name,
            2 as stage,
            evolves_from,
            evolution_trigger,
            min_level,
            item_required
        from {{ ref("stg_evolution__evolves_to") }}
    ),

    stage3 as (
        select
            chain_id,
            species_name,
            3 as stage,
            evolves_from,
            evolution_trigger,
            min_level,
            item_required
        from {{ ref("stg_evolution__evolves_to_second") }}
    )

select *
from stage1
union all
select *
from stage2
union all
select *
from stage3
