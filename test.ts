import State from "./state";
import NFA from "./nfa";

// Create states
let state1 = new State("1", { startState: true, acceptState: false });
let state2 = new State("2", { startState: false, acceptState: false });
let state3 = new State("3", { startState: false, acceptState: false });
let state4 = new State("4", { startState: false, acceptState: false });
let state5 = new State("5", { startState: false, acceptState: true });

// Create transitions
state1.addTransition("a", state2);
state3.addTransition("c", state4);

// Create set of states
let states = new Set<State>();
states.add(state1);
states.add(state2);
states.add(state3);
states.add(state4);
states.add(state5);

// Create transitions map
let transitions = new Map<State, Map<string, Set<State>>>();
transitions.set(state1, state1.transitions);
transitions.set(state2, state2.transitions);
transitions.set(state3, state3.transitions);
transitions.set(state4, state4.transitions);
transitions.set(state5, state5.transitions);

// Create alphabet
let alphabet = new Set<string>();
alphabet.add("a");
alphabet.add("b");
alphabet.add("c");
alphabet.add("d");

// Create NFA
let nfa = new NFA(states, transitions, alphabet);

