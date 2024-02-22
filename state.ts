const EPSILON: string = 'ε'

export default class State {
    name: string;
    transitions: Map<string, Set<State>>
    settings: {
        startState: boolean;
        acceptState: boolean;
    }

    constructor(name: string, settings: {
        startState: boolean;
        acceptState: boolean;
    } = { startState: false, acceptState: false }) {
        this.name = name;
        this.transitions = new Map();
        this.settings = settings;
    }

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

    public printTransitionTable(): void {
        console.log(`Transition table for state: ${this.name}`);
        this.transitions.forEach((states, symbol) => {
            const stateNames = Array.from(states).map(state => state.name).join(', ');
            console.log(`Symbol: ${symbol}, States: ${stateNames}`);
        });
    }
}