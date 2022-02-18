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
import Wallet from './components/Wallet/Wallet'
import ToastProvider from './components/ToastProvider/ToastProvider'
import SendTransaction from './components/SendTransaction/SendTransaction'
import SignMessage from './components/SignMessage/SignMessage'
import useAccounts from './hooks/accounts'
import useNetwork from './hooks/network'
import useWalletConnect from './hooks/walletconnect'
import useGnosisSafe from './hooks/useGnosisSafe'
import { useAttentionGrabber, usePortfolio, useAddressBook, useRelayerData, usePrivateMode } from './hooks'
import { useToasts } from './hooks/toasts'
import { useOneTimeQueryParam } from './hooks/oneTimeQueryParam'

const relayerURL = process.env.hasOwnProperty('REACT_APP_RELAYER_URL') ? process.env.REACT_APP_RELAYER_URL : ' https://relayer.ambire.com'

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
  const addressBook = useAddressBook({ accounts })
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
  const addRequest = req => setInternalRequests(reqs => [...reqs, req])

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

  // Portfolio: this hook actively updates the balances/assets of the currently selected user
  const portfolio = usePortfolio({
    currentNetwork: network.id,
    account: selectedAcc
  })
  const privateMode = usePrivateMode()

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
  const showSendTxns = bundle => setSendTxnState({ showing: true, replacementBundle: bundle })
  
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

  // Keeping track of transactions
  const [sentTxn, setSentTxn] = useState([])
  const onBroadcastedTxn = hash => {
    if (!hash) {
      addToast('Transaction signed but not broadcasted to the network!', { timeout: 15000 })
      return
    }
    setSentTxn(sentTxn => [...sentTxn, { confirmed: false, hash }])
    addToast((
      <span>Transaction signed and sent successfully!
        &nbsp;Click to view on block explorer.
      </span>
    ), { url: network.explorerUrl+'/tx/'+hash, timeout: 15000 })
  }

  const [cacheBreak, setCacheBreak] = useState(() => Date.now())
  useEffect(() => {
    if ((Date.now() - cacheBreak) > 5000) setCacheBreak(Date.now())
    const intvl = setTimeout(() => setCacheBreak(Date.now()), 30000)
    return () => clearTimeout(intvl)
  }, [cacheBreak])
  const rewardsUrl = (relayerURL && selectedAcc) ? `${relayerURL}/wallet-token/rewards/${selectedAcc}?cacheBreak=${cacheBreak}` : null
  const rewardsData = useRelayerData(rewardsUrl)

  return (<>
    <Prompt
      message={(location, action) => {
        if (action === 'POP') return onPopHistory()
        return true
    }}/>

    {!!everythingToSign.length && (<SignMessage
      selectedAcc={selectedAcc}
      account={accounts.find(x => x.id === selectedAcc)}
      toSign={everythingToSign[0]}
      totalRequests={everythingToSign.length}
      connections={connections}
      relayerURL={relayerURL}
      resolve={outcome => resolveMany([everythingToSign[0].id], outcome)}
    ></SignMessage>)}

    {sendTxnState.showing ? (
      <SendTransaction
          accounts={accounts}
          selectedAcc={selectedAcc}
          network={network}
          requests={eligibleRequests}
          resolveMany={resolveMany}
          relayerURL={relayerURL}
          onDismiss={() => setSendTxnState({ showing: false })}
          replacementBundle={sendTxnState.replacementBundle}
          onBroadcastedTxn={onBroadcastedTxn}
      ></SendTransaction>
      ) : (<></>)
    }
    
    <Switch>
      <Route path="/add-account">
        {AppHello()}
      </Route>
      <Route path="/wallet">
        <Wallet
          match={{ url: "/wallet" }}
          accounts={accounts}
          selectedAcc={selectedAcc}
          addressBook={addressBook}
          portfolio={portfolio}
          onSelectAcc={onSelectAcc}
          onRemoveAccount={onRemoveAccount}
          allNetworks={allNetworks}
          network={network}
          setNetwork={setNetwork}
          addRequest={addRequest}
          connections={connections}
          // needed by the top bar to disconnect/connect dapps
          connect={connect}
          disconnect={disconnect}
          // needed by the gnosis plugins
          gnosisConnect={gnosisConnect}
          gnosisDisconnect={gnosisDisconnect}
          // required for the security and transactions pages
          relayerURL={relayerURL}
          // required by the transactions page
          eligibleRequests={eligibleRequests}
          showSendTxns={showSendTxns}
          onAddAccount={onAddAccount}
          rewardsData={rewardsData}
          privateMode={privateMode}
        >
        </Wallet>
      </Route>
      <Route path="/">
        <Redirect to={selectedAcc ? "/wallet" : "/add-account" }/>
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
