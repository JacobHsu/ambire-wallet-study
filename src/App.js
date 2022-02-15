// import logo from './logo.svg';
// import './App.css';
import './App.scss'
import {
  HashRouter as Router,
  Switch,
  Route,
  Redirect,
  Prompt
} from 'react-router-dom'
import { useState, useEffect, useMemo, useCallback } from 'react'
import ToastProvider from './components/ToastProvider/ToastProvider'
import useAccounts from './hooks/accounts'
import useNetwork from './hooks/network'
import useWalletConnect from './hooks/walletconnect'
import useGnosisSafe from './hooks/useGnosisSafe'
import { useToasts } from './hooks/toasts'
import { useOneTimeQueryParam } from './hooks/oneTimeQueryParam'

function AppHello() {
  return (
    <div className="App">
      <header className="App-header">
        {/* <img src={logo} className="App-logo" alt="logo" /> */}
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
    </div>
  );
}

function AppInner () {
  // basic stuff: currently selected account, all accounts, currently selected network
  const { accounts, selectedAcc, onSelectAcc, onAddAccount, onRemoveAccount } = useAccounts()
  const { network, setNetwork, allNetworks } = useNetwork()
  const { addToast } = useToasts()
  const wcUri = useOneTimeQueryParam('uri')

  // Signing requests: transactions/signed msgs: all requests are pushed into .requests
  const { connections, connect, disconnect, requests: wcRequests, resolveMany: wcResolveMany } = useWalletConnect({
    account: selectedAcc,
    chainId: network.chainId,
    initialUri: wcUri,
    allNetworks,
    setNetwork
  })

  const { requests: gnosisRequests, resolveMany: gnosisResolveMany, connect: gnosisConnect, disconnect: gnosisDisconnect } = useGnosisSafe({
	  selectedAccount: selectedAcc,
	  network: network
	}, [selectedAcc, network])

  // Internal requests: eg from the Transfer page, Security page, etc. - requests originating in the wallet UI itself
  // unlike WalletConnect or SafeSDK requests, those do not need to be persisted
  const [internalRequests, setInternalRequests] = useState([])

  // Merge all requests
  const requests = useMemo(
    () => [...internalRequests, ...wcRequests, ...gnosisRequests]
      .filter(({ account }) => accounts.find(({ id }) => id === account)),
    [wcRequests, internalRequests, gnosisRequests, accounts]
  )

  const resolveMany = (ids, resolution) => {
    wcResolveMany(ids, resolution)
    gnosisResolveMany(ids, resolution)
    setInternalRequests(reqs => reqs.filter(x => !ids.includes(x.id)))
  }

  // Show the send transaction full-screen modal if we have a new txn
  const eligibleRequests = useMemo(() => requests
  .filter(({ type, chainId, account }) =>
    type === 'eth_sendTransaction'
    && chainId === network.chainId
    && account === selectedAcc
  ), [requests, network.chainId, selectedAcc])
  const [sendTxnState, setSendTxnState] = useState(() => ({ showing: !!eligibleRequests.length }))
  useEffect(
    () => setSendTxnState({ showing: !!eligibleRequests.length }),
    [eligibleRequests.length]
  )
  
  // Network shouldn't matter here
  const everythingToSign = useMemo(() => requests
  .filter(({ type, account }) => (type === 'personal_sign' || type === 'eth_sign')
    && account === selectedAcc
  ), [requests, selectedAcc])

  // When the user presses back, we first hide the SendTransactions dialog (keeping the queue)
  // Then, signature requests will need to be dismissed one by one, starting with the oldest
  const onPopHistory = () => {
    if (sendTxnState.showing) {
      setSendTxnState({ showing: false })
      return false
    }
    if (everythingToSign.length) {
      resolveMany([everythingToSign[0].id], { message: 'Ambire user rejected the signature request' })
      return false
    }
    return true
  }

  return (<>
    <Prompt
      message={(location, action) => {
        if (action === 'POP') return onPopHistory()
        return true
    }}/>
    
    <Switch>
      <Route path="/wallet">
        {AppHello()}
      </Route>
      <Route path="/">
        <Redirect to="/wallet"/>
      </Route>
    </Switch>
    </>)
}

// handles all the providers so that we can use provider hooks inside of AppInner
function App() {
  return (
    <Router>
      <ToastProvider>
        <AppInner/>
      </ToastProvider>
    </Router>
  )
}

export default App;
