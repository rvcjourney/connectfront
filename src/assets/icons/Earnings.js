import * as React from 'react';
import Svg, { Path } from 'react-native-svg';

function Wallet({ width = 24, height = 24, fill = '#fff', ...props }) {
  return (
    <Svg viewBox="0 0 24 24" width={width} height={height} {...props}>
      <Path
        d="M21 7H5c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V9c0-1.1-.9-2-2-2zm0 10H5V9h16v8zm-3-6c-.83 0-1.5.67-1.5 1.5S17.17 14 18 14s1.5-.67 1.5-1.5S18.83 11 18 11zM5 7V5c0-1.1.9-2 2-2h12v2H7c-.55 0-1 .45-1 1z"
        fill={fill}
      />
    </Svg>
  );
}

export default Wallet;