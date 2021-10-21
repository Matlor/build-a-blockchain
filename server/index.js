const express = require("express");
const cors = require("cors");
const SHA256 = require("crypto-js/sha256");

const EC = require("elliptic").ec;
const ec = new EC("secp256k1");
const app = express();

let blockchain = [];
let mempool = [];
let balances = [{ publicKey: "satoshi", balance: 100 }];

app.use(cors());
app.use(express.json());

app.get("/mempool", function (req, res) {
	let answer = { mempool: mempool };
	answer = JSON.stringify(answer);
	res.send(answer);
});

// Goes through received Block and checks each transaction
// Adds the value in it to the balance
// Adds key and balance if not in there yet
// Takes that transaction out of the memepool once done
app.post("/block", (req, res) => {
	const block = req.body;
	blockchain.push(block);

	for (let i = 0; i < block.transactions.length; i++) {
		// One transaction
		senderPublicKey = block.transactions[i].sender;
		receiverPublicKey = block.transactions[i].message.receiver;
		amount = parseInt(block.transactions[i].message.amount);

		// preparation to add to balance
		let newAccount = {};
		newAccount.publicKey = receiverPublicKey;
		newAccount.balance = amount;

		// check if receiver exists
		let indexReceiver = balances.findIndex(
			(account) => account.publicKey === receiverPublicKey
		);

		// take index of sender which should exist.
		let indexSender = balances.findIndex(
			(account) => account.publicKey === senderPublicKey
		);

		if (indexReceiver >= 0) {
			balances[indexReceiver].balance += amount;
			balances[indexSender].balance -= amount;
		} else {
			balances.push(newAccount);
			balances[indexSender].balance -= amount;
		}

		console.log(balances, "balances after including transaction");

		// delete trans from mempool
		let index = mempool.findIndex(
			(item) => JSON.stringify(item) == JSON.stringify(block.transactions[i])
		);

		mempool.splice(index, 1);
		console.log(mempool, "mempool after slpicing transaction");
	}

	res.send({ Blockchain: blockchain });
});

const verifySignature = (transaction) => {
	// verifying Signature:
	let msgHashString = SHA256(transaction.message).toString();
	let keyToVerify = ec.keyFromPublic(transaction.sender, "hex");
	if (keyToVerify.verify(msgHashString, transaction.sig) === true) {
		return true;
	} else {
		return false;
	}
};

const hasEnoughFunds = (sender, amount) => {
	if (amount < 0) {
		return false;
	}

	let hasBalance = false;
	let canAfford = false;

	// does sender has a balance
	let index = balances.findIndex((account) => account.publicKey === sender);

	// if sender has balance, check it
	let balance;
	if (index !== -1) {
		hasBalance = true;
		balance = balances[index].balance;
	}

	// is sender trying to double spend in the current block
	let additionalSpent = null;
	for (let i = 0; i < mempool.length; i++) {
		if (mempool[i].sender === sender) {
			additionalSpent -= mempool[i].message.amount;
		}
	}
	if (balance + additionalSpent >= amount) {
		canAfford = true;
	}

	return canAfford;
};

// checks signature
// checks if user has enough funds
// checks if it is first transaction whatsoever
// if yes, sends satoshis balance to the receiver
// pushes transaction to mempool if ok
app.post("/transaction", (req, res) => {
	let transaction = req.body;
	console.log(transaction, "received transaction");
	let sender = transaction.sender;
	let amount = parseInt(transaction.message.amount);

	let approved = false;
	let enoughFunds = false;

	// verify signature
	approved = verifySignature(transaction);

	// check funds
	enoughFunds = hasEnoughFunds(sender, amount);

	if (
		approved &&
		!enoughFunds &&
		balances.length === 1 &&
		mempool.length === 0
	) {
		// change transaction to give user satoshis balance
		transaction.sig = "satoshis signature";
		transaction.message.amount = balances[0].balance;
		transaction.sender = balances[0].publicKey;
		enoughFunds = true;
	}

	// Push to mempool if approved and enough Funds
	if (approved && enoughFunds) {
		mempool.push(transaction);
		console.log(mempool, "mempool");
	} else {
		console.log("rejected");
	}

	res.send({ response: "pending" });
});

app.get("/balances", function (req, res) {
	let answer = { balances: balances };
	answer = JSON.stringify(answer);
	res.send(answer);
});

app.listen(5000);
