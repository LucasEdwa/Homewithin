import React from 'react';
import { View } from 'react-native';

const Slider = ({ testID, accessibilityLabel, value, onValueChange, ...props }: any) => (
  <View testID={testID ?? accessibilityLabel} accessibilityLabel={accessibilityLabel} />
);

export default Slider;
