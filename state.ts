export default class State {
    name: string;
    transitions: Map<string, Set<State>>

    constructor(name: string) {
        this.name = name;
        this.transitions = new Map();
    }

    addTransition(symbol: string, state: State): boolean {
        let states: Set<State> | undefined = this.transitions.get(symbol);
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

    deleteTransition(symbol: string, state: State): boolean {
        let states: Set<State> | undefined = this.transitions.get(symbol);
        if (states) {
            if (states.has(state)) {
                states.delete(state);
                return true;
            }
        }
        return false;
    }

    printTransitionTable(): void {
        console.log(`Transition table for state: ${this.name}`);
        this.transitions.forEach((states, symbol) => {
            let stateNames = Array.from(states).map(state => state.name).join(', ');
            console.log(`Symbol: ${symbol}, States: ${stateNames}`);
        });
    }
}