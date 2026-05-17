select
    chain_id,
    species_name,
    stage,
    evolves_from,
    evolution_trigger,
    min_level,
    item_required
from {{ ref("int_evolution__flattened") }}
order by chain_id, stage
