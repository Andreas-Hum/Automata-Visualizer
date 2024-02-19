import State from "./state";


export default class NFA {
    states: Set<State>;
    transitions: Map<State, Map<string, Set<State>>>
    alphabet: Set<string>




    constructPowerset(): Set<Set<State>> {
        const result: Set<Set<State>> = new Set();
        result.add(new Set<State>().add(new State("Ø")))

        const statesArray: State[] = Array.from(this.states);
        for (let i = 1; i < (1 << statesArray.length); i++) {
            const subset: Set<State> = new Set();
            for (let j = 0; j < statesArray.length; j++) {
                if (i & (i << j)) {
                    subset.add(statesArray[j])
                }
            }
            result.add(subset)
        }
        return result;
    }
}

// Create new NFA
let nfa = new NFA();

// Create and add states
let state1 = new State("1");
let state2 = new State("2");
let state3 = new State("3");
nfa.states.add(state1);
nfa.states.add(state2);
nfa.states.add(state3);

// Print powerset
let powerset = nfa.constructPowerset();
powerset.forEach(set => {
    let stateNames = Array.from(set).map(state => state.name).join(', ');
    console.log(`{${stateNames}}`);
});