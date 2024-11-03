const path = require('path');
const fs = require('fs');
const solc = require('solc');

// Path to the Solidity contract

const source = fs.readFileSync('./contracts/TicektSale.sol', 'utf8');
// Solidity compiler input format
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

console.log("Compiling the contract...\n" + input);

// Compile the contract
const stringInput = JSON.stringify(input);
const compiledCode = solc.compile(stringInput);
const output = JSON.parse(compiledCode);

// Access the compiled contract
const contractOutput = output.contracts["TicketSale.sol"];
const ecommerceOutput = contractOutput.TicketSale; // Match this with the contract name

// Extract ABI and Bytecode
const ecommerceABI = ecommerceOutput.abi;
const ecommerceBytecode = ecommerceOutput.evm.bytecode.object;

// Export the ABI and Bytecode for deployment
module.exports = { "abi": ecommerceABI, "bytecode": ecommerceBytecode.object };

