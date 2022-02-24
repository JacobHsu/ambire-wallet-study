import "./Wallet.scss"

import TopBar from "./TopBar/TopBar"
import SideBar from "./SideBar/SideBar"

export default function Wallet(props) {
  return (
    <div id="wallet">
        <SideBar match={props.match} portfolio={props.portfolio} hidePrivateValue={props.privateMode.hidePrivateValue} />
        <TopBar {...props} />
    </div>
  );
}
