## Development

This section documents the basics running instructions on running / developing on the grant-explorer package.

### Pre Requisites

Before running any command, make sure to install dependencies:

```sh
$ yarn install
```

Create environment files, and fill in environment variables with your own values
```sh
cp ../.env.sample ../.env
```

The following may be helpful when filling in the the environment variables.

For `REACT_APP_PINATA_JWT` and `REACT_APP_PINATA_GATEWAY`, create your own Pinata account

The `REACT_APP_INFURA_ID` can be filled by creating a free Infura account

`REACT_APP_SUBGRAPH_GOERLI_API`, and `REACT_APP_SUBGRAPH_OPTIMISM_MAINNET_API` can be found at 
`grants-round/blob/main/packages/graph/README.md`

### Run in Development

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.\
You will also see any lint errors in the console.

```sh
$ yarn start
```

### Lint TypeScript

Lint the TypeScript code:

```sh
$ yarn lint:ts
```

### Test

Run the Mocha tests:

```sh
$ yarn test
```

### Run in Production

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

```sh
$ yarn build
```

Serve on port 3000

```sh
$ npm install -g serve
$ serve -s build -l 3000
```

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app), using the [Redux](https://redux.js.org/) and [Redux Toolkit](https://redux-toolkit.js.org/) TS template.


### Adding a new route
Global routing configuration is held in `src/index.tsx`. Below is an example of a route definition

```jsx=
<Route path="/" element={<ListGrants />} />
<Route path="/cart" element={<ListCartItems />} />
```

A protected route i.e a routed which requires a user's wallet connection should be within the parent `ProtectedRoute` component route

```jsx=
<Route element={<ProtectedRoute />}>
  <Route path="/" element={<ListGrants />} />
  <Route path="/cart" element={<ListCartItems />} />
</Route>
```

Find more information about routing [here](https://reactrouter.com/docs/en/v6).


### Creating a new feature
This is as easy as creating a new folder in the `features` directory that holds all the resources for that particular feature.

The directory structure requires that all components and services which are related to a particular feature be kept in a subdirectory of the `features` directory.

Observe the directory structure for Authentication feature in `features/auth`

```
├── features
│   ├── auth
│   │   ├── ProtectedRoute.tsx
│   │   ├── web3Service.tsx
```

It contains the `ProtectedRoute` component and `web3Service` which extends the base API service defined in `src/api.ts` by endpoint injection.

### Defining a new API
Some features require server-side state management which involves keeping the UI in sync with an external data source e.g REST/GraphQL API service, Smart Contract etc. We use [RTK Query](https://redux-toolkit.js.org/rtk-query/overview) which is

> a powerful data fetching and caching tool. It is designed to simplify common cases for loading data in a web application, eliminating the need to hand-write data fetching & caching logic yourself

All queries and mutations inject endpoints into the base API `src/api.ts`

```typescript=
import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react"

// initialize an empty api service that we'll inject endpoints into later as needed
export const api = createApi({
  reducerPath: "api",
  baseQuery: fakeBaseQuery<string>(),
  endpoints: () => ({}),
})
```

web3Service.tsx

```typescript=
export const web3Api = api.injectEndpoints({
  endpoints: (builder) => ({
    getWeb3: builder.query<Web3Instance, void>({
      queryFn: async () => {
        ...
      },
    }),
  }),
  overrideExisting: false
})

export const { useGetWeb3Query } = web3Api
```

UI components access data and states thus,

```jsx=
const { data, error, refetch, isSuccess, isFetching, isLoading } = useGetWeb3Query()
```

### Tools
[Redux Toolkit](https://redux-toolkit.js.org/)
[RTK Query](https://redux-toolkit.js.org/tutorials/rtk-query)
[React Hook Form](https://react-hook-form.com/get-started)