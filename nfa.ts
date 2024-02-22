import State from "./state";

const EPSILON: string = 'ε'


export default class NFA {
    states: Set<State>;
    transitions: Map<State, Map<string, Set<State>>>
    alphabet: Set<string>
    startState!: State;
    acceptStates!: Set<State>



    /**
        * Create a new NFA.
        * @param {Set<State>} states - The set of states in the NFA.
        * @param {Map<State, Map<string, Set<State>>>} transitions - The transition function, mapping each state and symbol to a set of states.
        * @param {Set<string>} alphabet - The set of input symbols for the NFA.
        */
    constructor(states: Set<State>, alphabet: Set<string>) {
        this.states = states;
        this.alphabet = alphabet;

        // Initialize the transitions map using the transitions property of each State object
        this.transitions = new Map();
        for (let state of this.states) {
            this.transitions.set(state, state.transitions);
        }

        this.setAcceptStates()
        this.setStartState()
        this.findUnreachableStates()

    }


    /**
     * Constructs the powerset of the states in the NFA.
     * The powerset is a set of all possible subsets of a set.
     * The subsets in the powerset are sorted by their size.
     *
     * @returns {Set<Set<State>>} The powerset of the states in the NFA.
     */
    public constructPowerset(): Set<Set<State>> {
        const result: Set<Set<State>> = new Set();
        result.add(new Set<State>().add(new State("Ø")))

        const statesArray: State[] = Array.from(this.states).map((state: State) => new State(state.name));

        // Loop over all numbers from 1 to 2^n - 1, where n is the number of states
        for (let i = 1; i < (1 << statesArray.length); i++) {
            let subset: Set<State> = new Set();

            for (let j = 0; j < statesArray.length; j++) {
                // If the jth bit of i is set (i.e., if i & (1 << j) is not zero),
                if (i & (1 << j)) {
                    subset.add(statesArray[j])
                }
            }

            result.add(subset)
        }

        const sortedResult: Set<State>[] = Array.from(result).sort((a, b) => a.size - b.size);

        return new Set(sortedResult);
    }


    /**
     * Finds and throws an error if there are any unreachable states in the NFA.
     *
     * This method performs a depth-first search from the start state to find all reachable states.
     * It then iterates over all states and throws an error if it finds any that were not visited during the search.
     *
     */
    public findUnreachableStates(): Set<State> {
        const visited: Set<State> = new Set<State>();
        const stack: State[] = [this.startState];

        while (stack.length > 0) {
            const state: State = stack.pop()!;
            visited.add(state);

            const transitions = this.transitions.get(state);
            if (transitions) {
                for (const nextStateSet of transitions.values()) {
                    for (const nextState of nextStateSet) {
                        if (!visited.has(nextState)) {
                            stack.push(nextState);
                        }
                    }
                }
            }
        }

        const unreachableStates: State[] = [];
        for (const state of this.states) {
            if (!visited.has(state)) {
                unreachableStates.push(state);
            }
        }

        console.log(unreachableStates)
        return new Set<State>(unreachableStates);

    }

    /**
     * Sets the start state for the NFA.
     * 
     * This method filters the provided set of states to find the start state.
     * It throws an error if no start state is defined or if more than one start state is defined.
     * 
     * @throws {Error} Will throw an error if no start state is defined or if more than one start state is defined.
     */
    private setStartState(): void {
        const tempStartState: State[] = Array.from(this.states).filter((state: State) => state.settings.startState === true);

        switch (tempStartState.length) {
            case 0:
                throw new Error("No start state defined");
            case 1:
                this.startState = tempStartState[0];
                break;
            default:
                throw new Error("Can't have more than one start state defined");
        }
    }

    /**
     * Sets the accept states for the NFA.
     * 
     * This method filters the provided set of states to find the accept states.
     * It throws an error if no accept states are defined.
     * 
     * @throws {Error} Will throw an error if no accept states are defined.
     */
    private setAcceptStates(): void {
        const tempAcceptStates: State[] = Array.from(this.states).filter((state: State) => state.settings.acceptState === true);

        if (tempAcceptStates.length === 0) {
            throw new Error("No accept states defined");
        }

        this.acceptStates = new Set<State>(tempAcceptStates);
    }
}

