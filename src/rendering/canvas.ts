import { DataSet, Network, Node, Edge } from 'vis-network/standalone/esm/vis-network';
const EPSILON: string = 'ε'

// create an array with nodes
let nodes = new DataSet<Node>([
    { id: 1, label: 'q0', color: { background: 'lightblue', border: 'black' } }, // Start state
    { id: 2, label: 'q1', color: { background: 'green', border: 'black' } }, // Accept state
    { id: 3, label: 'q2', color: { background: 'white', border: 'black' } },
    { id: 4, label: 'q3', color: { background: 'white', border: 'black' } }
]);

// create an array with edges
let edges = new DataSet<Edge>([
    { from: 1, to: 2, arrows: 'to', label: '0', color: 'black' },
    { from: 2, to: 1, arrows: 'to', label: '1', color: 'black' },
    { from: 2, to: 3, arrows: 'to', label: '0', color: 'black' },
    { from: 3, to: 4, arrows: 'to', label: '1', color: 'black' },
    { from: null, to: 1, arrows: 'to', color: 'black' } // Incoming edge for the start state
]);

// create a network
let container = document.getElementById('mynetwork');
let data = {
    nodes: nodes,
    edges: edges
};
// Set the network options
let options = {
};

let network = new Network(container, data, options);

// Create a context menu
let contextMenu: any = null;
let pickingTransitionState = false;

