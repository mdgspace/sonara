// import * as React from 'react';
import { LineChart } from '@mui/x-charts/LineChart';

export default function BasicLineChart({x_data, y_data, filter, filter_data}) {
    const app_filter = filter ? filter_data : []; 
  return (
    <LineChart
      xAxis={[{ data: x_data }]} //x_data ek array h
      series={[
        {
          data: y_data,
        },
        {
            curve:"stepBefore", data: app_filter,
        },  
      ]}
      height={300}
    />
  );
}