// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract TicketSale {
    address public owner;
    uint public ticketPrice;
    uint public numTickets;
    uint[] public resaleTickets;

    struct Ticket {
        uint ticketId;
        address owner;
        bool isForSale;
        uint resalePrice;
    }

    mapping(uint => Ticket) public tickets;
    mapping(address => uint) public ownerToTicket;
    mapping(uint => uint) public swapOffers;

    constructor(uint _numTickets, uint _ticketPrice) {
        owner = msg.sender;
        numTickets = _numTickets;
        ticketPrice = _ticketPrice;

        for (uint i = 1; i <= numTickets; i++) {
            tickets[i] = Ticket(i, address(0), false, 0);
        }
    }

    function buyTicket(uint ticketId) public payable {
        require(ticketId > 0 && ticketId <= numTickets, "Invalid ticket ID");
        require(tickets[ticketId].owner == address(0), "Ticket already sold");
        require(msg.value == ticketPrice, "Incorrect payment amount");
        require(ownerToTicket[msg.sender] == 0, "Already own a ticket");

        tickets[ticketId].owner = msg.sender;
        ownerToTicket[msg.sender] = ticketId;
    }

    function getTicketOf(address person) public view returns (uint) {
        return ownerToTicket[person];
    }

    function offerSwap(uint ticketId) public {
        require(ownerToTicket[msg.sender] == ticketId, "You don't own this ticket");

        swapOffers[ticketId] = ticketId;
    }

    function acceptSwap(uint ticketId) public {
        uint partnerTicketId = swapOffers[ticketId];
        require(partnerTicketId > 0, "No swap offer exists");
        require(ownerToTicket[msg.sender] > 0, "You do not own a ticket");

        address partner = tickets[partnerTicketId].owner;
        require(partner != address(0), "Invalid partner");

        tickets[partnerTicketId].owner = msg.sender;
        tickets[ownerToTicket[msg.sender]].owner = partner;

        ownerToTicket[partner] = ownerToTicket[msg.sender];
        ownerToTicket[msg.sender] = partnerTicketId;

        delete swapOffers[ticketId];
    }

    function resaleTicket(uint price) public {
        uint ticketId = ownerToTicket[msg.sender];
        require(ticketId > 0, "You do not own a ticket");

        tickets[ticketId].isForSale = true;
        tickets[ticketId].resalePrice = price;
        resaleTickets.push(ticketId);
    }

    function acceptResale(uint ticketId) public payable {
        require(tickets[ticketId].isForSale, "Ticket not for resale");
        require(msg.value == tickets[ticketId].resalePrice, "Incorrect payment amount");
        require(ownerToTicket[msg.sender] == 0, "Already own a ticket");

        uint resalePrice = tickets[ticketId].resalePrice;
        uint serviceFee = resalePrice / 10;
        address seller = tickets[ticketId].owner;

        payable(seller).transfer(resalePrice - serviceFee);
        payable(owner).transfer(serviceFee);

        tickets[ticketId].owner = msg.sender;
        ownerToTicket[msg.sender] = ticketId;

        tickets[ticketId].isForSale = false;
        tickets[ticketId].resalePrice = 0;

        for (uint i = 0; i < resaleTickets.length; i++) {
            if (resaleTickets[i] == ticketId) {
                resaleTickets[i] = resaleTickets[resaleTickets.length - 1];
                resaleTickets.pop();
                break;
            }
        }
    }

    function checkResale() public view returns (uint[] memory) {
        return resaleTickets;
    }
}
