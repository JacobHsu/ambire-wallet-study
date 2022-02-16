import './SignMessage.scss'
import { MdBrokenImage, MdCheck, MdClose } from 'react-icons/md'
import { toUtf8String, keccak256, arrayify, isHexString } from 'ethers/lib/utils'
import * as blockies from 'blockies-ts';
import { useToasts } from 'hooks/toasts'
import { useState } from 'react'
import { Button, Loading, TextInput } from 'components/common'

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
      <div className='panel'>
        <div className='title'>
          Sign message
        </div>
        <div className='request-message'>
          <div className='dapp-message'>
            { 
              dApp ?
                <a className='dapp' href={dApp.url} target="_blank" rel="noreferrer">
                  <div className='icon' style={{ backgroundImage: `url(${dApp.icons[0]})` }}>
                  <MdBrokenImage/> 
                  </div>
                  { dApp.name }
                </a>
                :
                'A dApp '
            }
            is requesting your signature.
          </div>
          <span>{totalRequests > 1 ? `You have ${totalRequests - 1} more pending requests.` : ''}</span>
        </div>

        <textarea
          className='sign-message'
          type='text'
          value={getMessageAsText(toSign.txn)}
          readOnly={true}
        />

        <div className='actions'>
          <form onSubmit={e => { e.preventDefault() }}>
            {account.signer.quickAccManager && (<>
              <TextInput
                password
                required minLength={3}
                placeholder='Account password'
                value={signingState.passphrase}
                onChange={value => setSigningState({ ...signingState, passphrase: value })}
              ></TextInput>
            </>)}

            <div className="buttons">
              <Button
                danger
                icon={<MdClose/>}
                className='reject'
                onClick={() => resolve({ message: 'signature denied' })}
              >Reject</Button>
              {/* <Button className='approve' onClick={approve} disabled={isLoading}>
                {isLoading ? (<><Loading/>Signing...</>)
                : (<><MdCheck/> Sign</>)}
              </Button> */}
            </div>
          </form>
        </div>
        
      </div>


    </div>
  </div>)
}

function getMessageAsText(msg) {
  try { return toUtf8String(msg) }
  catch(_) { return msg }
}

