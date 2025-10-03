import { useRef } from 'react';
import useCanvasDrawing from '../hooks/useCanvasDrawing';
import useCanvasInteraction from '../hooks/useCanvasInteraction';
import { style } from '../constants/theme';


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