
import {BAR_MAX} from "../data/enums.mjs";

/**
 * ResourceBar renders a row of BAR_MAX purple squares and represents [amount]
 * elixir, where [amount] is a property of props. If [amount] is less than 0,
 * then the display shows zero elixir; if [amount] exceeds BAR_MAX, then amount
 * is treated as BAR_MAX. Note the output is a list of JSX elements and needs to
 * be wrapped in a div of the appropriate size.
 */
function ResourceBar(props) {
  let squares = []
  for(let i = 0; i < BAR_MAX; i++) {
    squares.push(<ResourceSquare key={i} amount={props.amount - i}/>);
  }
  return squares;
}

/**
 * Helper Component for rendering individual squares
 */
function ResourceSquare(props) {
  let opacity;
  if(props.amount >= 1) opacity = 1;
  else if(props.amount <= 0) opacity = 0;
  else opacity = 0.7 * props.amount;
  return <div className="resource" style={{
    background:"rgba(170, 0, 170, " + opacity + ")"
  }}></div>;
}

export {ResourceBar}
