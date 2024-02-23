import State from '../state';

import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

class StateWithCoordinates extends State {
    originalX: number;
    originalY: number;
    transitions: Map<string, Set<StateWithCoordinates>>;

    constructor(name: string, settings: { startState: boolean; acceptState: boolean }, x: number, y: number) {
        super(name, settings);
        this.originalX = x;
        this.originalY = y;
    }
}

class GridCanvas {
    private canvas: HTMLCanvasElement;
    private context: CanvasRenderingContext2D;
    private gridSpacing: number;
    private offsetX: number;
    private offsetY: number;
    private isDragging: boolean;
    private startX: number;
    private startY: number;
    private zoomLevel: number
    private contextMenu: HTMLDivElement | null;
    private states: StateWithCoordinates[] = []
    private draggedState: StateWithCoordinates | null;
    private transitionState: StateWithCoordinates | null;

    constructor(id: string, zoomLevel: number) {
        this.canvas = document.getElementById(id) as HTMLCanvasElement;
        this.context = this.canvas.getContext('2d');
        this.gridSpacing = 100 / zoomLevel; // Adjust this value as needed
        this.offsetX = 0;
        this.offsetY = 0;
        this.isDragging = false;
        this.zoomLevel = zoomLevel;
        this.contextMenu = null;
        this.transitionState = null;
        this.canvas.addEventListener('mousedown', this.mouseDownHandler.bind(this));
        this.canvas.addEventListener('mousemove', this.mouseMoveHandler.bind(this));
        this.canvas.addEventListener('mouseup', this.mouseUpHandler.bind(this));
        this.canvas.addEventListener('mouseout', this.mouseOutHandler.bind(this));
        this.canvas.addEventListener('contextmenu', this.contextMenuHandler.bind(this));
        this.canvas.addEventListener('dblclick', this.doubleClickHandler.bind(this));
        // this.canvas.addEventListener('wheel', this.wheelHandler.bind(this)); // Comment out this line to disable zooming

        document.addEventListener('click', this.documentClickHandler.bind(this));
        this.drawGrid();
    }

    drawGrid() {
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.context.beginPath(); // Begin a new path

        for (let x = 0; x <= this.canvas.width; x += this.gridSpacing) {
            this.context.moveTo(x + this.offsetX % this.gridSpacing, 0);
            this.context.lineTo(x + this.offsetX % this.gridSpacing, this.canvas.height);
        }

        for (let y = 0; y <= this.canvas.height; y += this.gridSpacing) {
            this.context.moveTo(0, y + this.offsetY % this.gridSpacing);
            this.context.lineTo(this.canvas.width, y + this.offsetY % this.gridSpacing);
        }

        this.context.strokeStyle = "#ddd";
        this.context.stroke(); // Stroke the new path
        this.drawStates();
    }
    mouseDownHandler(e: MouseEvent) {
        const rect = this.canvas.getBoundingClientRect();
        const x = ((e.clientX - rect.left) - this.offsetX) / this.zoomLevel;
        const y = ((e.clientY - rect.top) - this.offsetY) / this.zoomLevel;

        // Find the state that was clicked
        const clickedState = this.states.find(state => {
            const distance = Math.sqrt(Math.pow(x - state.originalX, 2) + Math.pow(y - state.originalY, 2));
            return distance <= 50 / this.zoomLevel; // Adjust the radius as needed
        });

        if (clickedState) {
            this.draggedState = clickedState;
            this.startX = x;
            this.startY = y;
        } else {
            this.isDragging = true;
            this.startX = e.clientX - this.offsetX;
            this.startY = e.clientY - this.offsetY;
            this.canvas.style.cursor = 'grabbing';
        }
    }



