import { useEffect } from 'react';

const style = {
    backgroundColor: "#0f172a",
    barColor: "rgba(255, 215, 0, 0.3)",
    nodeColor: "#ffd700",
    connectorColor: "#ffffff",
    connectorWidth: 2,
    nodeRadius: 6,
};

const useCanvasDrawing = (canvasRef, { width, height, nodes, xRange, curves, freqs, isLogarithmic }) => {
    useEffect(() => {
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');

        const logXRange = [Math.log(xRange[0]), Math.log(xRange[1])];

        const getCanvasPoint = (node) => {
            let canvasX;
            if (isLogarithmic) {
                canvasX = node.x <= 0 ? 0 : ((Math.log(node.x) - logXRange[0]) / (logXRange[1] - logXRange[0])) * width;
            } else {
                canvasX = ((node.x - xRange[0]) / (xRange[1] - xRange[0])) * width;
            }
            const canvasY = node.y * height;
            return { x: canvasX, y: canvasY };
        };

        context.fillStyle = style.backgroundColor;
        context.fillRect(0, 0, context.canvas.width, context.canvas.height);

        if (freqs && freqs.length > 0) {
            context.strokeStyle = style.barColor;
            context.lineWidth = 1;
            context.beginPath();
            freqs.forEach(([freq, amp]) => {
                const { x: canvasX } = getCanvasPoint({ x: freq, y: 0 });
                const barHeight = amp * height;
                if (canvasX >= 0 && canvasX <= width) {
                    context.moveTo(canvasX, height);
                    context.lineTo(canvasX, height - barHeight);
                }
            });
            context.stroke();
        }

        if (nodes.length > 1) {
            context.strokeStyle = style.connectorColor;
            context.lineWidth = style.connectorWidth;
            context.beginPath();

            for (let i = 0; i < nodes.length - 1; i++) {
                const startNode = nodes[i];
                const endNode = nodes[i + 1];
                const shape = curves[i] !== undefined ? curves[i] : 0;

                const startPoint = getCanvasPoint(startNode);
                const endPoint = getCanvasPoint(endNode);

                context.moveTo(startPoint.x, startPoint.y);

                const segments = 100;
                for (let j = 1; j <= segments; j++) {
                    const t = j / segments;
                    const curvedT = t ** (1 - shape);
                    const currentX = startPoint.x + t * (endPoint.x - startPoint.x);
                    const currentY = startPoint.y + curvedT * (endPoint.y - startPoint.y);
                    context.lineTo(currentX, currentY);
                }
            }
            context.stroke();
        }

        context.fillStyle = style.nodeColor;
        nodes.forEach(node => {
            const { x, y } = getCanvasPoint(node);
            context.beginPath();
            context.arc(x, y, style.nodeRadius, 0, 2 * Math.PI);
            context.fill();
        });
    }, [canvasRef, width, height, nodes, xRange, curves, freqs, isLogarithmic]);
};

export default useCanvasDrawing;
