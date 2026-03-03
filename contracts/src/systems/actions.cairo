#[starknet::interface]
pub trait IActions<T> {
    fn spawn_world(ref self: T);
    fn propose_trade(
        ref self: T,
        from_civ: u32,
        to_civ: u32,
        offer_resource: felt252,
        offer_amount: u32,
        request_resource: felt252,
        request_amount: u32,
    );
    fn accept_trade(ref self: T, trade_id: u32);
    fn reject_trade(ref self: T, trade_id: u32);
    fn tick(ref self: T);
}

#[dojo::contract]
pub mod actions {
    use dojo::model::ModelStorage;
    use dojo_starter::models::{Civilization, TradeProposal, WorldState};
    use super::IActions;

    fn get_resource(civ: @Civilization, resource: felt252) -> u32 {
        if resource == 'iron' {
            *civ.iron
        } else if resource == 'food' {
            *civ.food
        } else if resource == 'wood' {
            *civ.wood
        } else {
            0
        }
    }

    fn set_resource(ref civ: Civilization, resource: felt252, amount: u32) {
        if resource == 'iron' {
            civ.iron = amount;
        } else if resource == 'food' {
            civ.food = amount;
        } else if resource == 'wood' {
            civ.wood = amount;
        }
    }

    #[abi(embed_v0)]
    impl ActionsImpl of IActions<ContractState> {
        fn spawn_world(ref self: ContractState) {
            let mut world = self.world_default();

            // Check not already initialized
            let ws: WorldState = world.read_model(1_u32);
            assert(!ws.is_initialized, 'World already initialized');

            // Civilization A: Iron Kingdom - iron-rich, food-poor
            let civ_a = Civilization {
                id: 1,
                name: 'Iron Kingdom',
                iron: 100,
                food: 20,
                wood: 50,
                population: 100,
                is_alive: true,
            };

            // Civilization B: Green Valley - food-rich, iron-poor
            let civ_b = Civilization {
                id: 2,
                name: 'Green Valley',
                iron: 20,
                food: 100,
                wood: 50,
                population: 100,
                is_alive: true,
            };

            let world_state = WorldState {
                id: 1, tick: 0, trade_count: 0, is_initialized: true,
            };

            world.write_model(@civ_a);
            world.write_model(@civ_b);
            world.write_model(@world_state);
        }

        fn propose_trade(
            ref self: ContractState,
            from_civ: u32,
            to_civ: u32,
            offer_resource: felt252,
            offer_amount: u32,
            request_resource: felt252,
            request_amount: u32,
        ) {
            let mut world = self.world_default();

            // Validate civs exist and are alive
            let from: Civilization = world.read_model(from_civ);
            let to: Civilization = world.read_model(to_civ);
            assert(from.is_alive, 'From civ is dead');
            assert(to.is_alive, 'To civ is dead');

            // Check from_civ has enough resources
            let available = get_resource(@from, offer_resource);
            assert(available >= offer_amount, 'Not enough resources');

            // Create trade proposal
            let mut ws: WorldState = world.read_model(1_u32);
            ws.trade_count += 1;

            let trade = TradeProposal {
                id: ws.trade_count,
                from_civ,
                to_civ,
                offer_resource,
                offer_amount,
                request_resource,
                request_amount,
                status: 0, // pending
            };

            world.write_model(@trade);
            world.write_model(@ws);
        }

        fn accept_trade(ref self: ContractState, trade_id: u32) {
            let mut world = self.world_default();

            let mut trade: TradeProposal = world.read_model(trade_id);
            assert(trade.status == 0, 'Trade not pending');

            let mut from_civ: Civilization = world.read_model(trade.from_civ);
            let mut to_civ: Civilization = world.read_model(trade.to_civ);

            // Verify both sides have resources
            let from_has = get_resource(@from_civ, trade.offer_resource);
            let to_has = get_resource(@to_civ, trade.request_resource);
            assert(from_has >= trade.offer_amount, 'From civ lacks resources');
            assert(to_has >= trade.request_amount, 'To civ lacks resources');

            // Execute atomic swap
            // From civ: lose offer, gain request
            set_resource(ref from_civ, trade.offer_resource, from_has - trade.offer_amount);
            let from_gains = get_resource(@from_civ, trade.request_resource);
            set_resource(
                ref from_civ, trade.request_resource, from_gains + trade.request_amount,
            );

            // To civ: lose request, gain offer
            set_resource(ref to_civ, trade.request_resource, to_has - trade.request_amount);
            let to_gains = get_resource(@to_civ, trade.offer_resource);
            set_resource(ref to_civ, trade.offer_resource, to_gains + trade.offer_amount);

            trade.status = 1; // accepted

            world.write_model(@from_civ);
            world.write_model(@to_civ);
            world.write_model(@trade);
        }

        fn reject_trade(ref self: ContractState, trade_id: u32) {
            let mut world = self.world_default();

            let mut trade: TradeProposal = world.read_model(trade_id);
            assert(trade.status == 0, 'Trade not pending');

            trade.status = 2; // rejected
            world.write_model(@trade);
        }

        fn tick(ref self: ContractState) {
            let mut world = self.world_default();

            let mut ws: WorldState = world.read_model(1_u32);
            assert(ws.is_initialized, 'World not initialized');
            ws.tick += 1;

            // Each civ consumes food = population / 10
            let mut civ_a: Civilization = world.read_model(1_u32);
            let mut civ_b: Civilization = world.read_model(2_u32);

            if civ_a.is_alive {
                let food_cost = civ_a.population / 10;
                if civ_a.food >= food_cost {
                    civ_a.food -= food_cost;
                } else {
                    // Starvation: population decreases
                    civ_a.food = 0;
                    let pop_loss = food_cost - civ_a.food;
                    if civ_a.population > pop_loss {
                        civ_a.population -= pop_loss;
                    } else {
                        civ_a.population = 0;
                        civ_a.is_alive = false;
                    }
                }
            }

            if civ_b.is_alive {
                let food_cost = civ_b.population / 10;
                if civ_b.food >= food_cost {
                    civ_b.food -= food_cost;
                } else {
                    civ_b.food = 0;
                    let pop_loss = food_cost - civ_b.food;
                    if civ_b.population > pop_loss {
                        civ_b.population -= pop_loss;
                    } else {
                        civ_b.population = 0;
                        civ_b.is_alive = false;
                    }
                }
            }

            world.write_model(@civ_a);
            world.write_model(@civ_b);
            world.write_model(@ws);
        }
    }

    #[generate_trait]
    impl InternalImpl of InternalTrait {
        fn world_default(self: @ContractState) -> dojo::world::WorldStorage {
            self.world(@"dojo_starter")
        }
    }
}
