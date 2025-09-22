import { Slider, Typography, Box } from '@mui/material';

export default function H_Slider({name,func}) {

    return (<Box>
        <Typography id="input-slider" gutterBottom>
            {name}
        </Typography>
        <Slider aria-label="Temperature" defaultValue={0} valueLabelDisplay="auto"
            shiftStep={30}
            step={1}
            marks
            min={0}
            max={10}
            onChange={func}
        />
    </Box>)
}