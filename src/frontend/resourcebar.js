
import {BAR_MAX, ELIXIR} from "../data/enums.mjs";

/**
 * ResourceBar renders a row of BAR_MAX purple squares and represents [amount]
 * elixir, where [amount] is a property of props. ResourceBar requires an
 * additional property [animate], which is a bool describing whether a CSS
 * animation should be used to automatically render elixir generation. If
 * [animate] is false, then zero elixir is shown.
 * 
 * If [amount] is less than 0, then the display shows zero elixir; if [amount] 
 * exceeds BAR_MAX, then amount
 * is treated as BAR_MAX. Note the output is a list of JSX elements and needs to
 * be wrapped in a div of the appropriate size.
 *
 * The elixir generating animation is handled automatically by CSS; 
 */
function ResourceBar(props) {
  let squares = []
  for(let i = 0; i < BAR_MAX; i++) {
    let amount = props.amount - i;
    squares.push(<ResourceSquare key={i} amount={amount}
      animate={props.animate} />);
  }
  return squares;
}

/**
 * Helper Component for rendering individual squares
 */
function ResourceSquare(props) {
  if(props.animate) {
    return <div className="resource">
      <div key={props.amount} className="resourceinner" style={{
        animationDuration: ELIXIR + "ms",
        animationDelay: -ELIXIR * props.amount + "ms",
      }}></div>
    </div>
  } else {
    return <div className="resource"></div>
  }
}

export {ResourceBar}
