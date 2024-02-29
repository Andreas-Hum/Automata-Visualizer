import { DataSet, Node, Edge } from 'vis-network/standalone/esm/vis-network';

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
            // throw new Error("No start state defined");
            case 1:
                this.startState = tempStartState[0];
                break;
            default:
            // throw new Error("Can't have more than one start state defined");
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

        // if (tempAcceptStates.length === 0) {
        //     throw new Error("No accept states defined");
        // }

        this.acceptStates = new Set<State>(tempAcceptStates);
    }

    public addTransition(fromState: State, inputSymbol: string, toState: State): void {
        if (!this.transitions.has(fromState)) {
            this.transitions.set(fromState, new Map<string, Set<State>>());
        }
        const transitionMap = this.transitions.get(fromState)!;
        if (!transitionMap.has(inputSymbol)) {
            transitionMap.set(inputSymbol, new Set<State>());
        }
        transitionMap.get(inputSymbol)!.add(toState);

        // Also add the transition to the fromState
        fromState.addTransition(inputSymbol, toState);
    }

    public removeTransition(fromState: State, inputSymbol: string, toState: State): void {
        if (this.transitions.has(fromState)) {
            const transitionMap = this.transitions.get(fromState)!;
            if (transitionMap.has(inputSymbol)) {
                transitionMap.get(inputSymbol)!.delete(toState);
                if (transitionMap.get(inputSymbol)!.size === 0) {
                    transitionMap.delete(inputSymbol);
                }

                // Also remove the transition from the fromState
                fromState.deleteTransition(inputSymbol, toState);
            }
        }
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


    // -> methods for finding things <- //


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

            const transitions: Map<string, Set<State>> | undefined = this.transitions.get(state);
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

        return new Set<State>(unreachableStates);

    }



    /**
     * Removes all epsilon transitions from the NFA.
     * 
     * This method implements the epsilon-closure method for removing epsilon transitions.
     * It iteratively finds all epsilon transitions and for each one:
     * - Duplicates all transitions from the target state of the epsilon transition to start from the source state.
     * - Deletes the epsilon transition.
     * - If the target state is an accept state, it also makes the source state an accept state.
     * 
     * This process is repeated until there are no more epsilon transitions.
     */
    public removeEpsilonTransitions(): void {
        let epsilonTransitions = this.getEpsilonTransitions();

        while (epsilonTransitions.length > 0) {
            for (const [sourceState, targetState] of epsilonTransitions) {
                const targetTransitions = targetState.transitions;

                if (targetTransitions) {
                    for (const [inputSymbol, nextStateSet] of targetTransitions.entries()) {
                        if (inputSymbol !== EPSILON) {
                            let sourceTransitions = this.transitions.get(sourceState);
                            if (sourceTransitions) {
                                let nextStateSetForSymbol = sourceTransitions.get(inputSymbol);
                                if (nextStateSetForSymbol) {
                                    nextStateSetForSymbol = new Set([...nextStateSetForSymbol, ...nextStateSet]);
                                } else {
                                    nextStateSetForSymbol = nextStateSet;
                                }
                                sourceTransitions.set(inputSymbol, nextStateSetForSymbol);
                            }

                            // Add the transition to the source state's transition map as well
                            for (const nextState of nextStateSet) {
                                sourceState.addTransition(inputSymbol, nextState);
                            }
                        }
                    }
                }

                if (this.acceptStates.has(targetState)) {
                    this.acceptStates.add(sourceState);
                    sourceState.settings.acceptState = true;
                }

                // Delete the epsilon transition directly from the source state
                sourceState.deleteTransition(EPSILON, targetState);
                let sourceTransitions = this.transitions.get(sourceState);
                if (sourceTransitions) {
                    sourceTransitions.delete(EPSILON);
                }
            }

            epsilonTransitions = this.getEpsilonTransitions();
        }

        this.alphabet.delete(EPSILON);
        this.removeUnreachableStates();
        this.mergeEquivalentStates()
    }


    /**
     * Returns all epsilon transitions in the NFA.
     * 
     * @returns {[State, State][]} An array of pairs of states with an epsilon transition from the first to the second state.
     */
    private getEpsilonTransitions(): [State, State][] {
        const epsilonTransitions: [State, State][] = [];

        for (const [state, transitionMap] of this.transitions) {
            const epsilonTransitionsFromState: Set<State> | undefined = transitionMap.get('ε');
            if (epsilonTransitionsFromState) {
                for (const nextState of epsilonTransitionsFromState) {
                    epsilonTransitions.push([state, nextState]);
                }
            }
        }

        return epsilonTransitions;
    }

    /**
     * Finds and returns an array of dead states in the NFA.
     * A state is considered dead if it is not an accept state and there are no transitions leading to an accept state.
     * 
     * @returns {State[]} An array of dead states.
     */
    public findDeadStates(): State[] {
        const deadStates: Set<State> = new Set<State>();

        for (const state of this.states) {
            const visited: Set<State> = new Set<State>();
            const stack: State[] = [state];

            let isDeadState = true;

            while (stack.length > 0) {
                const currentState: State = stack.pop()!;
                visited.add(currentState);

                if (this.acceptStates.has(currentState)) {
                    isDeadState = false;
                    break;
                }

                const transitions: Map<string, Set<State>> | undefined = this.transitions.get(currentState);
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

            if (isDeadState) {
                deadStates.add(state);
            }
        }

        return [...deadStates];
    }



    // -> REMOVAL <- //

    /**
     * Removes dead states from the NFA.
     * A state is considered dead if it is not an accept state and there are no transitions leading to an accept state.
     */
    public removeDeadStates(): void {
        const deadStates = this.findDeadStates();

        // Remove dead states from the set of states
        deadStates.forEach(deadState => {
            this.states.delete(deadState);
        });

        // Remove transitions to and from dead states
        this.transitions.forEach((transitionMap, state) => {
            if (deadStates.includes(state)) {
                // Remove all transitions from a dead state
                this.transitions.delete(state);
            } else {
                // Remove all transitions to a dead state
                transitionMap.forEach((nextStates, symbol) => {
                    nextStates = new Set([...nextStates].filter(nextState => !deadStates.includes(nextState)));
                    transitionMap.set(symbol, nextStates);
                });
            }
        });
    }


    /**
     * Removes unreachable states from the NFA.
     * A state is considered unreachable if there are no transitions leading to it from the start state.
     */
    public removeUnreachableStates(): void {
        const unreachableStates = this.findUnreachableStates();

        // Remove unreachable states from the set of states
        unreachableStates.forEach(state => {
            this.states.delete(state);
            this.acceptStates.delete(state)
        });

        // Remove transitions to and from unreachable states
        this.transitions.forEach((transitionMap, state) => {
            if (unreachableStates.has(state)) {
                // Remove all transitions from an unreachable state
                this.transitions.delete(state);
            } else {
                // Remove all transitions to an unreachable state
                transitionMap.forEach((nextStates, symbol) => {
                    nextStates = new Set([...nextStates].filter(nextState => !unreachableStates.has(nextState)));
                    transitionMap.set(symbol, nextStates);
                });
            }
        });
    }





    // -> CONVERSIONS <- //

    /**
     * Converts a visual representation of a NFA to an NFA object.
     *
     * @static
     * @param {DataSet<Node>} nodes - The nodes of the visual representation.
     * @param {DataSet<Edge>} edges - The edges of the visual representation.
     * @returns {NFA} - The NFA object.
     */
    public static vis_to_NFA(nodes: DataSet<Node>, edges: DataSet<Edge>): NFA {
        let states = new Set<State>();
        let alphabet = new Set<string>();
        let startNodeLabel: string | undefined;

        // Find the start node
        edges.forEach(edge => {
            if (edge.from === 9999) {
                startNodeLabel = nodes.get(edge.to)?.label;
            }
        });

        nodes.forEach(node => {
            if (node.id !== 9999) {
                let settings = {
                    startState: node.label === startNodeLabel,
                    acceptState: typeof node.color !== 'string' && (node.color.background === 'green' || node.color.background === 'orange')
                };
                let state = new State(node.label, settings);
                state.x = node.x
                state.y = node.y
                states.add(state);
            }
        });

        edges.forEach(edge => {
            if (edge.from !== 9999 && edge.to !== 9999) {
                let fromState = Array.from(states).find(state => state.name === nodes.get(edge.from).label);
                let toState = Array.from(states).find(state => state.name === nodes.get(edge.to).label);
                if (fromState && toState) {
                    if (edge.label.includes(',')) {
                        let labels = edge.label.split(',');
                        labels.forEach(label => {
                            fromState.addTransition(label, toState);
                            if (!alphabet.has(label)) {
                                alphabet.add(label);
                            }
                        });
                    } else {
                        fromState.addTransition(edge.label, toState);
                        if (!alphabet.has(edge.label)) {
                            alphabet.add(edge.label);
                        }
                    }
                }
            }
        });

        return new NFA(states, alphabet);
    }

    /**
     * Converts an NFA object to a visual representation of a NFA.
     *
     * @param {NFA} nfa - The NFA object.
     * @returns { { nodes: DataSet<Node>, edges: DataSet<Edge> } } - The nodes and edges of the visual representation.
     */
    public static NFA_to_vis(nfa: NFA): { nodes: DataSet<Node>, edges: DataSet<Edge> } {
        let nodes = new DataSet<Node>();
        let edges = new DataSet<Edge>();

        let startNodeId: string | undefined;

        // Find the start state
        nfa.states.forEach(state => {
            if (state.settings.startState) {
                startNodeId = state.name;
            }
        });

        nfa.states.forEach(state => {
            let color = state.settings.acceptState ? { background: 'green' } : { background: 'white' };
            let node = {
                id: state.name,
                label: state.name,
                color: color,
                x: state.x,
                y: state.y,
                physics: false
            };
            nodes.add(node);
        });

        // Add a special start node
        nodes.add({
            id: 9999, label: '',
            color: { background: 'transparent', border: 'transparent' },
            x: nfa.startState.x - 50,
            y: nfa.startState.y,
            physics: false,
            fixed: true,
            chosen: false
        });

        // Add an edge from the special start node to the start state
        if (startNodeId) {
            edges.add({
                from: 9999, to: startNodeId, label: '', arrows: 'to',
                color: 'black',
                chosen: false,
                smooth: {
                    enabled: true,
                    type: 'straightCross',
                    roundness: 1
                }
            });
        }

        nfa.states.forEach(state => {
            let transitions = nfa.transitions.get(state);
            if (transitions) {
                transitions.forEach((nextStates, symbol) => {
                    nextStates.forEach(nextState => {
                        edges.add({ from: state.name, to: nextState.name, label: symbol });
                    });
                });
            }
        });

        return { nodes: nodes, edges: edges };
    }



    /**
     * Generates a LaTeX representation of the transition table for the NFA.
     *
     * The table has one row for each state and one column for each symbol in the alphabet.
     * The first column contains the state names.
     * The following columns contain the transitions for each symbol in the alphabet.
     * The last column contains the transitions for the epsilon symbol.
     *
     * Each cell in the table contains a comma-separated list of the names of the states
     * that the current state transitions to with the corresponding symbol.
     *
     * @returns A string containing the LaTeX code for the transition table.
     */
    public transition_table_latex(): string {
        let filteredAlphabet = Array.from(this.alphabet).filter(symbol => symbol !== EPSILON);
        let latex = "\\begin{tabular}{|c|" + "|c".repeat(filteredAlphabet.length + 1) + "|}\\hline\n";
        latex += " & " + filteredAlphabet.join(' & ') + " & \$\\varepsilon\$\\\\\\hline\n";

        this.states.forEach(state => {
            let row = [state.name];
            filteredAlphabet.forEach(symbol => {
                const nextStateSet = state.transitions.get(symbol);
                row.push(nextStateSet ? Array.from(nextStateSet, s => s.name).join(', ') : '');
            });
            const epsilonTransitions = state.transitions.get(EPSILON) || new Set();
            row.push(Array.from(epsilonTransitions, s => s.name).join(', '));
            latex += row.join(' & ') + "\\\\\\hline\n";
        });

        latex += "\\end{tabular}\n";
        return latex;
    }

    /**
     * Generates a LaTeX representation of the NFA using the tikz package.
     *
     * The generated code includes a tikzpicture environment with one node for each state
     * and one path for each transition. The start state is marked as initial and the accept states
     * are marked as accepting.
     *
     * @returns A string containing the LaTeX code for the NFA.
     */
    public NFA_to_latex(): string {
        let latex: string = "\\begin{tikzpicture}[shorten >=1pt,node distance=2cm,on grid,auto]\n";
        let statesArray: State[] = Array.from(this.states);
        let edges: Map<string, string> = new Map<string, string>();

        statesArray.sort((a: State, b: State) => a === this.startState ? -1 : b === this.startState ? 1 : 0);

        let incomingConnections: Map<State, number> = new Map<State, number>();
        statesArray.forEach((state: State) => {
            state.transitions.forEach((nextStates: Set<State>) => {
                nextStates.forEach((nextState: State) => {
                    if (!incomingConnections.has(nextState)) {
                        incomingConnections.set(nextState, 0);
                    }
                    incomingConnections.set(nextState, incomingConnections.get(nextState)! + 1);
                });
            });
        });

        let scale: number = 30;
        statesArray.forEach((state: State, index: number) => {
            let attributes: string = `state${state === this.startState ? ',initial' : ''}${this.acceptStates.has(state) ? ',accepting' : ''}`;
            let position: string = `at (${state.x / scale}, ${-state.y / scale})`;

            latex += `   \\node[${attributes}] (q_${index}) ${position} {${state.name}};\n`;
        });

        let path: string = "   \\path[->]\n";
        for (let fromIndex: number = 0; fromIndex < statesArray.length; fromIndex++) {
            let state: State = statesArray[fromIndex];
            let mergedTransitions: Map<State, Set<string>> = new Map<State, Set<string>>();

            state.transitions.forEach((nextStates: Set<State>, symbol: string) => {
                nextStates.forEach((nextState: State) => {
                    if (!mergedTransitions.has(nextState)) {
                        mergedTransitions.set(nextState, new Set());
                    }
                    mergedTransitions.get(nextState)?.add(symbol);
                });
            });

            mergedTransitions.forEach((symbols: Set<string>, nextState: State) => {
                let toIndex: number = statesArray.indexOf(nextState);
                let edge: string = `q_${fromIndex} to q_${toIndex}`;
                let reverseEdge: string = `q_${toIndex} to q_${fromIndex}`;
                let bend: string = "";
                if (fromIndex === toIndex) {
                    bend = "loop above";
                } else if (edges.has(reverseEdge)) {
                    bend = "bend left";
                    edges.set(reverseEdge, "bend left");
                } else {
                    edges.set(edge, bend);
                }
                let symbolLabel: string = Array.from(symbols).join(',').replace(EPSILON, '$\\varepsilon$');
                path += `   (q_${fromIndex}) edge [${bend}] node {${symbolLabel}} (q_${toIndex})\n`;
            });
        }

        let updatedPath: string = "";
        let lines: string[] = path.split('\n');
        for (let line of lines) {
            let match: RegExpMatchArray | null = line.match(/\(q_(\d+)\) edge \[\] node \{(.+?)\} \(q_(\d+)\)/);
            if (match) {
                let fromIndex: number = parseInt(match[1]);
                let toIndex: number = parseInt(match[3]);
                let edge: string = `q_${fromIndex} to q_${toIndex}`;
                let bend: string | undefined = edges.get(edge) || "";
                updatedPath += `   (q_${fromIndex}) edge [${bend}] node {${match[2]}} (q_${toIndex})\n`;
            } else {
                updatedPath += line + '\n';
            }
        }
        latex += updatedPath + ";\n";
        latex += "\\end{tikzpicture}\n";
        return latex;
    }

    /**
     * Converts the NFA to a DOT language representation.
     * 
     * The DOT language is a plain text graph description language.
     * It is a simple way of describing graphs that both humans and computer programs can use.
     * 
     * This method assumes that the NFA is represented as a class with states, startState, and acceptStates properties.
     * 
     * @returns {string} A string in the DOT language that represents the NFA.
     */
    public NFA_to_dot(): string {
        let dot = "digraph {\n";
        dot += "  rankdir=LR;\n";
        dot += "  node [shape = point ]; qi\n";
        dot += `  node [shape = doublecircle]; ${Array.from(this.acceptStates, state => `"${state.name}"`).join(' ')};\n`;
        dot += "  node [shape = circle];\n";
        dot += `  qi -> "${this.startState.name}";\n`;
        for (let state of this.states) {
            for (let [symbol, nextStates] of state.transitions) {
                for (let nextState of nextStates) {
                    dot += `  "${state.name}" -> "${nextState.name}" [ label = "${symbol}" ];\n`;
                }
            }
        }
        for (let state of this.states) {
            dot += `  "${state.name}" [pos="${state.x / 100},${state.y / 100}!"];\n`;
        }
        dot += "}";
        return dot;
    }

    /**
     * Merges equivalent states in the NFA.
     * Two states are considered equivalent if they are both accept states or both non-accept states,
     * and they have the same transitions.
     */
    public mergeEquivalentStates(): void {
        let states = Array.from(this.states);
        for (let i = 0; i < states.length; i++) {
            for (let j = i + 1; j < states.length; j++) {
                if (this.areEquivalent(states[i], states[j])) {
                    this.mergeStates(states[i], states[j]);
                    states.splice(j, 1);
                    j--;
                }
            }
        }
    }

    /**
     * Checks if two states are equivalent.
     * @param {State} state1 - The first state.
     * @param {State} state2 - The second state.
     * @returns {boolean} True if the states are equivalent, false otherwise.
     */
    private areEquivalent(state1: State, state2: State): boolean {
        if (state1.settings.acceptState !== state2.settings.acceptState) {
            return false;
        }

        let transitions1 = Array.from(state1.transitions.entries());
        let transitions2 = Array.from(state2.transitions.entries());

        if (transitions1.length !== transitions2.length) {
            return false;
        }

        for (let i = 0; i < transitions1.length; i++) {
            if (transitions1[i][0] !== transitions2[i][0] ||
                !this.areSetsEqual(transitions1[i][1], transitions2[i][1])) {
                return false;
            }
        }

        return true;
    }

    /**
     * Checks if two sets of states are equal.
     * @param {Set<State>} set1 - The first set of states.
     * @param {Set<State>} set2 - The second set of states.
     * @returns {boolean} True if the sets are equal, false otherwise.
     */
    private areSetsEqual(set1: Set<State>, set2: Set<State>): boolean {
        if (set1.size !== set2.size) {
            return false;
        }

        for (let item of set1) {
            if (!set2.has(item)) {
                return false;
            }
        }

        return true;
    }

    /**
     * Merges two states by replacing all transitions to the second state with transitions to the first state.
     * @param {State} state1 - The state to keep.
     * @param {State} state2 - The state to merge into the first state.
     */
    private mergeStates(state1: State, state2: State): void {
        for (let [state, transitions] of this.transitions) {
            for (let [symbol, nextStateSet] of transitions) {
                if (nextStateSet.has(state2)) {
                    nextStateSet.delete(state2);
                    nextStateSet.add(state1);
                    state.addTransition(symbol, state1);
                    state.deleteTransition(symbol, state2);
                }
            }
        }

        this.states.delete(state2);
        if (this.acceptStates.has(state2)) {
            this.acceptStates.delete(state2);
        }
    }

}