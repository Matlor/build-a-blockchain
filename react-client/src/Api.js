const server = "http://localhost:5000";

const sendTransaction = async (transaction) => {
	const message = JSON.stringify(transaction);
	const response = await fetch(`${server}/transaction`, {
		method: "POST",
		body: message,
		headers: { "Content-Type": "application/json" },
	});

	console.log(await response.text(), "response");
};

const getBalances = async () => {
	const response = await fetch(`${server}/balances`);
	let data = await response.json();
	data = JSON.stringify(data);
	return data;
};

export { sendTransaction, getBalances };
