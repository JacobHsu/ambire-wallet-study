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
import ToastProvider from './components/ToastProvider/ToastProvider'
import useNetwork from './hooks/network'

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
  const { network, setNetwork, allNetworks } = useNetwork()
  console.log('network:', network, allNetworks)
  
  return (<>
    <Prompt
      message={(location, action) => {
        if (action === 'POP') return alert('onPopHistory')
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
