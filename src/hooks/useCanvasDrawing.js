import { useEffect } from 'react';

const style = {
    backgroundColor: "#0f172a",
    barColor: "rgba(255, 215, 0, 0.3)",
    nodeColor: "#ffd700",
    connectorColor: "#ffffff",
    connectorWidth: 2,
    nodeRadius: 6,
};

const useCanvasDrawing = (canvasRef, { wasmModule, width, height, nodes, xRange, curves, freqs, isLogarithmic, onWheel }) => {
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
            const canvasY = (1 - node.y) * height;
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

            const firstNodePoint = getCanvasPoint(nodes[0]);
            context.moveTo(firstNodePoint.x, firstNodePoint.y);

            for (let i = 0; i < nodes.length - 1; i++) {
                const startNode = nodes[i];
                const endNode = nodes[i + 1];
                const shape = curves[i] !== undefined ? curves[i] : 0;


                const segments = 100;
                for (let j = 1; j <= segments; j++) {
                    const t = j / segments;

                    // 1. Interpolate X position linearly in the log space of the original data.
                    const logStartX = Math.log(startNode.x);
                    const logEndX = Math.log(endNode.x);
                    const logCurrentX = logStartX + t * (logEndX - logStartX);
                    const currentX = ((logCurrentX - logXRange[0]) / (logXRange[1] - logXRange[0])) * width;

                    // 2. Interpolate Y position linearly in the normalized (0-1) space.
                    const linearY = startNode.y + t * (endNode.y - startNode.y);

                    // 3. Get the curve offset and apply it relative to the linear interpolation.
                    const curveOffset = wasmModule ? wasmModule.applyShape(t, shape) : 0;
                    const currentY = (1 - (linearY - curveOffset * t * (1 - t))) * height;

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

        if (onWheel) {
            // The wheel event listener must be registered with { passive: false }
            // to allow calling e.preventDefault().
            canvas.addEventListener('wheel', onWheel, { passive: false });
            return () => {
                canvas.removeEventListener('wheel', onWheel);
            };
        }
    }, [canvasRef, wasmModule, width, height, nodes, xRange, curves, freqs, isLogarithmic, onWheel]);
};

export default useCanvasDrawing;
