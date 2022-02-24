import "./Wallet.scss"

import { Switch, Route, Redirect, useLocation  } from "react-router-dom"
import TopBar from "./TopBar/TopBar"
import SideBar from "./SideBar/SideBar"
import Deposit from "./Deposit/Deposit"
import { useCallback, useEffect, useMemo, useRef } from 'react'

export default function Wallet(props) {
  const walletContainer = useRef()
  const isLoggedIn = useMemo(() => props.accounts.length > 0, [props.accounts])
  const routes = [
    {
      path: '/deposit',
      component: <Deposit selectedAcc={props.selectedAcc} selectedNetwork={props.network.id} />
    },
  ]

  const LoggedInGuard = () => (
    !isLoggedIn ? <Redirect to="/add-account"/> : null
  )

  return (
    <div id="wallet">
        <SideBar match={props.match} portfolio={props.portfolio} hidePrivateValue={props.privateMode.hidePrivateValue} />
        {/* <TopBar {...props} /> */}
        <div id="wallet-container" ref={walletContainer}>
          <div id="wallet-container-inner">
            <Switch>
              {
                routes.map(({ path, component }) => (
                  <Route exact path={props.match.url + path} key={path}>
                    <LoggedInGuard/>
                    { component ? component : null }
                  </Route>
                ))
              }
              <Route path={props.match.url + '/*'}>
                <Redirect to={props.match.url + '/dashboard'} />
              </Route>
              <Route path={props.match.url}>
                <LoggedInGuard/>
              </Route>
            </Switch>
          </div>
        </div>
    </div>
    
  );
}
