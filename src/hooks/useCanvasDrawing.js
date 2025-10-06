import { useEffect, useMemo } from 'react';

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
        if (!width || !height) return;

        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');

        // Clear canvas and set background
        context.fillStyle = style.backgroundColor;
        context.fillRect(0, 0, width, height);

        // Draw frequency bars
        if (freqs && freqs.length > 0) {
            context.strokeStyle = style.barColor;
            context.lineWidth = 1;
            context.beginPath();
            const logXRange = [Math.log(xRange[0]), Math.log(xRange[1])];
            const logRange = logXRange[1] - logXRange[0];

            freqs.forEach(([freq, amp]) => {
                const canvasX = freq <= 0 ? 0 : ((Math.log(freq) - logXRange[0]) / logRange) * width;
                const barHeight = amp * height;
                if (canvasX >= 0 && canvasX <= width) {
                    context.moveTo(canvasX, height);
                    context.lineTo(canvasX, height - barHeight);
                }
            });
            context.stroke();
        }
    }, [freqs, width, height, xRange]); // Effect for frequency bars

    const envelopePath = useMemo(() => {
        if (!wasmModule || nodes.length < 2 || !width || !height) {
            return null;
        }

        const logXRange = [Math.log(xRange[0]), Math.log(xRange[1])];
        const logRange = logXRange[1] - logXRange[0];

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

        const path = new Path2D();
        const firstNodePoint = getCanvasPoint(nodes[0]);
        path.moveTo(firstNodePoint.x, firstNodePoint.y);

        for (let i = 0; i < nodes.length - 1; i++) {
            const startNode = nodes[i];
            const endNode = nodes[i + 1];
            const shape = curves[i] !== undefined ? curves[i] : 0;

            const logStartX = Math.log(startNode.x);
            const logEndX = Math.log(endNode.x);
            const logXNodeRange = logEndX - logStartX;

            const segments = 100;
            for (let j = 1; j <= segments; j++) {
                const t = j / segments;
                const logCurrentX = logStartX + t * logXNodeRange;
                const currentX = ((logCurrentX - logXRange[0]) / logRange) * width;
                const linearY = startNode.y + t * (endNode.y - startNode.y);
                const curveOffset = wasmModule.applyShape(t, shape);
                const currentY = (1 - (linearY - curveOffset * t * (1 - t))) * height;
                path.lineTo(currentX, currentY);
            }
        }
        return path;
    }, [wasmModule, nodes, curves, width, height, xRange, isLogarithmic]);

    useEffect(() => {
        if (!width || !height) return;

        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');

        // Draw the cached envelope path
        if (envelopePath) {
            context.strokeStyle = style.connectorColor;
            context.lineWidth = style.connectorWidth;
            context.stroke(envelopePath);
        }

        // Draw nodes (these need to be redrawn as they move)
        context.fillStyle = style.nodeColor;
        const logXRange = [Math.log(xRange[0]), Math.log(xRange[1])];
        const logRange = logXRange[1] - logXRange[0];
        nodes.forEach(node => {
            const x = node.x <= 0 ? 0 : ((Math.log(node.x) - logXRange[0]) / logRange) * width;
            const y = (1 - node.y) * height;
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
    }, [canvasRef, width, height, nodes, xRange, onWheel, envelopePath]); // Effect for envelope and nodes
};

export default useCanvasDrawing;
