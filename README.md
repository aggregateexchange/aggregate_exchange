
## About The Project

Aggregate Exchange 
https://www.aggregate.exchange/

Multichain Crypto DEX/swap provider aggregator.
Build in Vite React

This project aims to simplify Swapping/Bridging experience by aggregating multiple providers in one place.
Never loose single cent on picking bad swap provider again. You see them all.

It uses custom Aggregate backend API to fetch quotes for all supported providers.
API Is free to use, you can find details on website docs or in files of this projects on how to use it.

Aggregate does not take any fees. We also dont use contracts. 
That means the transcations are sent **directly** to swap providers.
Allowing users to be eligible to any airdrops or rewards for given projects.

## Getting Started

This is an example of how you may give instructions on setting up your project locally.
To get a local copy up and running follow these simple example steps.

### Prerequisites

You need to have NPM package manager installed.
* npm
  ```sh
  npm install npm@latest -g
  ```

### Installation

Below is simple example how you can download and run the website localy.
It will work exactly same way as the deployed website. https://www.aggregate.exchange/

1. Clone the repo
   ```sh
   git clone https://github.com/aggregateexchange/aggregate.git
   ```
2. Install NPM packages
   ```sh
   npm install
   ```
3. compile project
   ```sh
   npm run build
   ```
4. Run the compiled project or without compilation
   ```sh
   npm run dev
   ```


## Roadmap

- [x] Working project
- [x] Integrate all exchanged/aggregators I can think of
- [X] Develop DEX split search path finding algorithm
- [ ] Add router contract to Aggregate for optimized DEX swaps
- [ ] Integrate Aggregate DEX pathfinding aditionaly do regular swap providers


## Contributing

Any contributions you make are **greatly appreciated**.

If you have a suggestion that would make this better, please fork the repo and create a pull request or open issue.
Don't forget to give the project a star. Thank you ❤️

<!-- LICENSE -->
## License

Distributed under the MIT License. See `LICENSE.txt` for more information.

<!-- CONTACT -->
## Contact

Aggregate - [@Aggregate_ex](https://x.com/Aggregate_ex)
