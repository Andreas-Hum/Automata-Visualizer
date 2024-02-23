import { DataSet, Network, Node, Edge } from 'vis-network/standalone/esm/vis-network';

// create an array with nodes
let nodes = new DataSet<Node>([
    { id: 1, label: 'State 1' },
    { id: 2, label: 'State 2' },
    { id: 3, label: 'State 3' },
    { id: 4, label: 'State 4' }
]);

// create an array with edges
let edges = new DataSet<Edge>([
    { from: 1, to: 2, arrows: 'to', label: '0' },
    { from: 2, to: 1, arrows: 'to', label: '1' },
    { from: 2, to: 3, arrows: 'to', label: '0' },
    { from: 3, to: 4, arrows: 'to', label: '1' }
]);

// create a network
let container = document.getElementById('mynetwork');
let data = {
    nodes: nodes,
    edges: edges
};
let options = {};
let network = new Network(container, data, options);