network.on('oncontext', function (params) {
    if (pickingTransitionState) {
        return;
    }

    params.event.preventDefault();

    if (contextMenu && document.body.contains(contextMenu)) {
        document.body.removeChild(contextMenu);
        contextMenu = null;
    }
    const pointer = network.DOMtoCanvas({ x: params.pointer.DOM.x, y: params.pointer.DOM.y });
    console.log(`Mouse position: (${pointer.x}, ${pointer.y})`);
    let targetNode = null
    // Find the node that was right-clicked
    const clickedNodeId = network.getNodeAt({ x: params.pointer.DOM.x, y: params.pointer.DOM.y });
    const clickedNode = clickedNodeId !== undefined ? nodes.get(clickedNodeId) : null;
    const clickedEdgeId = network.getEdgeAt({ x: params.pointer.DOM.x, y: params.pointer.DOM.y });
    const clickedEdge = clickedEdgeId !== undefined ? edges.get(clickedEdgeId) : null;


    // Create the context menu
    contextMenu = document.createElement('div');
    contextMenu.classList.add('dropdown-menu', 'show');
    contextMenu.style.position = 'absolute';
    contextMenu.style.left = `${params.event.clientX}px`;
    contextMenu.style.top = `${params.event.clientY}px`;


    if (clickedNode) {
        // Add the "Change Name" menu item
        let changeNameItem = document.createElement('button');
        changeNameItem.classList.add('dropdown-item'); // Add Bootstrap class
        changeNameItem.innerHTML = '<i class="bi bi-pencil"></i> Change Name'; // Add Bootstrap Icon
        changeNameItem.addEventListener('click', () => {
            const newName = prompt('Enter a new name for the state:', clickedNode.label);
            if (newName !== null) {
                clickedNode.label = newName;
                nodes.update(clickedNode);
            }
            document.body.removeChild(contextMenu);
            contextMenu = null;
        });
        contextMenu.appendChild(changeNameItem);

        let addTransitionItem = document.createElement('button');
        addTransitionItem.classList.add('dropdown-item'); // Add Bootstrap class
        addTransitionItem.innerHTML = '<i class="bi bi-arrow-right-circle"></i> Add Transition'; // Add Bootstrap Icon
        addTransitionItem.addEventListener('click', () => {
            document.body.removeChild(contextMenu);
            contextMenu = null;

            pickingTransitionState = true;

            network.on('selectNode', function (params) {
                targetNode = params.nodes[0];
                let transitionLabel = prompt("Enter the transition label:");
                if (transitionLabel !== null) {
                    if (transitionLabel.trim() === "") transitionLabel = EPSILON;
                    edges.add({
                        from: clickedNode.id,
                        to: targetNode,
                        arrows: 'to',
                        label: transitionLabel
                    });
                };

                network.off('selectNode');
                network.unselectAll();

                pickingTransitionState = false;
            });
        });
        contextMenu.appendChild(addTransitionItem);
        let toggleStartStateItem = document.createElement('button');
        toggleStartStateItem.classList.add('dropdown-item'); // Add Bootstrap class
        toggleStartStateItem.innerHTML = '<i class="bi bi-play-circle"></i> Toggle Start State';
        toggleStartStateItem.addEventListener('click', () => {
            // Remove the start state from the current start node
            const currentStartNode = nodes.get().find(node => typeof node.color !== 'string' && node.color.background === 'lightblue');
            if (currentStartNode) {
                currentStartNode.color = { background: 'white', border: 'black' };
                nodes.update(currentStartNode);
            }

            // If the clicked node was the start node, don't set a new start node
            if (clickedNode.id !== currentStartNode?.id) {
                // Set the clicked node as the start node
                const startNode = nodes.get(clickedNode.id);
                if (typeof startNode.color !== 'string' && startNode.color.background === 'green') {
                    startNode.color = { background: 'orange', border: 'black' }; // Both start and accept state
                } else if (typeof startNode.color !== 'string' && startNode.color.background === 'orange') {
                    startNode.color = { background: 'green', border: 'black' }
                } else {
                    startNode.color = { background: 'lightblue', border: 'black' }; // Only start state
                }
                nodes.update(startNode);
            }

            document.body.removeChild(contextMenu);
            contextMenu = null;
        });

        contextMenu.appendChild(toggleStartStateItem);

        let toggleAcceptStateItem = document.createElement('button');
        toggleAcceptStateItem.classList.add('dropdown-item'); // Add Bootstrap class
        toggleAcceptStateItem.innerHTML = '<i class="bi bi-check-circle"></i> Toggle Accept State'; // Add Bootstrap Icon
        toggleAcceptStateItem.addEventListener('click', () => {
            // Toggle the accept state of the clicked node
            if (typeof clickedNode.color !== 'string' && clickedNode.color.background === 'green') {
                clickedNode.color = { background: 'white', border: 'black' };
            } else if (typeof clickedNode.color !== 'string' && clickedNode.color.background === 'lightblue') {
                clickedNode.color = { background: 'orange', border: 'black' }; // Both start and accept state
            } else if (typeof clickedNode.color !== 'string' && clickedNode.color.background === 'orange') {
                clickedNode.color = { background: 'lightblue', border: 'black' }
            }
            else {
                clickedNode.color = { background: 'green', border: 'black' };
            }
            nodes.update(clickedNode);

            document.body.removeChild(contextMenu);
            contextMenu = null;
        });
        contextMenu.appendChild(toggleAcceptStateItem);
        let deleteItem = document.createElement('button');
        deleteItem.classList.add('dropdown-item'); // Add Bootstrap class
        deleteItem.innerHTML = '<i class="bi bi-trash"></i> Delete'; // Add Bootstrap Icon
        deleteItem.addEventListener('click', () => {
            nodes.remove(clickedNodeId);
            document.body.removeChild(contextMenu);
            contextMenu = null;
        });
        contextMenu.appendChild(deleteItem);


    } else if (clickedEdge) {
        let deleteItem = document.createElement('button');
        deleteItem.classList.add('dropdown-item'); // Add Bootstrap class
        deleteItem.innerHTML = '<i class="bi bi-trash"></i> Delete'; // Add Bootstrap Icon
        deleteItem.addEventListener('click', () => {
            edges.remove(clickedEdgeId);
            document.body.removeChild(contextMenu);
            contextMenu = null;
        });
        contextMenu.appendChild(deleteItem);
    } else {
        let addNodeItem = document.createElement('button');
        addNodeItem.classList.add('dropdown-item'); // Add Bootstrap class
        addNodeItem.innerHTML = '<i class="bi bi-plus-circle"></i> Add Node';
        addNodeItem.addEventListener('click', () => {
            let nodeId = nodes.length;
            while (nodes.get(nodeId) !== null) {
                nodeId++;
            }

            nodes.add({ id: nodeId, label: 'q' + nodeId, x: pointer.x, y: pointer.y, color: { background: 'white', border: 'black' } });
            document.body.removeChild(contextMenu);
            contextMenu = null;
        });
        contextMenu.appendChild(addNodeItem);
    }

    // Add the context menu to the body
    document.body.appendChild(contextMenu);
});

document.addEventListener('click', function (event) {
    if (contextMenu && !contextMenu.contains(event.target)) {
        if (document.body.contains(contextMenu)) {
            document.body.removeChild(contextMenu);
            contextMenu = null;
        }
    }
});