import { DataSet, Network, Node, Edge } from 'vis-network/standalone/esm/vis-network';
import State from "./state";
import NFA from "./nfa";

export const EPSILON: string = 'ε'

export let nodes = new DataSet<Node>();

export let edges = new DataSet<Edge>();

let container = document.getElementById('mynetwork');
let data = {
    nodes: nodes,
    edges: edges
};
let options = {
    nodes: {
        font: {
            size: 14,
            color: 'black'
        },
        borderWidth: 2,
        color: {
            border: '#2B7CE9',
        }
    },
    edges: {
        width: 2,
        color: {
            color: 'black',
            highlight: '#848484'
        },
        arrows: {
            to: {
                enabled: true,
                scaleFactor: 0.5
            }
        },

    },
    physics: {
        enabled: true,
    },
    interaction: {
        hover: true,
        tooltipDelay: 300,
    }

};

export let network = new Network(container, data, options);

export function updateNodeColor(node: any, color: any) {
    const position = network.getPositions([node.id]);
    node.color = color;
    node.x = position[node.id].x;
    node.y = position[node.id].y;
    nodes.update(node);
}

export function createMenuItem(iconClass: string, text: string, onClick: () => void) {
    let item = document.createElement('button');
    item.classList.add('dropdown-item');
    item.innerHTML = `<i class="${iconClass}"></i> ${text}`;
    item.addEventListener('click', onClick);
    return item;
}

