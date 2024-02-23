/**
 * Class representing a state in a finite automaton.
 */
export default class State {
    name: string;
    transitions: Map<string, Set<State>>
    settings: {
        startState: boolean;
        acceptState: boolean;
    }

    /**
     * Create a new state.
     * @param {string} name - The name of the state.
     * @param {Object} settings - The settings for the state.
     * @param {boolean} settings.startState - Whether the state is a start state.
     * @param {boolean} settings.acceptState - Whether the state is an accept state.
     */
    constructor(name: string, settings: {
        startState: boolean;
        acceptState: boolean;
    } = { startState: false, acceptState: false }) {
        this.name = name;
        this.transitions = new Map();
        this.settings = settings;
    }

    /**
     * Add a transition from this state to another state.
     * @param {string} symbol - The symbol for the transition.
     * @param {State} state - The state to transition to.
     * @return {boolean} Whether the transition was added successfully.
     */
    public addTransition(symbol: string, state: State): boolean {
        const states: Set<State> | undefined = this.transitions.get(symbol);
        if (states) {
            if (!states.has(state)) {
                states.add(state);
                return true;
            }
        } else {
            this.transitions.set(symbol, new Set([state]));
            return true;
        }
        return false;
    }

    /**
     * Delete a transition from this state to another state.
     * @param {string} symbol - The symbol for the transition.
     * @param {State} state - The state to delete the transition to.
     * @return {boolean} Whether the transition was deleted successfully.
     */
    public deleteTransition(symbol: string, state: State): boolean {
        const states: Set<State> | undefined = this.transitions.get(symbol);
        if (states) {
            if (states.has(state)) {
                states.delete(state);
                return true;
            }
        }
        return false;
    }

    /**
     * Print the transition table for this state.
     */
    public printTransitionTable(): void {
        console.log(`Transition table for state: ${this.name}`);
        this.transitions.forEach((states, symbol) => {
            const stateNames = Array.from(states).map(state => state.name).join(', ');
            console.log(`Symbol: ${symbol}, States: ${stateNames}`);
        });
    }
}