import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import 'bootstrap-icons/font/bootstrap-icons.css';
import { nodes, edges, network, updateNodeColor, createMenuItem, EPSILON } from './network';
import NFA from './nfa';
import { instance } from "@viz-js/viz";


let contextMenu: any = null;
let pickingTransitionState = false;

function updateStates(states: string[]) {
    const statesElement = document.getElementById('NFAstates');
    if (statesElement) {
        statesElement.innerText = `{${states.join(', ')}}`;
    }
}


function updateAlphabet(alphabet: string[]) {
    const uniqueAlphabet = Array.from(new Set(alphabet));
    const alphabetElement = document.getElementById('NFAalphabet');
    if (alphabetElement) {
        alphabetElement.innerText = `{${uniqueAlphabet.join(', ')}}`;
    }
}

function updateStartState(startState: string) {
    const startStateElement = document.getElementById('NFAstartState');
    if (startStateElement) {
        startStateElement.innerText = startState;
    }
}

function updateTransitionSet() {
    const transitionSetElement = document.getElementById('NFtransitionSet');
    if (transitionSetElement) {
        const transitions = edges.get().flatMap(edge => {
            const fromNode = nodes.get(edge.from);
            const toNode = nodes.get(edge.to);
            if (fromNode.label && toNode.label) {
                return edge.label.split(',').map(input => `((${fromNode.label}, ${input}) -> ${toNode.label})`);
            }
            return [];
        });
        transitionSetElement.innerText = `{${transitions.join(', ')}}`;
    }
}

function updateAcceptStates(acceptStates: string[]) {
    const acceptStatesElement = document.getElementById('NFAacceptStates');
    if (acceptStatesElement) {
        acceptStatesElement.innerText = `{${acceptStates.join(', ')}}`;
    }
}


function updateTransitionTable() {
    const transitionTableElement = document.getElementById('NFAtable');
    if (transitionTableElement) {
        const alphabet = getAlphabet();
        const nodeLabels = nodes.get().filter(node => node.label).map(node => node.label);
        let tableHtml = '<thead><tr><th>State</th>' + alphabet.map(symbol => `<th>${symbol}</th>`).join('') + '</tr></thead><tbody>';

        nodeLabels.forEach(fromLabel => {
            tableHtml += `<tr><td>${fromLabel}</td>`;
            alphabet.forEach(symbol => {
                const toLabels = edges.get().filter(edge => nodes.get(edge.from).label === fromLabel && edge.label.split(',').includes(symbol)).map(edge => nodes.get(edge.to).label);
                const uniqueToLabels = [...new Set(toLabels)]; // Remove duplicates
                tableHtml += `<td>${uniqueToLabels.join(', ')}</td>`;
            });
            tableHtml += '</tr>';
        });

        tableHtml += '</tbody>';
        transitionTableElement.innerHTML = tableHtml;
    }
}

