import React, { useState, useEffect } from 'react';
import {
  AppBar, Toolbar, Typography, FormGroup, FormControlLabel, Checkbox,
  Container, ButtonGroup,
  Paper,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  CssBaseline,
  createTheme,
  ThemeProvider,
} from '@mui/material';
import './components/graph_line.jsx';
import './components/input_fields.jsx';
import './App.css';
import BasicLineChart from './components/graph_line.jsx';
import H_Slider from './components/input_fields.jsx';

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#61dafb',
    },
    secondary: {
      main: '#f50057',
    },
    background: {
      default: '#282c34',
      paper: '#3a3f47',
    },
  },
  typography: {
    h4: {
      fontWeight: 700,
      color: '#61dafb',
    },
    h6: {
      fontWeight: 600,
    },
  },
});

function App() {
  const x_data = [1, 3, 7, 11, 12, 15];
  const [ydata,setYdata] = useState({history:[[2, 3, 4, 5, 6, 7]], current:0});
  const n = x_data.length;
  const [waveType, setWaveType] = useState('sine');
  const [duration, setDuration] = useState(1);
  const [freqError, setFreqError] = useState(false);
  const [durationError, setDurationError] = useState(false);
  const [frequency, setFrequency] = useState(440);
  const [filter, setFilter] = useState(false);
  const [filterData, setFilterData] = useState(Array(n).fill(1));
  const [xOffset, setXOffset] = useState(0);
  const [yOffset, setYOffset] = useState(0);
  const [amplitude, setAmplitude] = useState(1);




  useEffect(() => {
    const stepIndex = Math.floor(n / 10 * xOffset);

    const newArr = Array(n).fill(0)
      .map((value, index) => {
        const valWithAmplitude = index >= stepIndex ? amplitude : 0;

        return valWithAmplitude + yOffset;
      });

    setFilterData(newArr);

  }, [xOffset, yOffset, amplitude, n]);


  const checkFreq = (e) => {
    const value = Number(e.target.value);
    const bool = (value >= 2 && value <= 20000);
    setFreqError(!bool);
    setFrequency(Math.max(20, Math.min(value, 20000)));
  }

  const checkTime = (e) => {
    const value = Number(e.target.value);
    const bool = (value >= 1 && value <= 100);
    setDurationError(!bool);
    setDuration(Math.max(1, Math.min(value, 100)));
  }
  
  const applyFilter = () => {
    if (filter){
      const arr = []; const history = ydata.history; var current = ydata.current;
    for (let i = 0; i < n; i++) {
      arr[i] = filterData[i] * history[current][i];
    }
    history.push(arr); current +=1; 
    setYdata({history:history, current:current});
    setFilter(!filter);
  } else{pass}
}

  const revert = () => {
    const current = ydata.current;
    if (current>0){setYdata({history: ydata.history.slice(0, ydata.current), current: (ydata.current - 1)});}
    else{pass}
  }
  const handleGenerate = () => {
    console.log(`Generating a ${waveType} wave at ${frequency} Hz`);
  };



  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <AppBar position="relative">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, textAlign: 'center' }}>
            ANALYSE WAVES
          </Typography>
        </Toolbar>
      </AppBar>

      <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', md: 'row' } }}>

        <Container maxWidth="sm" sx={{ mt: 4, flex: 1 }}>
          <Paper elevation={8} sx={{ p: 4, borderRadius: '15px', bgcolor: 'background.paper' }}>
            <Typography variant="h4" component="h1" gutterBottom align="center">
              Synthesizer Wave Generator
            </Typography>

            <Box sx={{ mt: 3, mb: 3 }}>
              <FormControl fullWidth>
                <InputLabel id="wave-type-label">Select Wave Type</InputLabel>
                <Select
                  labelId="wave-type-label"
                  id="wave-type-select"
                  value={waveType}
                  label="Select Wave Type"
                  onChange={(e) => setWaveType(e.target.value)}
                >
                  <MenuItem value="sine">Sine Wave</MenuItem>
                  <MenuItem value="square">Square Wave</MenuItem>
                  <MenuItem value="sawtooth">Sawtooth Wave</MenuItem>
                  <MenuItem value="triangle">Triangle Wave</MenuItem>
                </Select>
              </FormControl>
            </Box>

            <Box sx={{ mt: 3, mb: 3 }}>
              <TextField
                error={freqError}
                helperText={freqError ? 'Frequency must be between 2 and 20000 Hz' : ''}
                fullWidth
                label="Base Frequency (Hz)"
                type="number"
                value={frequency}
                onChange={(e) => checkFreq(e)}
                variant="outlined"
              />
            </Box>
             <Box sx={{ mt: 3, mb: 3 }}>
               <TextField
                error={durationError}
                helperText={durationError ? 'Duration must be between 1 and 100 sec' : ''}
                fullWidth
                label="Duration (sec)"
                type="number"
                value={duration}
                onChange={(e) => checkTime(e)}
                variant="outlined"
              />
            </Box>
            <Button
              variant="contained"
              color="primary"
              fullWidth
              size="large"
              onClick={handleGenerate}
              sx={{ mt: 2, py: 1.5, borderRadius: '8px' }}
            >
              Generate
            </Button>
          </Paper>
        </Container>

        <Box sx={{ display: 'flex', gap: 10, flexDirection: 'column', flex: 1, mt: 4 }}>
          <BasicLineChart x_data={x_data} y_data={ydata.history[ydata.current]} filter={filter} filter_data={filterData} sx={{ flex: 1 }} />
          <FormGroup sx={{ flex: 1, alignContent: 'center' }}>
            <FormControlLabel control={<Checkbox />} label="Add Filter" checked={filter} onClick={() => setFilter(!filter)} />
            {/* <FormControlLabel control={<Checkbox />} label="Apply Filter" checked={filter} onClick={applyFilter} /> */}
          </FormGroup>


          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 2 }}>
            <ButtonGroup variant="contained" aria-label="Basic button group">
              <Button color="secondary" onClick={revert}>Revert</Button>
              <Button color="success" onClick={applyFilter}>Apply Filter</Button>
            </ButtonGroup>
          </Box>

          <Box sx={{ flex: 1, justifyContent: 'center', p: 8 }}>
            <H_Slider name="X Offset" func={(e, value) => setXOffset(value)} />
            <H_Slider name="Y Offset" func={(e, value) => setYOffset(value)} />
            <H_Slider name="Amplitude" func={(e, value) => setAmplitude(value)} />
          </Box>
        </Box>

      </Box>
    </ThemeProvider>
  );
}

export default App;