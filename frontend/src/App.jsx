import React, { useState, useEffect } from 'react';
import {
  AppBar, Toolbar, Typography, FormGroup, FormControlLabel, Checkbox, Slider,
  Container,
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
import '../components/graph_line.jsx';
import '../components/input_fields.jsx';
import './App.css';
import BasicLineChart from '../components/graph_line.jsx';
import H_Slider from '../components/input_fields.jsx';

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
  const y_data = [2, 3, 4, 5, 6, 7];
  const n = x_data.length;
  const base_arr = Array(n).fill(1);
  const [waveType, setWaveType] = useState('sine');
  const [frequency, setFrequency] = useState(440);
  const [error, setError] = useState(false);
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
    setError(!bool);
    setFrequency(Math.max(20, Math.min(value, 20000)));
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
                error={error}
                helperText={error ? 'Frequency must be between 2 and 20000 Hz' : ''}
                fullWidth
                label="Base Frequency (Hz)"
                type="number"
                value={frequency}
                onChange={(e) => checkFreq(e)}
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
          <BasicLineChart x_data={x_data} y_data={y_data} filter={filter} filter_data={filterData} sx={{ flex: 1 }} />
          <FormGroup sx={{ flex: 1, alignContent: 'center' }}>
            <FormControlLabel control={<Checkbox />} label="Add Filter" onClick={() => setFilter(!filter)} />
            <FormControlLabel control={<Checkbox />} label="Apply Filter" />
          </FormGroup>
          <Box sx={{ flex: 1, alignContent: 'center', p: 8 }}>
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