function getAlphabet() {
    const labels = edges.get().flatMap(edge => edge.label ? edge.label.split(',') : []);
    return [...new Set(labels)];
}

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
                updateStates(nodes.get().map(node => node.label))
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

                    updateTransitionSet();
                    updateTransitionTable()

                    const deadStates = NFA.vis_to_NFA(nodes, edges).findDeadStates();
                    grayOutNodes(deadStates.map(state => state.name))
                };
                network.unselectAll();
                pickingTransitionState = false;
                updateAlphabet(edges.get().flatMap(edge => edge.label ? edge.label.split(',') : []));
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
                updateStartState('')
                nodes.remove(transparentNodeId);
                const edgeFromTransparentNode = edges.get().find(edge => edge.from === transparentNodeId);
                if (edgeFromTransparentNode) {
                    edges.remove(edgeFromTransparentNode.id);
                }
            } else {
                if (currentStartNode) {
                    updateNodeColor(currentStartNode, { background: 'white', border: 'black' });
                }
                nodes.add({
                    id: transparentNodeId,
                    label: '',
                    color: { background: 'transparent', border: 'transparent' },
                    x: clickedNode.x - 50,
                    y: clickedNode.y,
                    physics: false,
                    fixed: true,
                    chosen: false
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
                        roundness: 1
                    }
                });

                updateStartState(clickedNode.label)
                const deadStates = NFA.vis_to_NFA(nodes, edges).findDeadStates();
                grayOutNodes(deadStates.map(state => state.name))
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
            const acceptStates = nodes.get().filter(node => typeof node.color !== 'string' && node.color.background === 'green').map(node => node.label);
            updateAcceptStates(acceptStates);
            const deadStates = NFA.vis_to_NFA(nodes, edges).findDeadStates();
            grayOutNodes(deadStates.map(state => state.name))
            removeContextMenu();
        }));

        contextMenu.appendChild(createMenuItem('bi bi-trash', 'Delete', () => {
            // Remove all edges connected to the node
            const connectedEdges = edges.get().filter(edge => edge.from === clickedNodeId || edge.to === clickedNodeId);
            connectedEdges.forEach(edge => edges.remove(edge.id));

            // Remove the node
            nodes.remove(clickedNodeId);
            updateStates(nodes.get().map(node => node.label))
            updateTransitionSet();
            updateTransitionTable()
            const deadStates = NFA.vis_to_NFA(nodes, edges).findDeadStates();
            grayOutNodes(deadStates.map(state => state.name))
            removeContextMenu();
            if (nodes.length === 0) {
                document.getElementById('nfa-reset')?.setAttribute('disabled', 'true');
            }

        }));

    } else if (clickedEdge) {
        contextMenu.appendChild(createMenuItem('bi bi-trash', 'Delete', () => {
            edges.remove(clickedEdgeId);
            const edgeLabels = edges.get();
            if (edgeLabels) {
                updateAlphabet(edgeLabels.flatMap(edge => edge.label ? edge.label.split(',') : []));
            } else {
                updateAlphabet([]);
            }
            updateTransitionTable()
            updateTransitionSet();
            const deadStates = NFA.vis_to_NFA(nodes, edges).findDeadStates();
            grayOutNodes(deadStates.map(state => state.name))
            removeContextMenu();
        }));
    } else {
        contextMenu.appendChild(createMenuItem('bi bi-plus-circle', 'Add Node', () => {
            let nodeId = nodes.length;
            while (nodes.get(nodeId) !== null) {
                nodeId++;
            }

            nodes.add({ id: nodeId, label: 'q' + nodeId, x: pointer.x, y: pointer.y, color: { background: 'white', border: 'black' }, physics: false });
            updateStates(nodes.get().map(node => node.label));
            if (nodes.length !== 0) {
                document.getElementById('nfa-reset')?.removeAttribute('disabled');
            }
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


document.getElementById('copyButton').addEventListener('click', function () {
    const latex = document.getElementById('latexModalBody').innerText;
    navigator.clipboard.writeText(latex).then(() => {

        const copyButton = document.getElementById('copyButton');
        copyButton.innerText = "Copied!";

        setTimeout(() => {
            copyButton.innerText = "Copy to Clipboard";
        }, 3000);
    });
});



document.getElementById('copyButtonDot').addEventListener('click', function () {
    const dot = document.getElementById('dotModalBody').innerText;
    navigator.clipboard.writeText(dot).then(() => {

        const copyButton = document.getElementById('copyButtonDot');
        copyButton.innerText = "Copied!";

        setTimeout(() => {
            copyButton.innerText = "Copy to Clipboard";
        }, 3000);
    });
});
document.getElementById('copyButtonSVG').addEventListener('click', function () {
    const img = document.querySelector('#image-body img');
    if (!img) {
        console.error('No image found to copy');
        return;
    }

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const imgLoad = new Image();

    imgLoad.onload = function () {
        canvas.width = imgLoad.width;
        canvas.height = imgLoad.height;
        ctx.drawImage(imgLoad, 0, 0, imgLoad.width, imgLoad.height);
        canvas.toBlob(function (blob) {
            const item = new ClipboardItem({ 'image/png': blob });
            navigator.clipboard.write([item]).then(() => {
                console.log('Image copied to clipboard');
            }).catch(err => {
                console.error('Failed to copy image: ', err);
            });
        }, 'image/png');
    };

    //@ts-ignore
    imgLoad.src = img.src;
});
document.getElementById('toImage').addEventListener('click', function () {
    let nfa = NFA.vis_to_NFA(nodes, edges);

    // Check the state of the checkboxes
    //@ts-ignore
    const includeDeadStates = document.getElementById('includeDeadStates').checked;
    //@ts-ignore
    const includeUnreachableStates = document.getElementById('includeUnreachableStates').checked;

    // Modify the NFA based on the checkboxes
    if (!includeDeadStates) {
        nfa.removeDeadStates();
    }
    if (!includeUnreachableStates) {
        nfa.removeUnreachableStates();
    }

    const dot = nfa.NFA_to_dot();
    instance().then(viz => {
        const imageBody = document.querySelector("#image-body");
        imageBody.innerHTML = '';

        const svgElement = viz.renderSVGElement(dot);

        const img = new Image();

        const svgData = new XMLSerializer().serializeToString(svgElement);
        const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(blob);

        img.src = url;

        imageBody.appendChild(img);

        document.getElementById('latexModal').classList.add('d-none');
        document.getElementById('dotModal').classList.add('d-none');
        document.getElementById('image-modal').classList.remove('d-none');
    });
});

document.getElementById('toLatex').addEventListener('click', function () {
    let nfa = NFA.vis_to_NFA(nodes, edges);

    // Check the state of the checkboxes
    //@ts-ignore
    const includeDeadStates = document.getElementById('includeDeadStates').checked;
    //@ts-ignore
    const includeUnreachableStates = document.getElementById('includeUnreachableStates').checked;

    // Modify the NFA based on the checkboxes
    if (!includeDeadStates) {
        nfa.removeDeadStates();
    }
    if (!includeUnreachableStates) {
        nfa.removeUnreachableStates();
    }

    let latex = nfa.NFA_to_latex()

    document.getElementById('latexModalBody').innerText = latex

    document.getElementById('latexModal').classList.remove('d-none');
    document.getElementById('dotModal').classList.add('d-none');
    document.getElementById('image-modal').classList.add('d-none');
});

document.getElementById('toDot').addEventListener('click', function () {
    let nfa = NFA.vis_to_NFA(nodes, edges);

    // Check the state of the checkboxes
    //@ts-ignore
    const includeDeadStates = document.getElementById('includeDeadStates').checked;
    //@ts-ignore
    const includeUnreachableStates = document.getElementById('includeUnreachableStates').checked;

    // Modify the NFA based on the checkboxes
    if (!includeDeadStates) {
        nfa.removeDeadStates();
    }
    if (!includeUnreachableStates) {
        nfa.removeUnreachableStates();
    }

    let dot = nfa.NFA_to_dot()
    document.getElementById('dotModalBody').innerText = dot;

    document.getElementById('latexModal').classList.add('d-none');
    document.getElementById('dotModal').classList.remove('d-none');
    document.getElementById('image-modal').classList.add('d-none');
});

document.querySelectorAll('.closebtn, .close').forEach(function (button) {
    button.addEventListener('click', function () {
        // Remove the 'modal-open' class from the body
        document.body.classList.remove('modal-open');
        // Reset the modal content
        document.getElementById('latexModal').classList.add('d-none');
        document.getElementById('dotModal').classList.add('d-none');
        document.getElementById('image-modal').classList.add('d-none');
        // Delay the backdrop hiding until after the modal has been fully hidden
        setTimeout(function () {
            // Hide the modal backdrop
            const backdrop = document.querySelector('.modal-backdrop');
            if (backdrop) {
                //@ts-ignore
                backdrop.style.display = 'none';
            }
        }, 0);
    });
});

var myModal = document.getElementById('exportModal')

myModal.addEventListener('hide.bs.modal', function (event) {
    // Do something when the modal is closed
    console.log('Modal has been closed');
});

document.getElementById('nfa-reset')?.addEventListener('click', () => {
    nodes.clear();
    edges.clear();

    document.getElementById('nfa-reset')?.setAttribute('disabled', 'true');

    updateStartState('')
    updateAlphabet([""]);
    updateStates(nodes.get().map(node => node.label))
    updateAcceptStates([""])
    updateTransitionSet();
    updateTransitionTable()
});




document.getElementById('preset-1')?.addEventListener('click', () => {

    nodes.clear();
    edges.clear();

    const startX = 0;
    const startY = 0;
    const nodeDistance = 100;

    nodes.add([
        { id: 1, label: 'q0', x: startX, y: startY, color: { background: 'white', border: 'black' }, physics: false },
        { id: 2, label: 'q1', x: startX + nodeDistance, y: startY, color: { background: 'green', border: 'black' }, physics: false },
        { id: 3, label: 'q2', x: startX + 2 * nodeDistance, y: startY, color: { background: 'white', border: 'black' }, physics: false },
        { id: 4, label: 'q3', x: startX + 3 * nodeDistance, y: startY, color: { background: 'white', border: 'black' }, physics: false },
    ]);
    edges.add([
        { from: 1, to: 2, label: 'a' },
        { from: 2, to: 3, label: 'b' },
        { from: 3, to: 4, label: 'c' },
    ]);

    const transparentNodeId = 9999;
    nodes.add({
        id: transparentNodeId,
        label: '',
        color: { background: 'transparent', border: 'transparent' },
        x: startX - 50,
        y: startY,
        physics: false,
        fixed: true,
        chosen: false
    });
    edges.add({
        from: transparentNodeId,
        to: 1,
        arrows: 'to',
        color: 'black',
        chosen: false,
        smooth: {
            enabled: true,
            type: 'straightCross',
            roundness: 1
        }
    });


    document.getElementById('nfa-reset')?.removeAttribute('disabled');
    updateStartState('q0')
    updateAlphabet(["a", "b", "c"]);
    updateStates(nodes.get().map(node => node.label))
    updateAcceptStates(["q1"])
    updateTransitionSet();
    updateTransitionTable()
});


document.getElementById('preset-2')?.addEventListener('click', () => {
    nodes.clear();
    edges.clear();

    const startX = 0;
    const startY = 0;
    const nodeDistance = 100;


    nodes.add([
        { id: 1, label: 'q0', x: startX, y: startY, color: { background: 'white', border: 'black' }, physics: false },
        { id: 2, label: 'q1', x: startX + nodeDistance, y: startY + nodeDistance, color: { background: 'green', border: 'black' }, physics: false },
        { id: 3, label: 'q2', x: startX + 2 * nodeDistance, y: startY - nodeDistance, color: { background: 'white', border: 'black' }, physics: false },
        { id: 4, label: 'q3', x: startX + 3 * nodeDistance, y: startY, color: { background: 'white', border: 'black' }, physics: false },
    ]);
    edges.add([
        { from: 1, to: 2, label: 'a' },
        { from: 2, to: 3, label: 'b' },
        { from: 3, to: 4, label: 'c' },
        { from: 3, to: 2, label: 'd' },
        { from: 2, to: 2, label: 'a' },


    ]);

    const transparentNodeId = 9999;
    nodes.add({
        id: transparentNodeId,
        label: '',
        color: { background: 'transparent', border: 'transparent' },
        x: startX - 50,
        y: startY,
        physics: false,
        fixed: true,
        chosen: false
    });
    edges.add({
        from: transparentNodeId,
        to: 1,
        arrows: 'to',
        color: 'black',
        chosen: false,
        smooth: {
            enabled: true,
            type: 'straightCross',
            roundness: 1
        }
    });

    document.getElementById('nfa-reset')?.removeAttribute('disabled');
    updateStartState('q0')
    updateAlphabet(["a", "b", "c", "d"]);
    updateStates(nodes.get().map(node => node.label))
    updateAcceptStates(["q1"])
    updateTransitionSet();
    updateTransitionTable()
});

function grayOutNodes(deadStateLabels: string[]): void {
    const nodesToUpdate: any = [];
    nodes.forEach(node => {
        if (deadStateLabels.includes(node.label) && typeof node.color !== 'string' && node.color.background !== 'green') {
            nodesToUpdate.push({ id: node.id, color: { background: 'gray' } });
        } else if (!deadStateLabels.includes(node.label) && typeof node.color !== 'string' && node.color.background === 'gray') {
            nodesToUpdate.push({ id: node.id, color: { background: 'white', border: 'black' } });
        }
    });
    nodes.update(nodesToUpdate);
}