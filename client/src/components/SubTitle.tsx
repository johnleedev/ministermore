
interface TitleProps {
  name : string
}

export default function SubTitle( props: TitleProps ) {
  return (
    <div style={{
      width: '100%', 
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: '20px',
      marginBottom: '20px'
    }}>
      <h3 style={{fontSize: '24px'}}>{props.name}</h3>
    </div>
  );
}

