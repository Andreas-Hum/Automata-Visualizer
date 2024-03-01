import State from "./state";
import { DataSet, Node, Edge } from 'vis-network/standalone/esm/vis-network';

export default class DFA {
    states: Set<Set<State>>;
    transitions: Map<Set<State>, Map<string, Set<State>>>;
    alphabet: Set<string>;
    startState!: State;
    acceptStates!: Set<Set<State>>;

    constructor(states: Set<Set<State>>, alphabet: Set<string>) {
        this.states = states;
        this.alphabet = alphabet;
        this.transitions = new Map();

        this.setStartState();
        this.setAcceptStates();
    }

    private setStartState(): void {
        const tempStartState: State[] = Array.from(this.states).flatMap((stateSet: Set<State>) =>
            Array.from(stateSet).filter((state: State) => state.settings.startState === true)
        );

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

    private setAcceptStates(): void {
        const tempAcceptStates: Set<State>[] = Array.from(this.states).filter((stateSet: Set<State>) =>
            Array.from(stateSet).some((state: State) => state.settings.acceptState === true)
        );

        // if (tempAcceptStates.length === 0) {
        //     throw new Error("No accept states defined");
        // }

        this.acceptStates = new Set<Set<State>>(tempAcceptStates);
    }

    public addTransition(fromStateSet: Set<State>, inputSymbol: string, toStateSet: Set<State>): void {
        if (!this.transitions.has(fromStateSet)) {
            this.transitions.set(fromStateSet, new Map<string, Set<State>>());
        }
        const transitionMap = this.transitions.get(fromStateSet)!;
        transitionMap.set(inputSymbol, toStateSet);
    }

    public removeTransition(fromStateSet: Set<State>, inputSymbol: string, toStateSet: Set<State>): void {
        if (this.transitions.has(fromStateSet)) {
            const transitionMap = this.transitions.get(fromStateSet)!;
            if (transitionMap.get(inputSymbol) === toStateSet) {
                transitionMap.delete(inputSymbol);
            }
        }
    }

    /**
 * Converts a DFA object to a visual representation of a DFA.
 *
 * @param {DFA} dfa - The DFA object.
 * @returns { { nodes: DataSet<Node>, edges: DataSet<Edge> } } - The nodes and edges of the visual representation.
 */
    public static DFA_to_vis(dfa: DFA): { nodes: DataSet<Node>, edges: DataSet<Edge> } {
        console.log(dfa)
        let nodes = new DataSet<Node>();
        let edges = new DataSet<Edge>();

        let startNodeId: string | undefined;

        // Find the start state
        dfa.states.forEach(stateSet => {
            if (Array.from(stateSet).some(state => state.settings.startState)) {
                startNodeId = Array.from(stateSet)[0].name;
            }
        });

        let stateToIdMap = new Map<Set<State>, string>();
        dfa.states.forEach(stateSet => {
            let stateNames = Array.from(stateSet).map(state => state.name);
            let nodeId = stateNames.join(',');
            let color = Array.from(stateSet).some(state => state.settings.acceptState) ? { background: 'green' } : { background: 'white' };
            let node = {
                id: nodeId,
                label: nodeId,
                color: color,
                physics: true
            };
            nodes.add(node);
            stateToIdMap.set(stateSet, nodeId);
        });
        // Add a special start node
        nodes.add({
            id: 9999, label: '',
            color: { background: 'transparent', border: 'transparent' },
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

        dfa.states.forEach(stateSet => {
            let transitions = dfa.transitions.get(stateSet);
            if (transitions) {
                transitions.forEach((nextStateSet, symbol) => {
                    let fromId = stateToIdMap.get(stateSet);
                    let toId = stateToIdMap.get(nextStateSet);
                    if (fromId && toId) {
                        edges.add({ from: fromId, to: toId, label: symbol });
                    }
                });
            }
        });

        return { nodes: nodes, edges: edges };
    }
}