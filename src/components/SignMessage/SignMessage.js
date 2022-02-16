import './SignMessage.scss'
import { toUtf8String, keccak256, arrayify, isHexString } from 'ethers/lib/utils'
import * as blockies from 'blockies-ts';
import { useToasts } from 'hooks/toasts'
import { useState } from 'react'
import { Button } from 'components/common'

export default function SignMessage ({ toSign, resolve, account, connections, relayerURL, totalRequests }) {
  const defaultState = () => ({ codeRequired: false, passphrase: '' })
  const { addToast } = useToasts()
  const [signingState, setSigningState] = useState(defaultState())
  const [isLoading, setLoading] = useState(false)
  
  const connection = connections.find(({ uri }) => uri === toSign.wcUri)
  const dApp = connection ? connection?.session?.peerMeta || null : null
  
  if (!toSign || !account) return (<></>)
  if (toSign && !isHexString(toSign.txn)) return (<div id='signMessage'>
    <h3 className='error'>Invalid signing request: .txn has to be a hex string</h3>
    <Button className='reject' onClick={() => resolve({ message: 'signature denied' })}>Reject</Button>
  </div>)

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

