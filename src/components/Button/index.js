import React from 'react';
import CosmicButton from '../CosmicButton';

/**
 * @param {'primary'|'secondary'|'outline'|'ghost'|'success'|'danger'|'nebula'|'premium'|'info'|'warning'|'goldOutline'} variant
 */
const Button = ({
  text,
  backgroundColor,
  onPress,
  disabled = false,
  loading = false,
  variant = 'primary',
  style = {},
  textStyle = {},
}) => {
  return (
    <CosmicButton
      label={text}
      onPress={onPress}
      disabled={disabled}
      loading={loading}
      variant={variant}
      style={style}
      textStyle={textStyle}
    />
  );
};

export default Button;
