import React from 'react';
import icon from ".../images/icon.png"

interface TitleProps {
  width : string;
  height : string;
  backGroundColor: string;
}

export default function Divider( props: TitleProps ) {
  return (
    <div style={{
      width: props.width,
      height: props.height,
      backgroundColor: props.backGroundColor
    }}>
    </div>
  );
}

