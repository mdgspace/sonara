import { useEffect, useMemo, useCallback } from 'react';

const style = {
    backgroundColor: "#0f172a",
    barColor: "rgba(255, 215, 0, 0.3)",
    nodeColor: "#ffd700",
    connectorColor: "#ffffff",
    connectorWidth: 2,
    nodeRadius: 6,
    axisColor: "#999",
    textColor: "#fff",
    gridColor: "rgba(255,255,255,0.1)"
};


function drawAxes(ctx, width, height, isLogarithmic, xRange) {
    const paddingLeft = 45;
    const paddingBottom = 45; //
    const paddingTop = 10;

    ctx.save();
    ctx.strokeStyle = style.axisColor;
    ctx.fillStyle = style.textColor;
    ctx.lineWidth = 1;
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // ---- Axis lines ----
    ctx.beginPath();
    ctx.moveTo(paddingLeft, height - paddingBottom);
    ctx.lineTo(width - 10, height - paddingBottom);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(paddingLeft, paddingTop);
    ctx.lineTo(paddingLeft, height - paddingBottom);
    ctx.stroke();

    // ---- Axis Labels ----
    ctx.fillText('Frequency (Hz)', width / 2, height - 8);

    ctx.save();
    ctx.translate(15, height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Amplitude', 0, 0);
    ctx.restore();

    // ---- Frequency (Hz) ----
    let xTicks;
    if (isLogarithmic) {
        const [minFreq, maxFreq] = xRange;
        const logMin = Math.log10(minFreq);
        const logMax = Math.log10(maxFreq);
        xTicks = [];
        for (let p = Math.ceil(logMin); p <= Math.floor(logMax); p++) {
            const base = Math.pow(10, p);
            xTicks.push(base);
            if (base * 2 <= maxFreq) xTicks.push(base * 2);
            if (base * 5 <= maxFreq) xTicks.push(base * 5);
        }
        xTicks = xTicks.filter(v => v >= minFreq && v <= maxFreq).sort((a, b) => a - b);
    } else {
        const [min, max] = xRange;
        const step = (max - min) / 5;
        xTicks = Array.from({ length: 6 }, (_, i) => min + i * step);
    }

    // ---- Draw X-axis ticks ----
    xTicks.forEach(tick => {
        const x = isLogarithmic
            ? ((Math.log(tick) - Math.log(xRange[0])) /
                (Math.log(xRange[1]) - Math.log(xRange[0]))) *
                (width - paddingLeft - 20) + paddingLeft
            : ((tick - xRange[0]) / (xRange[1] - xRange[0])) *
                (width - paddingLeft - 20) + paddingLeft;

        ctx.beginPath();
        ctx.moveTo(x, height - paddingBottom);
        ctx.lineTo(x, height - paddingBottom + 5);
        ctx.stroke();

        const label = tick >= 1000 ? `${tick / 1000}k` : `${tick.toString()}`;
        ctx.fillText(label, x, height - paddingBottom + 15);
    });

    // ---- Y-axis ticks  ----
    const yTicks = [-12, -6, 0, 6, 12]; // This seems to be a placeholder, as nodes are 0-1.
    const toCanvasY = val => {
        const norm = (val + 12) / 24; // [-12..12] → [0..1]
        return height - paddingBottom - norm * (height - paddingBottom - paddingTop);
    };

    ctx.textAlign = 'right';
    yTicks.forEach(val => {
        const y = toCanvasY(val);
        // Tick line
        ctx.strokeStyle = style.axisColor;
        ctx.beginPath();
        ctx.moveTo(paddingLeft - 5, y);
        ctx.lineTo(paddingLeft, y);
        ctx.stroke();
        // Label
        ctx.fillText(`${val}`, paddingLeft - 8, y);
        // Grid line
        ctx.strokeStyle = style.gridColor;
        ctx.beginPath();
        ctx.moveTo(paddingLeft, y);
        ctx.lineTo(width - 10, y);
        ctx.stroke();
    });

    ctx.restore();
}

const useCanvasDrawing = (canvasRef, { wasmModule, width, height, nodes, xRange, curves, freqs, isLogarithmic, onWheel }) => {
    const envelopePath = useMemo(() => {
        if (!wasmModule || nodes.length < 2 || !width || !height) {
            return null;
        }

        const getCanvasPoint = (node, logX, xRangeLinear) => {
            const canvasX = isLogarithmic
                ? node.x <= 0 ? 0 : ((Math.log(node.x) - logX.min) / logX.range) * width
                : ((node.x - xRange[0]) / xRangeLinear) * width;
            const canvasY = (1 - node.y) * height;
            return { x: canvasX, y: canvasY };
        };

        const logX = { min: Math.log(xRange[0]), max: Math.log(xRange[1]), range: Math.log(xRange[1]) - Math.log(xRange[0]) };
        const xRangeLinear = xRange[1] - xRange[0];

        const path = new Path2D();
        const firstNodePoint = getCanvasPoint(nodes[0], logX, xRangeLinear);
        path.moveTo(firstNodePoint.x, firstNodePoint.y);

        for (let i = 0; i < nodes.length - 1; i++) {
            const startNode = nodes[i];
            const endNode = nodes[i + 1];
            const shape = curves[i] !== undefined ? curves[i] : 0;
            const logStartX = Math.log(startNode.x);
            const logXNodeRange = Math.log(endNode.x) - logStartX;


            const segments = 20;
            for (let j = 1; j <= segments; j++) {
                const t = j / segments;
                const logCurrentX = logStartX + t * logXNodeRange;
                const currentX = ((logCurrentX - logX.min) / logX.range) * width;
                const linearY = startNode.y + t * (endNode.y - startNode.y);
                const curveOffset = wasmModule.applyShape(t, shape);
                const currentY = (1 - (linearY - curveOffset * t * (1 - t))) * height;
                path.lineTo(currentX, currentY);
            }
        }
        return path;
    }, [wasmModule, nodes, curves, width, height, xRange, isLogarithmic]);

    const draw = useCallback((context) => {
        context.fillStyle = style.backgroundColor;
        context.fillRect(0, 0, width, height);

        drawAxes(context, width, height, isLogarithmic, xRange);

        const logXRange = { min: Math.log(xRange[0]), max: Math.log(xRange[1]), range: Math.log(xRange[1]) - Math.log(xRange[0]) };

        if (freqs && freqs.length > 0) {
            context.strokeStyle = style.barColor;
            context.lineWidth = 1;
            context.beginPath();

            freqs.forEach(([freq, amp]) => {
                const canvasX = freq <= 0 ? 0 : ((Math.log(freq) - logXRange.min) / logXRange.range) * width;
                const barHeight = amp * height;
                if (canvasX >= 0 && canvasX <= width) {
                    context.lineTo(canvasX, height - barHeight);
                }
            });
            context.stroke();
        }

        if (envelopePath) {
            context.strokeStyle = style.connectorColor;
            context.lineWidth = style.connectorWidth;
            context.stroke(envelopePath);
        }

        context.fillStyle = style.nodeColor;
        nodes.forEach(node => {
            const x = node.x <= 0 ? 0 : ((Math.log(node.x) - logXRange.min) / logXRange.range) * width;
            const y = (1 - node.y) * height;
            context.beginPath();
            context.arc(x, y, style.nodeRadius, 0, 2 * Math.PI);
            context.fill();
        });
    }, [width, height, isLogarithmic, xRange, freqs, nodes, envelopePath]);

    useEffect(() => {
        if (!width || !height || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        let animationFrameId;

        const render = () => {
            draw(context);
            animationFrameId = window.requestAnimationFrame(render);
        };
        render();

        return () => {
            window.cancelAnimationFrame(animationFrameId);
        };
    }, [draw, width, height, canvasRef]);
};

export default useCanvasDrawing;
