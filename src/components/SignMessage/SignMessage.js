import './SignMessage.scss'
import * as blockies from 'blockies-ts';

export default function SignMessage ({ toSign, resolve, account, connections, relayerURL, totalRequests }) {
  return (<div id='signMessage'>
    <div id='signingAccount' className='panel'>
      <div className='title'>
        Signing with account
      </div>
      <div className="content">
        <img className='icon' src={blockies.create({ seed: account.id }).toDataURL()} alt='Account Icon'/>
        { account.id }
      </div>
    </div>
  </div>)
}

