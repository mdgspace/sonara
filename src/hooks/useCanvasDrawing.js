import { useEffect, useMemo, useCallback } from 'react';
import { style } from '../static';

function drawAxes(ctx, width, height, isLogarithmic, xRange) {
    const paddingLeft = 45;
    const paddingBottom = 45;
    const paddingTop = 10;
    const paddingRight = 20;

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
    ctx.lineTo(width - paddingRight, height - paddingBottom);
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

    const drawWidth = width - paddingLeft - paddingRight;

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
                drawWidth + paddingLeft
            : ((tick - xRange[0]) / (xRange[1] - xRange[0])) *
                drawWidth + paddingLeft;

        ctx.beginPath();
        ctx.moveTo(x, height - paddingBottom);
        ctx.lineTo(x, height - paddingBottom + 5);
        ctx.stroke();

        const label = tick >= 1000 ? `${tick / 1000}k` : `${tick.toString()}`;
        ctx.fillText(label, x, height - paddingBottom + 15);
    });

    // ---- Y-axis ticks  ----
    const yTicks = [0, 0.25, 0.5, 0.75, 1]; // Amplitude values
    const drawHeight = height - paddingBottom - paddingTop;
    const toCanvasY = val => {
        return height - paddingBottom - val * drawHeight;
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
        const dB = (val - 0.75) * 48;
        const labelText = `${dB > 0 ? '+' : ''}${dB} dB`;
        ctx.fillText(labelText, paddingLeft - 8, y);
        // Grid line
        ctx.strokeStyle = style.gridColor;
        ctx.beginPath();
        ctx.moveTo(paddingLeft, y);
        ctx.lineTo(width - paddingRight, y);
        ctx.stroke();
    });

    ctx.restore();
}

const useCanvasDrawing = (canvasRef, { wasmModule, width, height, nodes, xRange, curves, freqs, isLogarithmic, onWheel }) => {
    const envelopePath = useMemo(() => {
        if (!wasmModule || nodes.length < 2 || !width || !height) {
            return null;
        }

        const paddingLeft = 60;
        const paddingRight = 20;
        const paddingTop = 10;
        const paddingBottom = 45;
        const drawWidth = width - paddingLeft - paddingRight;
        const drawHeight = height - paddingBottom - paddingTop;

        const getCanvasPoint = (node, logX, xRangeLinear) => {
            const canvasX = isLogarithmic
                ? node.x <= 0 ? paddingLeft : ((Math.log(node.x) - logX.min) / logX.range) * drawWidth + paddingLeft
                : ((node.x - xRange[0]) / xRangeLinear) * drawWidth + paddingLeft;
            const canvasY = height - paddingBottom - node.y * drawHeight;
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
                const currentX = ((logCurrentX - logX.min) / logX.range) * drawWidth + paddingLeft;
                const linearY = startNode.y + t * (endNode.y - startNode.y);
                const curveOffset = wasmModule.applyShape(t, shape);
                const nodeY = linearY - curveOffset * t * (1 - t);
                const currentY = height - paddingBottom - nodeY * drawHeight;
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

        const paddingLeft = 60;
        const paddingRight = 20;
        const paddingTop = 10;
        const paddingBottom = 45;
        const drawWidth = width - paddingLeft - paddingRight;
        const drawHeight = height - paddingBottom - paddingTop;

        if (freqs && freqs.length > 0) {
            context.fillStyle = style.barColor;

            freqs.forEach(([freq, amp]) => {
                const canvasX = freq <= 0 ? paddingLeft : ((Math.log(freq) - logXRange.min) / logXRange.range) * drawWidth + paddingLeft;
                const barHeight = amp * drawHeight;
                if (canvasX >= paddingLeft && canvasX <= width - paddingRight) {
                    context.fillRect(canvasX - 1, height - paddingBottom - barHeight, 2, barHeight);
                }
            });
        }

        if (envelopePath) {
            context.strokeStyle = style.connectorColor;
            context.lineWidth = style.connectorWidth;
            context.stroke(envelopePath);
        }

        nodes.forEach(node => {
            const x = node.x <= 0 ? paddingLeft : ((Math.log(node.x) - logXRange.min) / logXRange.range) * drawWidth + paddingLeft;
            const y = height - paddingBottom - node.y * drawHeight;
            
            // Draw node
            context.fillStyle = style.nodeColor;
            context.beginPath();
            context.arc(x, y, style.nodeRadius, 0, 2 * Math.PI);
            context.fill();

            // Draw frequency value
            context.fillStyle = style.textColor || '#ffffff';
            context.font = '10px sans-serif';
            context.textAlign = 'center';
            const freqVal = Math.round(node.x);
            const label = freqVal >= 1000 ? `${(freqVal / 1000).toFixed(1)}k` : `${freqVal}`;
            const textY = y < paddingTop + 15 ? y + 15 : y - 12;
            context.fillText(label, x, textY);
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
