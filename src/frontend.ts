import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import 'bootstrap-icons/font/bootstrap-icons.css';
import { nodes, edges, network, updateNodeColor, createMenuItem, EPSILON } from './network';
import NFA from './nfa';

// Create a context menu
let contextMenu: any = null;
let pickingTransitionState = false;


function removeContextMenu() {
    if (contextMenu && document.body.contains(contextMenu)) {
        document.body.removeChild(contextMenu);
        contextMenu = null;
    }
}

network.on('oncontext', function (params) {
    if (pickingTransitionState) {
        return;
    }

    params.event.preventDefault();
    removeContextMenu();

    const pointer = network.DOMtoCanvas({ x: params.pointer.DOM.x, y: params.pointer.DOM.y });
    const clickedNodeId = network.getNodeAt({ x: params.pointer.DOM.x, y: params.pointer.DOM.y });
    const clickedNode = clickedNodeId !== undefined ? nodes.get(clickedNodeId) : null;
    const clickedEdgeId = network.getEdgeAt({ x: params.pointer.DOM.x, y: params.pointer.DOM.y });
    const clickedEdge = clickedEdgeId !== undefined ? edges.get(clickedEdgeId) : null;


    contextMenu = document.createElement('div');
    contextMenu.classList.add('dropdown-menu', 'show');
    contextMenu.style.position = 'absolute';
    contextMenu.style.left = `${params.event.clientX}px`;
    contextMenu.style.top = `${params.event.clientY}px`;

    if (clickedNode) {
        contextMenu.appendChild(createMenuItem('bi bi-pencil', 'Change Name', () => {
            const newName = prompt('Enter a new name for the state:', clickedNode.label);
            if (newName !== null) {
                clickedNode.label = newName;
                nodes.update(clickedNode);
            }
            removeContextMenu();
        }));

        contextMenu.appendChild(createMenuItem('bi bi-arrow-right-circle', 'Add Transition', () => {
            pickingTransitionState = true;
            network.once('selectNode', function (params) {
                let transitionLabel = prompt("Enter the transition label:");
                if (transitionLabel !== null) {
                    if (transitionLabel.trim() === "") transitionLabel = EPSILON;

                    const existingEdge = edges.get().find(edge => edge.from === clickedNode.id && edge.to === params.nodes[0]);

                    if (existingEdge) {
                        const existingLabels = existingEdge.label.split(',');
                        if (!existingLabels.includes(transitionLabel)) {
                            existingEdge.label += `,${transitionLabel}`;
                            edges.update(existingEdge);
                        }
                    } else {
                        edges.add({
                            from: clickedNode.id,
                            to: params.nodes[0],
                            arrows: 'to',
                            label: transitionLabel
                        });
                    }
                };
                network.unselectAll();
                pickingTransitionState = false;
            });
            removeContextMenu();
        }));
        contextMenu.appendChild(createMenuItem('bi bi-play-circle', 'Toggle Start State', () => {
            const transparentNodeId = 9999;
            const currentStartNode = nodes.get().find(node => typeof node.color !== 'string' && node.color.background === 'lightblue');
            const transparentNode = nodes.get(transparentNodeId);
            if (transparentNode) {
                nodes.remove(transparentNodeId);
                const edgeFromTransparentNode = edges.get().find(edge => edge.from === transparentNodeId);
                if (edgeFromTransparentNode) {
                    edges.remove(edgeFromTransparentNode.id);
                }
            }
            if (currentStartNode && clickedNode.id === currentStartNode.id) {
                updateNodeColor(currentStartNode, { background: 'white', border: 'black' });
            } else {
                if (currentStartNode) {
                    updateNodeColor(currentStartNode, { background: 'white', border: 'black' });
                }
                nodes.add({
                    id: transparentNodeId,
                    label: '',
                    color: { background: 'transparent', border: 'transparent' },
                    x: clickedNode.x - 50, // Adjust this value to fit your needs
                    y: clickedNode.y,
                    physics: false
                });
                edges.add({
                    from: transparentNodeId,
                    to: clickedNode.id,
                    arrows: 'to',
                    color: 'black',
                    chosen: false,
                    smooth: {
                        enabled: true,
                        type: 'straightCross',
                        roundness: 1  // Adjust this value to fit your needs
                    }
                });
            }
            removeContextMenu();
        }));

        contextMenu.appendChild(createMenuItem('bi bi-check-circle', 'Toggle Accept State', () => {
            let newColor;
            if (typeof clickedNode.color !== 'string' && clickedNode.color.background === 'green') {
                newColor = { background: 'white', border: 'black' };
            } else if (typeof clickedNode.color !== 'string' && clickedNode.color.background === 'lightblue') {
                newColor = { background: 'orange', border: 'black' };
            } else if (typeof clickedNode.color !== 'string' && clickedNode.color.background === 'orange') {
                newColor = { background: 'lightblue', border: 'black' }
            }
            else {
                newColor = { background: 'green', border: 'black' };
            }
            updateNodeColor(clickedNode, newColor);
            removeContextMenu();
        }));


        contextMenu.appendChild(createMenuItem('bi bi-trash', 'Delete', () => {
            // Remove all edges connected to the node
            const connectedEdges = edges.get().filter(edge => edge.from === clickedNodeId || edge.to === clickedNodeId);
            connectedEdges.forEach(edge => edges.remove(edge.id));

            // Remove the node
            nodes.remove(clickedNodeId);

            removeContextMenu();
        }));

    } else if (clickedEdge) {
        contextMenu.appendChild(createMenuItem('bi bi-trash', 'Delete', () => {
            edges.remove(clickedEdgeId);
            removeContextMenu();
        }));
    } else {
        contextMenu.appendChild(createMenuItem('bi bi-plus-circle', 'Add Node', () => {
            let nodeId = nodes.length;
            while (nodes.get(nodeId) !== null) {
                nodeId++;
            }

            nodes.add({ id: nodeId, label: 'q' + nodeId, x: pointer.x, y: pointer.y, color: { background: 'white', border: 'black' }, physics: false });
            removeContextMenu();
        }));
    }

    document.body.appendChild(contextMenu);
});

