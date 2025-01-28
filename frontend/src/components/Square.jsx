


const Square = ({ value, onClick }) => {
  return (
    <button
      className="box"
      style={{color : value==='X' ? '#58f7ff' : '#cff800'}}
      onClick={onClick}
    >
      {value}
    </button>
  );
};




export default Square;