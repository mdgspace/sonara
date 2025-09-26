import { useRef, useEffect, useState, useCallback } from 'react';
import { applyShape } from '../utils';

const style = {
    backgroundColor: "#000000",
    borderColor: "#FFFFFF",
    barColor: "rgba(255, 255, 255, 0.5)",
    borderWidth: 1,
    nodeColor: "#FFFFFF",
    connectorColor: "#FFFFFF",
    connectorWidth: 2,
    nodeRadius: 5,
    hitRadius: 5,
    shapeSpeed: 0.1 // How much to change the shape on each scroll tick
};

const useCanvasDrawing = (canvasRef, { width, height, nodes, xRange, curves, freqs, isLogarithmic }) => {
    useEffect(() => {
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');

        const logXRange = [Math.log(xRange[0]), Math.log(xRange[1])];

        // Helper to convert node coordinates to canvas coordinates
        const getCanvasPoint = (node) => {
            let canvasX;
            if (isLogarithmic) {
                if (node.x <= 0) {
                    canvasX = 0;
                } else {
                    canvasX = ((Math.log(node.x) - logXRange[0]) / (logXRange[1] - logXRange[0])) * width;
                }
            } else {
                canvasX = ((node.x - xRange[0]) / (xRange[1] - xRange[0])) * width;
            }
            const canvasY = node.y * height;
            return { x: canvasX, y: canvasY };
        };

        // Clear canvas and draw background
        context.fillStyle = style.backgroundColor;
        context.fillRect(0, 0, context.canvas.width, context.canvas.height);

        // Draw frequency bars
        if (freqs && freqs.length > 0) {
            context.strokeStyle = style.barColor;
            context.lineWidth = 1;
            context.beginPath();
            freqs.forEach(([freq, amp]) => {
                const { x: canvasX } = getCanvasPoint({ x: freq, y: 0 }); // only need x
                const barHeight = amp * height;
                if (canvasX >= 0 && canvasX <= width) {
                    context.moveTo(canvasX, height);
                    context.lineTo(canvasX, height - barHeight);
                }
            });
            context.stroke();
        }


        // Draw connectors (curves) between consecutive nodes
        if (nodes.length > 1) {
            context.strokeStyle = style.connectorColor;
            context.lineWidth = style.connectorWidth;
            context.beginPath();

            for (let i = 0; i < nodes.length - 1; i++) {
                const startNode = nodes[i];
                const endNode = nodes[i+1];
                const shape = curves[i] !== undefined ? curves[i] : 0; // Default to 0 (straight line)

                const startPoint = getCanvasPoint(startNode);
                const endPoint = getCanvasPoint(endNode);

                context.moveTo(startPoint.x, startPoint.y);

                // Approximate the curve with many small line segments
                const segments = 100; // Increase for a smoother curve
                for (let j = 1; j <= segments; j++) {
                    const t = j / segments; // Normalized x-position (0 to 1) between nodes

                    // Apply the new shaping function
                    const curvedT = applyShape(t, shape);
                    const currentX = startPoint.x + t * (endPoint.x - startPoint.x);
                    const currentY = startPoint.y + curvedT * (endPoint.y - startPoint.y);
                    context.lineTo(currentX, currentY);
                }
            }
            context.stroke();
        }

        // Draw nodes on top of the lines
        context.fillStyle = style.nodeColor;
        nodes.forEach(node => {
            const { x, y } = getCanvasPoint(node);
            context.beginPath();
            context.arc(x, y, style.nodeRadius, 0, 2 * Math.PI);
            context.fill();
        });
    }, [canvasRef, width, height, nodes, xRange, curves]);
};


