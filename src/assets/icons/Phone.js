import * as React from 'react';
import Svg, { Path } from 'react-native-svg';

function Phone({ width = 24, height = 24, fill = '#fff', ...props }) {
  return (
    <Svg viewBox="0 0 24 24" width={width} height={height} {...props}>
      <Path
        d="M6.62 10.79a15.054 15.054 0 006.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24
           1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V21c0 .55-.45 1-1 1
           C10.07 22 2 13.93 2 4c0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1
           0 1.24.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"
        fill={fill}
      />
    </Svg>
  );
}

export default Phone;