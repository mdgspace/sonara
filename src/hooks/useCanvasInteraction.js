import { useState, useCallback } from 'react';

const style = {
    nodeRadius: 6,
    hitRadius: 8,
    shapeSpeed: 0.1,
};

const useCanvasInteraction = (canvasRef, { width, height, nodes, xRange, onNodesChange, onCurvesChange, isLogarithmic }) => {
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
        const canvasY = (1 - node.y) * height;
        return { x: canvasX, y: canvasY };
    }, [width, height, xRange, isLogarithmic, logXRange]);

    const handleMouseDown = useCallback((e) => {
        const mousePos = getMousePos(e);
        for (let i = 0; i < nodes.length; i++) {
            const { x: canvasX, y: canvasY } = getCanvasPoint(nodes[i]);
            const distance = Math.sqrt((mousePos.x - canvasX) ** 2 + (mousePos.y - canvasY) ** 2);
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
        const normalizedY = 1 - (clampedCanvasY / height);

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

        onCurvesChange(prevCurves => {
            const currentShape = prevCurves[targetConnectorIndex];
            const scrollDirection = -Math.sign(e.deltaY);
            const shapeChange = scrollDirection * style.shapeSpeed;
            const newShape = Math.max(-1, Math.min(1, currentShape + shapeChange));
            return prevCurves.map((shape, i) => i === targetConnectorIndex ? newShape : shape);
        });
    }, [getMousePos, width, xRange, nodes, onCurvesChange, isLogarithmic, logXRange]);

    return { handleMouseDown, handleMouseMove, handleMouseUp, handleWheel };
};

export default useCanvasInteraction;