const useCanvasInteraction = (canvasRef, { width, height, nodes, xRange, curves, onNodesChange, onCurvesChange, isLogarithmic }) => {
    const [draggingNodeIndex, setDraggingNodeIndex] = useState(null);
    const logXRange = [Math.log(xRange[0]), Math.log(xRange[1])];

    const getMousePos = useCallback((e) => {
        const rect = canvasRef.current.getBoundingClientRect();
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
        };
    }, [canvasRef]);

    const getCanvasPoint = useCallback((node) => {
        let canvasX;
        if (isLogarithmic) {
            canvasX = ((Math.log(node.x) - logXRange[0]) / (logXRange[1] - logXRange[0])) * width;
        } else {
            canvasX = ((node.x - xRange[0]) / (xRange[1] - xRange[0])) * width;
        }
        const canvasY = node.y * height;
        return { x: canvasX, y: canvasY };
    }, [width, height, xRange, isLogarithmic, logXRange]);

    const handleMouseDown = useCallback((e) => {
        const mousePos = getMousePos(e);
        for (let i = 0; i < nodes.length; i++) {
            const { x: canvasX, y: canvasY } = getCanvasPoint(nodes[i]);
            const distance = Math.sqrt(Math.pow(mousePos.x - canvasX, 2) + Math.pow(mousePos.y - canvasY, 2));
            if (distance < style.nodeRadius + style.hitRadius) {
                setDraggingNodeIndex(i);
                return;
            }
        }
    }, [getMousePos, getCanvasPoint, nodes]);

    const handleMouseMove = useCallback((e) => {
        if (draggingNodeIndex === null) return;

        const mousePos = getMousePos(e);
        const clampedCanvasY = Math.max(0, Math.min(height, mousePos.y));
        const normalizedY = clampedCanvasY / height;

        let newNodeX;
        const isFirstNode = draggingNodeIndex === 0;
        const isLastNode = draggingNodeIndex === nodes.length - 1;

        if (isFirstNode || isLastNode) {
            newNodeX = nodes[draggingNodeIndex].x;
        } else {
            const leftNeighborX = nodes[draggingNodeIndex - 1].x;
            const rightNeighborX = nodes[draggingNodeIndex + 1].x;
            let rawNodeX;
            if (isLogarithmic) {
                const logX = (mousePos.x / width) * (logXRange[1] - logXRange[0]) + logXRange[0];
                rawNodeX = Math.exp(logX);
            } else {
                rawNodeX = (mousePos.x / width) * (xRange[1] - xRange[0]) + xRange[0];
            }
            newNodeX = Math.max(leftNeighborX, Math.min(rawNodeX, rightNeighborX));
        }

        const newNodes = nodes.map((node, index) =>
            index === draggingNodeIndex ? { x: newNodeX, y: normalizedY } : node
        );
        onNodesChange(newNodes);
    }, [draggingNodeIndex, getMousePos, height, width, nodes, xRange, onNodesChange, isLogarithmic, logXRange]);

    const handleMouseUp = useCallback(() => {
        setDraggingNodeIndex(null);
    }, []);

    const handleWheel = useCallback((e) => {
        e.preventDefault();
        const mousePos = getMousePos(e);
        let logicalX;
        if (isLogarithmic) {
            const logX = (mousePos.x / width) * (logXRange[1] - logXRange[0]) + logXRange[0];
            logicalX = Math.exp(logX);
        } else {
            logicalX = (mousePos.x / width) * (xRange[1] - xRange[0]) + xRange[0];
        }
        const targetConnectorIndex = nodes.findIndex((node, i) =>
            nodes[i + 1] && logicalX > node.x && logicalX < nodes[i + 1].x
        );
        if (targetConnectorIndex === -1) return;
        const currentShape = curves[targetConnectorIndex];
        const scrollDirection = -Math.sign(e.deltaY);
        const shapeChange = scrollDirection * style.shapeSpeed;
        const newShape = Math.max(-1, Math.min(1, currentShape + shapeChange));

        onCurvesChange(curves.map((shape, i) => i === targetConnectorIndex ? newShape : shape));
    }, [getMousePos, width, xRange, nodes, curves, onCurvesChange, isLogarithmic, logXRange]);

    return { handleMouseDown, handleMouseMove, handleMouseUp, handleWheel };
};

function Display(props) {
    const canvasRef = useRef(null);
    useCanvasDrawing(canvasRef, props);
    const eventHandlers = useCanvasInteraction(canvasRef, props);

    return (
        <canvas
            ref={canvasRef}
            width={props.width}
            height={props.height}
            style={{ border: `${style.borderWidth}px solid ${style.borderColor}` }}
            onMouseDown={eventHandlers.handleMouseDown}
            onMouseMove={eventHandlers.handleMouseMove}
            onMouseUp={eventHandlers.handleMouseUp}
            onMouseLeave={eventHandlers.handleMouseUp}
            onWheel={eventHandlers.handleWheel}
        />
    );
}

export default Display;