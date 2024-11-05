const path = require('path');
const fs = require('fs');
const solc = require('solc');


const ticketSalePath = path.resolve(__dirname, 'contracts', 'TicketSale.sol');
const source = fs.readFileSync(ticketSalePath, 'utf8');

let input = {
  language: "Solidity",
  sources: {
    "TicketSale.sol": {
      content: source,
    },
  },
  settings: {
    outputSelection: {
      "*": {
        "*": ["abi", "evm.bytecode"],
      },
    },
  },
};

const stringInput=JSON.stringify(input);

const compiledCode=solc.compile(stringInput);

const output =JSON.parse(compiledCode);


const contractOutput=output.contracts;

const eComOutput=contractOutput["TicketSale.sol"];


const eComABI=eComOutput.TicketSale.abi;


const eComBytecode=eComOutput.TicketSale.evm.bytecode;


module.exports= {"abi":eComABI,"bytecode":eComBytecode.object};
