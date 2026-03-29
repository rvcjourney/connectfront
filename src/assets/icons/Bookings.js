// import * as React from 'react';
// import Svg, { Path } from 'react-native-svg';

// function Bookings(props) {
//   return (
//     <Svg viewBox="0 0 24 24" {...props}>
//       <Path
//         d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zm-5.04-6.71l-2.75-3.54-4.02 5.17h12l-3.98-5.1-1.25 1.6z"
//         fill={props.fill || '#fff'}
//       />
//     </Svg>
//   );
// }

// export default Bookings;

import * as React from 'react';
import Svg, { Path } from 'react-native-svg';

function Bookings({ width = 24, height = 24, fill = '#fff', ...props }) {
  return (
    <Svg viewBox="0 0 24 24" width={width} height={height} {...props}>
      <Path
        d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14
           c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11zm0-13H5V6h14v1z"
        fill={fill}
      />
    </Svg>
  );
}

export default Bookings;