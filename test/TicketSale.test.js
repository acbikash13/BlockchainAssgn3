const assert = require("assert");
const ganache = require("ganache-cli");
const Web3 = require("web3");
const web3 = new Web3(ganache.provider());
const { abi, bytecode } = require("../compile"); // Adjust the path to your compiled contract output

let accounts;
let ticketSale;

beforeEach(async () => {
    // Get a list of all accounts
    accounts = await web3.eth.getAccounts();
    console.log("Deploying the contract from " + accounts); 

    // Deploy the contract
    ticketSale = await new web3.eth.Contract(abi)
        .deploy({ data: bytecode, arguments: [100, web3.utils.toWei("0.01", "ether")] })
        .send({ from: accounts[0],gasPrice: 8000000000, gas: "4700000" });
});

describe("TicketSale Contract", () => {
    it("deploys a contract", () => {
        assert.ok(ticketSale.options.address); // Test if contract address exists
    });

    it("checks owner", async () => {
        const owner = await ticketSale.methods.owner().call();
        assert.equal(owner, accounts[0], "Owner should be the account that deployed the contract");
    });

    it("allows an account to buy a ticket", async () => {
        await ticketSale.methods.buyTicket(1).send({
            from: accounts[1],
            value: web3.utils.toWei("0.01", "ether"),
            gas: "4700000",
        });
        const ticketOwner = await ticketSale.methods.getTicketOf(accounts[1]).call();
        assert.equal(ticketOwner, 1, "Ticket ID should match the bought ticket");
    });

    it("prevents buying more than one ticket per account", async () => {
        await ticketSale.methods.buyTicket(1).send({
            from: accounts[1],
            value: web3.utils.toWei("0.01", "ether"),
            gas: "4700000",
        });
        try {
            await ticketSale.methods.buyTicket(2).send({
                from: accounts[1],
                value: web3.utils.toWei("0.01", "ether"),
                gas: "4700000",
            });
            assert.fail("Expected error not received");
        } catch (err) {
            assert.ok(err, "Error received as expected");
        }
    });

    it("allows a user to offer a ticket for swap", async () => {
        await ticketSale.methods.buyTicket(1).send({
            from: accounts[1],
            value: web3.utils.toWei("0.01", "ether"),
            gas: "4700000",
        });
        await ticketSale.methods.offerSwap(1).send({ from: accounts[1], gas: "4700000" });
        const swapOffer = await ticketSale.methods.swapOffers(1).call();
        assert.equal(swapOffer, 1, "Swap offer should be recorded for ticket ID 1");
    });

    it("allows two users to swap tickets", async () => {
        await ticketSale.methods.buyTicket(1).send({
            from: accounts[1],
            value: web3.utils.toWei("0.01", "ether"),
            gas: "4700000",
        });
        await ticketSale.methods.buyTicket(2).send({
            from: accounts[2],
            value: web3.utils.toWei("0.01", "ether"),
            gas: "4700000",
        });

        await ticketSale.methods.offerSwap(1).send({ from: accounts[1], gas: "4700000" });
        await ticketSale.methods.acceptSwap(1).send({ from: accounts[2], gas: "4700000" });

        const ticketOwner1 = await ticketSale.methods.getTicketOf(accounts[1]).call();
        const ticketOwner2 = await ticketSale.methods.getTicketOf(accounts[2]).call();

        assert.equal(ticketOwner1, 2, "Account 1 should now own ticket ID 2");
        assert.equal(ticketOwner2, 1, "Account 2 should now own ticket ID 1");
    });

    it("allows a user to list a ticket for resale", async () => {
        await ticketSale.methods.buyTicket(1).send({
            from: accounts[1],
            value: web3.utils.toWei("0.01", "ether"),
            gas: "4700000",
        });

        await ticketSale.methods.resaleTicket(web3.utils.toWei("0.008", "ether")).send({
            from: accounts[1],
            gas: "4700000",
        });
        
        const resaleTickets = await ticketSale.methods.checkResale().call();
        assert.equal(resaleTickets.length, 1, "There should be one ticket in the resale list");
        assert.equal(resaleTickets[0], 1, "The resale ticket ID should be 1");
    });

    it("allows another user to purchase a resale ticket", async () => {
        await ticketSale.methods.buyTicket(1).send({
            from: accounts[1],
            value: web3.utils.toWei("0.01", "ether"),
            gas: "4700000",
        });

        await ticketSale.methods.resaleTicket(web3.utils.toWei("0.008", "ether")).send({
            from: accounts[1],
            gas: "4700000",
        });

        await ticketSale.methods.acceptResale(1).send({
            from: accounts[2],
            value: web3.utils.toWei("0.008", "ether"),
            gas: "4700000",
        });

        const newOwner = await ticketSale.methods.getTicketOf(accounts[2]).call();
        assert.equal(newOwner, 1, "Account 2 should be the new owner of ticket ID 1");
    });
});
