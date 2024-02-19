

export default class State {
    name: string;
    transitions: Map<string, State[]>

    constructor(name: string, transitions: Map<string, State[]>) {
        this.name = name;
        this.transitions = transitions;
    }

    addTransition(symbol: string, state: State): boolean {
        let states: State[] | undefined = this.transitions.get(symbol);
        if (states) {
            if (!states.includes(state)) {
                states.push(state);
                return true
            }
        } else {
            this.transitions.set(symbol, [state]);
            return true
        }
        return false
    }

    deleteTransition(symbol: string, state: State): boolean {
        let states: State[] | undefined = this.transitions.get(symbol);
        if (states) {
            if (states.includes(state)) {
                states.splice(states.findIndex((x: State) => x === state))
                return true;
            }
        }
        return false;
    }

    printTransitionTable(): void {
        console.log(`Transition table for state: ${this.name}`);
        this.transitions.forEach((states, symbol) => {
            let stateNames = states.map(state => state.name).join(', ');
            console.log(`Symbol: ${symbol}, States: ${stateNames}`);
        });
    }
}

