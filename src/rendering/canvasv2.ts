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

// Create a context menu
let contextMenu: any = null;

network.on('oncontext', function (params) {
    params.event.preventDefault();

    if (contextMenu && document.body.contains(contextMenu)) {
        document.body.removeChild(contextMenu);
        contextMenu = null;
    }
    const pointer = network.DOMtoCanvas({ x: params.pointer.DOM.x, y: params.pointer.DOM.y });
    console.log(`Mouse position: (${pointer.x}, ${pointer.y})`); // Log the mouse position

    // Find the node that was right-clicked
    const clickedNodeId = network.getNodeAt(pointer);
    const clickedNode = clickedNodeId !== undefined ? nodes.get(clickedNodeId) : null;

    console.log(`Is there a node at this position? ${clickedNode !== null}`); // Log whether there is a node at this position
    // Create the context menu
    contextMenu = document.createElement('div');
    contextMenu.classList.add('dropdown-menu', 'show'); // Add Bootstrap classes
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

        // Add the "Delete" menu item
        let deleteItem = document.createElement('button');
        deleteItem.classList.add('dropdown-item'); // Add Bootstrap class
        deleteItem.innerHTML = '<i class="bi bi-trash"></i> Delete'; // Add Bootstrap Icon
        deleteItem.addEventListener('click', () => {
            nodes.remove(clickedNodeId);
            document.body.removeChild(contextMenu);
            contextMenu = null;
        });
        contextMenu.appendChild(deleteItem);
    } else {
        // Add the "Add Node" menu item
        // Add the "Add Node" menu item
        let addNodeItem = document.createElement('button');
        addNodeItem.classList.add('dropdown-item'); // Add Bootstrap class
        addNodeItem.innerHTML = '<i class="bi bi-plus-circle"></i> Add Node'; // Add Bootstrap Icon
        addNodeItem.addEventListener('click', () => {
            let nodeId = nodes.length + 1;
            nodes.add({ id: nodeId, label: 'State ' + nodeId, x: pointer.x, y: pointer.y });
            document.body.removeChild(contextMenu);
            contextMenu = null;
        });
        contextMenu.appendChild(addNodeItem);
    }

    // Add the context menu to the body
    document.body.appendChild(contextMenu);
});