    mouseMoveHandler(e: MouseEvent) {
        const rect = this.canvas.getBoundingClientRect();
        const x = ((e.clientX - rect.left) - this.offsetX) / this.zoomLevel;
        const y = ((e.clientY - rect.top) - this.offsetY) / this.zoomLevel;

        console.log(`Mouse position: x = ${x}, y = ${y}`);

        if (this.isDragging) {
            e.preventDefault();
            this.offsetX = e.clientX - this.startX;
            this.offsetY = e.clientY - this.startY;

            this.drawGrid();
        } else if (this.draggedState) {
            e.preventDefault();

            this.draggedState.originalX += x - this.startX;
            this.draggedState.originalY += y - this.startY;
            this.startX = x;
            this.startY = y;

            this.drawGrid();
        } else if (this.transitionState) {
            e.preventDefault();

            this.drawArrow(this.transitionState.originalX, this.transitionState.originalY, x, y, 110);
        }
    }
    drawArrow(fromX: number, fromY: number, toX: number, toY: number, radius: number) {
        // Clear the canvas
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
        const dx = toX - fromX;
        const dy = toY - fromY;
        const angle = Math.atan2(dy, dx);
    
        // Calculate the starting point of the arrow on the border of the circle
        const borderX = fromX + radius * Math.cos(angle);
        const borderY = fromY + radius * Math.sin(angle);
    
        this.context.save(); // Save the current state
    
        // Apply transformations
        this.context.translate(this.offsetX, this.offsetY);
        this.context.scale(this.zoomLevel, this.zoomLevel);
    
        this.context.beginPath();
        this.context.moveTo(borderX, borderY); // Start the arrow from the border of the state circle
        this.context.lineTo(toX, toY);
        this.context.strokeStyle = 'black';
        this.context.stroke();
    
        this.context.restore(); // Restore the saved state
    
        // Redraw the other elements
        this.drawStates();
        this.drawGrid()
    }
    mouseUpHandler(e: MouseEvent) {
        this.isDragging = false;
        this.draggedState = null;
        this.canvas.style.cursor = 'grab';
        if (this.transitionState) {
            const rect = this.canvas.getBoundingClientRect();
            const x = ((e.clientX - rect.left) - this.offsetX) / this.zoomLevel;
            const y = ((e.clientY - rect.top) - this.offsetY) / this.zoomLevel;

            const clickedState = this.states.find(state => {
                const distance = Math.sqrt(Math.pow(x - state.originalX, 2) + Math.pow(y - state.originalY, 2));
                return distance <= 50 / this.zoomLevel; // Adjust the radius as needed
            });

            if (clickedState && clickedState !== this.transitionState) {
                // Add the transition to the states
                if (!this.transitionState.transitions.has(clickedState.name)) {
                    this.transitionState.transitions.set(clickedState.name, new Set());
                }
                this.transitionState.transitions.get(clickedState.name).add(clickedState);
            }

            this.transitionState = null;
            this.drawGrid();
        }
    }

    mouseOutHandler(e: MouseEvent) {
        this.isDragging = false;
        this.canvas.style.cursor = 'grab';
    }

    wheelHandler(e: WheelEvent) {
        e.preventDefault();

        // Zoom in if the wheel is scrolled up, and out if it is scrolled down
        if (e.deltaY > 0) {
            this.zoomLevel *= 1.1;
        } else {
            this.zoomLevel /= 1.1;
        }

        // Update the grid spacing according to the new zoom level
        this.gridSpacing = 100 / this.zoomLevel;

        // Redraw the grid with the new zoom level
        this.drawGrid();
    }
    documentClickHandler(e: MouseEvent) {
        // If the context menu exists and the click was outside of it, remove it
        if (this.contextMenu && !this.contextMenu.contains(e.target as Node)) {
            document.body.removeChild(this.contextMenu);
            this.contextMenu = null;
        }
    }