document.addEventListener('click', function (event) {
    if (contextMenu && !contextMenu.contains(event.target)) {
        removeContextMenu();
    }
});

document.getElementById('toLatex').addEventListener('click', function () {
    console.log(NFA.vis_to_NFA(nodes, edges).NFA_to_latex())
});
let isDragging = false;

network.on('dragStart', function () {
    isDragging = true;
});

network.on('dragEnd', function () {
    isDragging = false;
});

network.on('afterDrawing', function () {
    if (isDragging) {
        nodes.get().forEach(node => {
            const position = network.getPositions([node.id])[node.id];
            if (node.x !== position.x || node.y !== position.y) {
                node.x = position.x;
                node.y = position.y;
                nodes.update(node);
            }
        });

        let transparentNodeId = 9999;
        let transparentNode = nodes.get(transparentNodeId);
        let connectedNodes = network.getConnectedNodes(transparentNodeId);

        let startNodeId = connectedNodes[0];
        //@ts-ignore
        let startNode = nodes.get(startNodeId);

        if (transparentNode && startNode) {
            transparentNode.x = startNode.x - 50; 
            transparentNode.y = startNode.y
            nodes.update(transparentNode);
        }
    }
});

document.getElementById('toLatex').addEventListener('click', function () {
    const latex = NFA.vis_to_NFA(nodes, edges).NFA_to_latex();

    document.getElementById('latexModalBody').innerText = latex;

    //@ts-ignore
    const latexModal = new bootstrap.Modal(document.getElementById('latexModal'));
    latexModal.show();
});


document.getElementById('copyButton').addEventListener('click', function () {
    const latex = document.getElementById('latexModalBody').innerText;
    navigator.clipboard.writeText(latex).then(() => {
        // Change the button text to "Copied!" when the text is successfully copied
        const copyButton = document.getElementById('copyButton');
        copyButton.innerText = "Copied!";
        
        // Change the button text back to "Copy to Clipboard" after 3 seconds
        setTimeout(() => {
            copyButton.innerText = "Copy to Clipboard";
        }, 3000);
    });
});