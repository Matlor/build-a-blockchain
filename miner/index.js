import SHA256 from "crypto-js/sha256.js";
import fetch from "node-fetch";

const run = async () => {
	const server = "http://localhost:5000";

	const TARGET_DIFFICULTY =
		BigInt(0x00005fffffffffffffffffffffffffffffffffffffffffffffffffffffffffff);
	let blockchain = [];
	let lastBlock;

	// missing: genesis transaction that need to be send to client
	let time = new Date().getTime();
	const genesisBlock = {
		timestamp: time,
		nonce: 0,
		difficulty: TARGET_DIFFICULTY.toString(),
		extraData: null,
		height: 0,
	};
	genesisBlock.hash = SHA256(genesisBlock).toString();

	// new Block
	const createBlock = (previousBlock, transactions) => {
		let time = new Date().getTime();
		let block = {
			timestamp: time,
			nonce: 0,
			difficulty: TARGET_DIFFICULTY.toString(),
			extraData: null,
			height: previousBlock.height + 1,
			transactions,
		};

		if (previousBlock.height == 0) {
			block.previousHash = "genesis";
		} else {
			block.previousHash = previousBlock.hash;
		}

		return block;
	};

	const findBlock = (transactions) => {
		if (!lastBlock) {
			lastBlock = genesisBlock;
		}
		let block = createBlock(lastBlock, transactions);

		let hash = SHA256(JSON.stringify(block));
		let hashValue = BigInt(`0x${hash}`);

		while (hashValue > TARGET_DIFFICULTY) {
			block.nonce++;
			hash = SHA256(JSON.stringify(block)).toString();
			hashValue = BigInt(`0x${hash}`);
		}

		block.hash = hash;
		return block;
	};

	const sendBlock = async (newBlock) => {
		const message = JSON.stringify(newBlock);
		const response = await fetch(`${server}/block`, {
			method: "POST",
			body: message,
			headers: { "Content-Type": "application/json" },
		});

		//let responseText = await response.text();
		//console.log(JSON.parse(responseText));
	};

	const getMempool = async () => {
		const response = await fetch(`${server}/mempool`);
		let data = await response.text();
		data = JSON.parse(data);
		return data;
	};

	while (1 > 0) {
		let currentMempoolObj = await getMempool();
		let currentMempool = currentMempoolObj.mempool;
		let newBlock = findBlock(currentMempool);
		blockchain.push(newBlock);
		await sendBlock(newBlock);
		lastBlock = newBlock;
		if (blockchain.length === 3) {
			console.log(blockchain[0].transactions);
			console.log(blockchain[1].transactions);
			console.log(blockchain[2].transactions);
		}
	}
};

run();