    contextMenuHandler(e: MouseEvent) {
        e.preventDefault();

        if (this.contextMenu) {
            document.body.removeChild(this.contextMenu);
        }

        // Get the position of the mouse pointer on the canvas
        const rect = this.canvas.getBoundingClientRect();
        const x = ((e.clientX - rect.left) - this.offsetX) / this.zoomLevel;
        const y = ((e.clientY - rect.top) - this.offsetY) / this.zoomLevel;

        // Find the state that was right-clicked
        // Find the state that was right-clicked
        const clickedState = this.states.find(state => {
            const distance = Math.sqrt(Math.pow(x - state.originalX, 2) + Math.pow(y - state.originalY, 2));
            return distance <= 50 / this.zoomLevel; // Adjust the radius as needed
        });

        // Create the context menu
        this.contextMenu = document.createElement('div');
        this.contextMenu.classList.add('dropdown-menu', 'show'); // Add Bootstrap classes
        this.contextMenu.style.position = 'absolute';
        this.contextMenu.style.left = `${e.clientX}px`;
        this.contextMenu.style.top = `${e.clientY}px`;

        if (clickedState) {
            let addTransitionItem = document.createElement('button');
            addTransitionItem.classList.add('dropdown-item'); // Add Bootstrap class
            addTransitionItem.innerHTML = '<i class="bi bi-arrow-right-circle"></i> Add Transition'; // Add Bootstrap Icon
            addTransitionItem.addEventListener('click', () => {
                this.transitionState = clickedState;
                document.body.removeChild(this.contextMenu);
                this.contextMenu = null;
            });
            this.contextMenu.appendChild(addTransitionItem);

            // Add the "Change Name" menu item
            let changeNameItem = document.createElement('button');
            changeNameItem.classList.add('dropdown-item'); // Add Bootstrap class
            changeNameItem.innerHTML = '<i class="bi bi-pencil"></i> Change Name'; // Add Bootstrap Icon
            changeNameItem.addEventListener('click', () => {
                const newName = prompt('Enter a new name for the state:', clickedState.name);
                if (newName !== null) {
                    clickedState.name = newName;
                    this.drawGrid();
                }
                document.body.removeChild(this.contextMenu);
                this.contextMenu = null;
            });
            this.contextMenu.appendChild(changeNameItem);

            // Add the "Toggle Start" menu item
            let toggleStartItem = document.createElement('button');
            toggleStartItem.classList.add('dropdown-item'); // Add Bootstrap class
            toggleStartItem.innerHTML = '<i class="bi bi-play-circle"></i> Toggle Start'; // Add Bootstrap Icon
            toggleStartItem.addEventListener('click', () => {
                clickedState.settings.startState = !clickedState.settings.startState;
                this.drawGrid();
                document.body.removeChild(this.contextMenu);
                this.contextMenu = null;
            });
            this.contextMenu.appendChild(toggleStartItem);

            // Add the "Toggle Accept" menu item
            let toggleAcceptItem = document.createElement('button');
            toggleAcceptItem.classList.add('dropdown-item'); // Add Bootstrap class
            toggleAcceptItem.innerHTML = '<i class="bi bi-check-circle"></i> Toggle Accept'; // Add Bootstrap Icon
            toggleAcceptItem.addEventListener('click', () => {
                clickedState.settings.acceptState = !clickedState.settings.acceptState;
                this.drawGrid();
                document.body.removeChild(this.contextMenu);
                this.contextMenu = null;
            });
            this.contextMenu.appendChild(toggleAcceptItem);

            // Add the "Delete" menu item
            let deleteItem = document.createElement('button');
            deleteItem.classList.add('dropdown-item'); // Add Bootstrap class
            deleteItem.innerHTML = '<i class="bi bi-trash"></i> Delete'; // Add Bootstrap Icon
            deleteItem.addEventListener('click', () => {
                this.states = this.states.filter(state => state !== clickedState);
                this.drawGrid();
                document.body.removeChild(this.contextMenu);
                this.contextMenu = null;
            });
            this.contextMenu.appendChild(deleteItem);
        } else {
            // Add the "Add State" menu item
            let addStateItem = document.createElement('button');
            addStateItem.classList.add('dropdown-item'); // Add Bootstrap class
            addStateItem.innerHTML = '<i class="bi bi-plus-circle"></i> Add State'; // Add Bootstrap Icon
            addStateItem.addEventListener('click', () => {
                const name = `${this.states.length}`; // Generate a name for the new state
                const settings = { startState: false, acceptState: false }; // Default settings
                const newState = new StateWithCoordinates(name, settings, x, y);
                console.log(x, y)
                this.states.push(newState);
                this.drawGrid();
                document.body.removeChild(this.contextMenu);
                this.contextMenu = null;
            });
            this.contextMenu.appendChild(addStateItem);
        }

        // Add the context menu to the body
        document.body.appendChild(this.contextMenu);
    }
    drawState(state: StateWithCoordinates) {
        const x = (state.originalX * this.zoomLevel) + this.offsetX;
        const y = (state.originalY * this.zoomLevel) + this.offsetY;
        const baseRadius = 110; // Adjust as needed
        const radius = baseRadius / this.zoomLevel; // Adjust the radius according to the zoom level

        // Draw the circle
        this.context.beginPath();
        this.context.arc(x, y, radius, 0, 2 * Math.PI, false);
        this.context.fillStyle = 'white';
        this.context.fill();
        this.context.lineWidth = 2;
        this.context.strokeStyle = '#000';
        this.context.stroke();

        // Draw the label
        this.context.fillStyle = 'black';
        this.context.textAlign = 'center';
        this.context.textBaseline = 'middle';
        this.context.font = `${70 / this.zoomLevel}px Arial`; // Adjust the font size according to the zoom level
        this.context.fillText(state.name, x, y);

        state.transitions.forEach((transitionStates, transitionName) => {
            transitionStates.forEach(transitionState => {
                this.drawArrow(state.originalX, state.originalY, transitionState.originalX, transitionState.originalY, 110);
            });
        });
    }

    drawStates() {
        this.states.forEach(state => {
            this.drawState(state);
        });
    }


    doubleClickHandler(e: MouseEvent) {
        // Get the position of the mouse pointer on the canvas
        const rect = this.canvas.getBoundingClientRect();
        const x = ((e.clientX - rect.left) - this.offsetX) / this.zoomLevel;
        const y = ((e.clientY - rect.top) - this.offsetY) / this.zoomLevel;

        // Find the state that was double-clicked
        const clickedState = this.states.find(state => {
            const distance = Math.sqrt(Math.pow(x - state.originalX, 2) + Math.pow(y - state.originalY, 2));
            return distance <= 110 / this.zoomLevel; // Adjust the radius as needed
        });

        if (clickedState) {
            // Prompt the user to enter a new name
            const newName = prompt('Enter a new name for the state:', clickedState.name);
            if (newName !== null) {
                clickedState.name = newName;
                this.drawGrid();
            }
        }
    }
}

new GridCanvas('myCanvas', 3); 