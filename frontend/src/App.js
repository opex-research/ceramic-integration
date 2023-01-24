// @ts-ignore
import React, { useState } from "react";

// origo and sample integration specific images
import logo from "./GitcoinLogo.svg";
// import logoOrigo1 from "./logo-origo1.png";
import logoOrigo1 from "./origo_logo_3.png";
import logoMetamask from "./MetaMask.png";
import logoPaypal from "./paypal.png";
import logoPlaid from "./plaid.jpg";
import logoTwitter from "./twitter.png";
import logoWhatsapp from "./whatsapp.png";
import "./App.css";

// ceramic reader and writer SDKs
import PassportWriter from "@gitcoinco/passport-sdk-writer/dist/writer.js";
// check existing stamps here: https://tiles.ceramic.community/

// wallet import and ceramic network connection
import { Provider, EthereumAuthProvider, useViewerConnection } from '@self.id/framework'

function App({children}) {
  const [streamIdInput, setStreamIdInput] = useState("");
  const [ceramicPassport, setCeramicPassport] = useState(new Object());
  const [connection, connect, disconnect] = useViewerConnection();

  // origo sample policies
  const policy_paypal1 = {
    "apis": [
      {
        "url": "https://api-m.sandbox.paypal.com/v2/checkout/orders/",
        "content-type": "application/json",
        "pattern": "\"currency_code\":\"USD\",\"value\":\"[0-9]+.[0-9]+\",",
        "creds": true
      }
    ],
    "constraints": [
      {
        "value": "098.00",
        "constraint": "GT"
      }
    ],
    "proxies": [
      {
        "host": "localhost",
        "port": "8082",
        "mode": "signature",
        "pubKey": "3282734573475",
        "algorithm": "Ed25519"
      }
    ]
  }

  const policy_show1 = {
    "apis": [
      {
        "url": "https://api-m.sandbox.paypal.com/v2/checkout/orders/",
        "pattern": "\"currency_code\":\"USD\",\"value\":\"[0-9]+.[0-9]+\",",
      }
    ],
    "verifier": [
      {
        "mode": "signature",
        "pubKey": "3282734573475",
        "algorithm": "Ed25519"
      }
    ]
  }

  // js functions
  async function handleSubmit1(event) {
    event.preventDefault();
    let pw = new PassportWriter(connection.selfID.did);
    await pw.deleteStamp(streamIdInput);
    setStreamIdInput("");
    await getPassportWriter();
  };

  async function getPassportWriter() {
    let pw = new PassportWriter(connection.selfID.did);
    let cpp = await pw.getPassport();
    setCeramicPassport(cpp);
    console.log("ceramicPassport", cpp);
  }

  async function addStamp(event) {
    event.preventDefault();

    // policy value preprocessing
    var value = document.getElementById("policy_constraint").value;
    var value2 = document.getElementById("policy_balance").value;
    if (value2 == "") {
      console.log("please specify a balance value.")
      return 0
    }
    if (parseFloat(value2) <= 0) {
        console.log("please specify a balance above 0.")
      return 0
    }
    if (!value2.includes(".")) {
        value2 = value2+".00";
    }
    var first = value2.split(".")[0]
    if (first.length == 1) {
      first = "00"+first;
    } else if (first.length == 2) {
      first = "0"+first;
    } else if (first.length > 3) {
      console.log("please specify a balance below 1000.")
      return 0
    }

    // value preprocessing
    var last = value2.split(".")[1]
    if (last.length == 0) {
      last = "00";
    } else if (last.length == 1) {
      last = last+"0";
    } else if (last.length > 2) {
      console.log("please specify a balance value with max 2 decimal digits (e.g. xx.00 ).")
      return 0
    }

    var finalNumber = first+"."+last;
    let policy_selected = policy_paypal1;
    policy_selected["constraints"][0]["value"] = finalNumber;
    policy_selected["constraints"][0]["constraint"] = value;

    // request to backend which interacts with the origo API.
    const requestOptions = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ constraint: value, balance: finalNumber })
    };
    // styling
    document.getElementById("mySidebar").style.display = "none";

    // fetch origo service via the backend
    const response = await fetch('/origo', requestOptions)
    let data = await response.json()
    let json = JSON.parse(JSON.stringify(connection.selfID.did))
    
    // create stamp which can be written to the ceramic network based on the VC composite
    const newStamp = {
      provider: "ORIGO",
      title: "origo paypal stamp",
      credential: {
        "@context": [
          "https://www.w3.org/2018/credentials/v1",
          "https://www.w3.org/2018/credentials/examples/v1"
        ],
        "issuer": json["_id"],
        "issuanceDate": data.issuedate,
        "credentialSubject": {
          "id": json["_parentId"],
          "origo_policy": policy_selected
        },
        "type": [
          "VerifiableCredential",
        ],
        "proof": {
          "type": "Ed25519Signature2018",
          "created": new Date().toISOString(),
          "jws": data.signature,
          "proofPurpose": "assertionMethod",
          "verificationMethod": "https://example.edu/issuers/keys/1"
        },
        "expirationDate": data.expiredate
      }
    };

    // write to ceramic
    const pw = new PassportWriter(connection.selfID.did);
    const ok = await pw.addStamp(newStamp);
    console.log("adding stamp successfull");
    await getPassportWriter();
  }

  // sidebar js
  async function w3_close(event) {
    event.preventDefault();
    document.getElementById("mySidebar").style.display = "none";
  }
  async function w3_open(event) {
    event.preventDefault();
    document.getElementById("mySidebar").style.display = "block";
  }

  // connect wallet handler
  async function handleConnect(event) {
    event.preventDefault();
    
    // connect with ethereum wallet
    const accounts = await window.ethereum.request({
      method: 'eth_requestAccounts',
    })
    const selfid = await connect(new EthereumAuthProvider(window.ethereum, accounts[0]))

    // get the writer instance
    let pw = new PassportWriter(selfid.did);
    let cpp = await pw.getPassport();
    console.log("ceramicPassport", cpp);

    if (cpp == false) {
      let pw = new PassportWriter(selfid.did);
      let streamID = await pw.createPassport();
      console.log("streamID", streamID);
    }

    setCeramicPassport(cpp);
    return
  };

  return (
    <Provider client={{ceramic: 'testnet-clay'}} session={true}>{children}
      <div className="App">

      <div className="w3-sidebar w3-bar-block w3-card w3-animate-right" style={{display:"none", width:"450px", right:"0"}} id="mySidebar">
        <button className="w3-hover-red w3-center w3-button w3-large w3-border-red" style={{width: "92%", marginLeft: "4%", marginTop: "4%"}} onClick={w3_close}>Close &times;</button>
        <br></br>
        <div className="w3-center">
          <img className="w3-padding-large" src={logoPaypal} alt="Paypal" style={{width: "auto", height: "120px"}} />
        </div>

        <div className="w3-row w3-section w3-margin w3-padding">
          <div className="w3-col" style={{width:"100px", paddingTop: "8px", paddingBottom: "8px"}}><b>Value:</b></div>
          <div className="w3-rest">
            <input id="policy_balance" className="w3-input w3-border w3-hover-blue" name="balance" type="number" min="0" max="999" placeholder="e.g. 97" />
          </div>
        </div>

        <div className="w3-row w3-section w3-margin w3-padding">
          <div className="w3-col" style={{width:"100px", paddingTop: "8px", paddingBottom: "8px"}}><b>Constraint:</b></div>
          <div className="w3-rest">
             <select id="policy_constraint" className="w3-select w3-border w3-hover-blue" name="constraint" defaultValue={'GT'}>
              <option value="GT">Greater Than</option>
              <option value="LT">Less Than</option>
            </select> 
          </div>
        </div>

        <div className="w3-row w3-section w3-center">
           <div><a className="w3-tooltip w3-hover-text-blue">More Information
            <span style={{position:"absolute", left:"-160px", width: "412px", bottom:"18px", padding: "0px"}}
            className="w3-text w3-tag w3-border w3-margin w3-border-black">

               <ul className="w3-ul w3-pale-blue">
                 {Object.keys(policy_show1).map((innerAttr, index) => {
                   return (
                     <li key={innerAttr}><b>{innerAttr}:</b> {JSON.stringify(policy_show1[innerAttr], null, 4)}</li>
                   )})
                 }
                </ul>
            </span>
            </a>
            </div> 
        </div>

        <a onClick={addStamp} className="w3-hover-green w3-center w3-bar-item w3-button w3-border w3-border-green" style={{width: "92%", marginLeft: "4%"}}>Verify</a>
      </div>

      {connection.status === 'connected' &&
        <div>
        <div className="absolute2" style={{wordBreak: "break-all", whiteSpace: "normal"}}>
          <b>Connection ID:</b>
          <p style={{ margin: "0px", fontSize: "8px"}}>{connection.selfID.id}</p>
        </div>
        <div className="absolute">
        <a onClick={() => {disconnect()}} className="w3-button"><img src={logoMetamask} className="logo" style={{height: "22px"}} alt="logo" /> Disconnect</a>
        </div>
        </div>
      }
        <div className="w3-top">
          <div className="w3-bar w3-white w3-wide w3-padding w3-card">
            <div className="w3-left w3-hide-small">
              <a href="#home" className="w3-button w3-bar-item" style={{pointerEvents: 'none'}}>
              <img src={logoOrigo1} className="origo-logo" style={{height: "22px"}} alt="logo" />
              <b> rigo</b> | <img src={logo} className="logo" style={{height: "22px"}} alt="logo" />
              </a>
            </div>
            <div className="w3-right w3-hide-small">
              <a onClick={handleConnect} className="w3-bar-item w3-button"><img src={logoMetamask} className="logo" style={{height: "22px"}} alt="logo" /> Connect Wallet</a>
            </div>
          </div>
        </div>

        <div className="w3-content w3-padding" style={{maxWidth:"1564px", marginTop: "57px"}}>

          <div className="w3-container w3-padding-32" id="projects">
            <h3 className="w3-border-bottom w3-border-light-grey w3-padding-16">Supported Projects</h3>
          </div>

          <div className="w3-row-padding">
            <div className="w3-col l3 m6 w3-margin-bottom">
              <div className="w3-display-container">
                <div className="w3-card-4 w3-center">
                  <img className="w3-padding-large" src={logoPaypal} alt="Paypal" style={{width: "auto", height: "120px"}} />
                  <div className="w3-container w3-center">
                    <p>PayPal Sandbox API</p>
                  </div>
                  <button className="w3-button w3-block w3-dark-grey" onClick={w3_open}>+ Connect</button>
                </div>
              </div>
            </div>
            <div className="w3-col l3 m6 w3-margin-bottom">
              <div className="w3-display-container">
                <div className="w3-card-4 w3-center">
                  <img className="w3-padding-large" src={logoTwitter} alt="Paypal" style={{width: "auto", height: "120px"}} />
                  <div className="w3-container w3-center">
                    <p>Twitter Account API</p>
                  </div>
                  <button className="w3-button w3-block w3-dark-grey" disabled>(coming soon)</button>
                </div>
              </div>
            </div>
            <div className="w3-col l3 m6 w3-margin-bottom">
              <div className="w3-display-container">
                <div className="w3-card-4 w3-center">
                  <img className="w3-padding-large" src={logoPlaid} alt="Paypal" style={{width: "auto", height: "120px"}} />
                  <div className="w3-container w3-center">
                    <p>Plaid Fintech API</p>
                  </div>
                  <button className="w3-button w3-block w3-dark-grey" disabled>(coming soon)</button>
                </div>
              </div>
            </div>
            <div className="w3-col l3 m6 w3-margin-bottom">
              <div className="w3-display-container">
                <div className="w3-card-4 w3-center">
                  <img className="w3-padding-large" src={logoWhatsapp} alt="Paypal" style={{width: "auto", height: "120px"}} />
                  <div className="w3-container w3-center">
                    <p>WhatsApp Business</p>
                  </div>
                  <button className="w3-button w3-block w3-dark-grey" disabled>(coming soon)</button>
                </div>
              </div>
            </div>
          </div>

          <div className="w3-container w3-padding-32" id="Passport">
            <h3 className="w3-border-bottom w3-border-light-grey w3-padding-16">Manage Passport</h3>
          </div>
          <div className="w3-row-padding" style={{position: "relative"}}>

                <div className="w3-half">
                  <div className="w3-display-container w3-padding-large" style={{height: "100%"}}>
                  <label><b>Passport Data:</b></label>
                  {ceramicPassport && (
                    <div style={{ padding: 10, fontSize: 10, textAlign: "left" }}>
                      { ceramicPassport?.expiryDate && (
                          <p> Expiry Date:{" "} 
                            { 
                              ceramicPassport?.expiryDate.toString()
                            }
                          </p>
                        )
                      }
                      { ceramicPassport?.issuanceDate && (
                          <p> Issuance Date:{" "} 
                            { 
                              ceramicPassport?.issuanceDate.toString() 
                            }
                          </p>
                        )
                      }
                      { ceramicPassport?.stamps?.length > 0 && (
                          <div> Stamps:{" "}
                            <ul>
                              {
                                ceramicPassport?.stamps?.map((item, index) => {
                                return (
                                  <li key={index} style={{wordWrap: "break-word"}}>{item.streamId}</li>
                                )})
                              }
                            </ul>
                          </div>
                      )
                    }
                    </div>
                  )
                    }
                  </div>
                </div>

                <div className="w3-half">
                  <div className="w3-display-container w3-padding-large">
                  <label><b>StreamID:</b></label>
                    <form className="w3-row">
                      <div className="w3-col" style={{width: "70%"}}>
                      <input className="w3-input" type="text" name="inputStreamId"
                        onChange={(e) => setStreamIdInput(e.target.value)} value={streamIdInput}
                      />
                      </div>
                      <div className="w3-rest w3-center">
                        <button style={{width: "85px"}} className="w3-border w3-button w3-hover-red" onClick={handleSubmit1}>Delete</button>
                      </div>
                    </form>
                </div>
              </div>

          </div>

        </div>

        <br></br>
            <br></br>
        {/* <footer className="w3-center w3-card w3-white w3-padding-16">
          <p className="w3-hover-text-blue">Copyright © ORIGO 2022</p>
        </footer> */}

      </div>
    </Provider>
  );
}

export default App;
