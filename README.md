# Gitcoin-Origo integration

This Repo contains the code that connects the Origo service to Ceramic.

The goal is to issue Verifiable Credentials to Ceramic through Origo by leveraging the W3C Verifiable Credential standard.

## Frontend Architecture

The frontend framework is based on react and imports the following software modules:
- `@self.id/framework` to connect to the ceramic test network `testnet-clay` and to provide the Ethereum wallet authentication.
- custom compiled `@gitcoinco/passport-sdk-writer` SDK project to write via the VC composite to the ceramic network `testnet-clay`.
- origo-ceramic integration sample application files: images, http client module to perform requests to the backend.

## Frontend Compilation and Launch

To start the frontend, developers must first run `npm install` in the root folder of the `grant-ceramic-integration` repository. Then developers must `cd` from the `root` location of the `grant-ceramic-integration` repository into the folder called `frontend/working_writer`. Here developers must compile the custom ceramic writer module with the command `yarn install`. Next, copy the folder `dist` and the file `package.json` from the folder `working_writer` into the folder `frontend/node_modules/@gitcoinco/passport-sdk-writer`.

Now switch bach into the folder `frontend` and execute `npm start` to start the frontend project. The web page will be accessible from at the url `http://localhost:3000/`.
Finally, to generate the compiled frontend code, developers must execute `npm run build` in the folder `frontend`. Afterwards, developers must copy the entire build folder into the location `backend/frontend/` of the `grant-ceramic-integration` backend project. The backend project can be found in the `grant-ceramic-integration` repository branch called `backend`.

## Frontend Workflow

The frontent authenticates users based on their Ethereum wallet and connects users with their wallets to the ceramic test network (clay network as of now). Users without a ceramic account will automatically get an ceramic account. With the account, users can see if any stream data has recently been written to the stream ID of the ceramic account. With the frontend framework, users are supposed to select an third-party API provider. After selecting an API provider, users determine which values of the API users want to proof in zero-knowledge. Users therefore select and configure policy values before requesting the origo service. The origo service is called by sending a http request to the backend. The `grant-ceramic-integration` backend hosts the `grant-ceramic-integration` frontend. The backend service interacts with the origo API and performs a request against the selected third-party provider API (in the sample case Paypal). Our integration framework `CentiID`, consisting of the frontend and the backend, integrate the origo service into the ceramic ecosystem.

After performing the request to the backend, the frontend receives the response of the backend. The response content contains data signed by the origo service API, which attest to a successful TLS oracle interaction against the Paypal API. The backend service thereby acts as a client proving her Paypal account balance against the origo service.

When receiving the response of the backend in the frontend, the frontend code writes the signed attestation of the origo service into the cermic account in form of a verifiable credential signed by the origo service API.
Developers can inspect data on the ceramic network [here](https://tiles.ceramic.community/).

In the case of further questions, please write us an email to `origo.liberty@gmail.com`.

## Backend Architecture

The backend project currently implements a **Golang** web server which hosts the compiled frontend code. Additionally, the backend server implements a handler which accepts POST request from the frontend client. The POST request contains the name of the third-party API and policy. This information is required by to backend to communicate with the third-party API and the policy data is necessary for the backend to know how to interact with the *origo* service. Currently, we interact with the origo service via local program calls, which is going to change and will be replaced with origo gRPC calls. The origo API is currently under development and we replace the interaction sample once the origo gRPC API is deployed. We mock the generation of a signed credential, which is another part what the origo API will return in the future. If the interaction with the third-party API (Paypal in the `grant-ceramic-integration` demo) and the zero knowledge proof computation by the backend and zero knowledge proof verification at the origo service succeeds, we mock the signature upon a credential and further pass back the signed credential to the frontend client.

We plan to provide sample code projects of the CentiID with backends in Node.js, Python, and further requested languages. For the CentiID frontend code, we plan to provide implementation not only in react but Svelte and other frameworks.

## Backend Compilation and Launch

To start the CentiID backend service, switch/cd from the root location of the `grant-ceramic-integration` repository into the folder `backend` and execute `go mod tidy` (which installs Go required packages) and then execute either `go run main.go`, or compile the backend with `go build .` and then start the backend with `./backend`.

Next, visit the url `http://localhost:8080` and you can start interacting with the `grant-ceramic-integration` toolkit CentiID which connects the origo orcale service to the ceramic network.

(optional) If you extend the frontend code and build a new version with `npm run build`, make sure to copy the build folder from `frontend/build` to `backend/frontend/build` before you start the CentiID backend server. This will let you host the new version of the frontend.

## Backend Workflow

The backend implements a static file hosting server and accepts POST request from the frontend. In the request handler, the CentiID backend interacts with the origo service and then mocks a signed verifiable credential, which is then passed back to the frontend client.
