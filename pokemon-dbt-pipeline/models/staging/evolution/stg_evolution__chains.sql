-- Base evolution chains: root (baby/base) Pokemon in each chain
select distinct on (ec.id) ec.id as chain_id, ec.chain__species__name as species_name
from {{ source("raw_data", "evolution_chains") }} ec
qualify row_number() over (partition by ec.id order by ec._dlt_load_id desc) = 1
