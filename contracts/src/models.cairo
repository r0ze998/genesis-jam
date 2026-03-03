// Genesis Jam - Models

#[derive(Copy, Drop, Serde, Debug)]
#[dojo::model]
pub struct Civilization {
    #[key]
    pub id: u32,
    pub name: felt252,
    pub iron: u32,
    pub food: u32,
    pub wood: u32,
    pub population: u32,
    pub is_alive: bool,
}

#[derive(Copy, Drop, Serde, Debug)]
#[dojo::model]
pub struct TradeProposal {
    #[key]
    pub id: u32,
    pub from_civ: u32,
    pub to_civ: u32,
    pub offer_resource: felt252,
    pub offer_amount: u32,
    pub request_resource: felt252,
    pub request_amount: u32,
    pub status: u8, // 0=pending, 1=accepted, 2=rejected
}

#[derive(Copy, Drop, Serde, Debug)]
#[dojo::model]
pub struct WorldState {
    #[key]
    pub id: u32,
    pub tick: u32,
    pub trade_count: u32,
    pub is_initialized: bool,
}
