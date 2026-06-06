import BeatLoader from "react-spinners/BeatLoader";

export default function Loading () {

  return (
    <div style={{height:'100%', display:'flex', alignItems:'center', justifyContent:'center'}}>
        <BeatLoader
          color="#1B1B1B"
          speedMultiplier={1}
          size={10}
        />
    </div>
  );
}

