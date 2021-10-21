import { useState } from "react";
import DropdownButton from "react-bootstrap/DropdownButton";
import Dropdown from "react-bootstrap/Dropdown";
import "bootstrap/dist/css/bootstrap.min.css";
import { sendTransaction, getBalances } from "./Api";
import "./App.css";

var EC = require("elliptic").ec;
var ec = new EC("secp256k1");
const SHA256 = require("crypto-js/sha256");

const App = () => {
	const [users, setUsers] = useState([]);
	const [sender, setSender] = useState("");
	const [receiver, setReceiver] = useState("");
	const [amount, setAmount] = useState("");
	const [balances, setBalances] = useState("");

	// Generate new user
	const createNewUser = () => {
		let user = {};
		let key = ec.genKeyPair();
		let hexPublicKey = key.getPublic().encode("hex");
		let privateKey = key.getPrivate().toString(16);
		let publicX = key.getPublic().x.toString(16);
		let publicY = key.getPublic().y.toString(16);

		user.privateKey = privateKey;
		user.publicKey = {
			x: publicX,
			y: publicY,
		};
		user.hexPublicKey = hexPublicKey;
		user.balance = 0;

		return user;
	};

	const createSignature = (user, msg) => {
		let msgHashString = SHA256(msg).toString();
		let keyToSign = ec.keyFromPrivate(user.privateKey);
		let signature = keyToSign.sign(msgHashString);

		return signature;
	};

	// Adds a user to the users state. User has public & private key.
	const addUser = (e) => {
		e.preventDefault();
		let user = createNewUser();
		console.log(user, "new user");

		setUsers([...users, user]);
	};

	// Shows the different users on the page
	let prinUsers;
	if (users) {
		prinUsers = users.map((user) => {
			return (
				<div key={user.hexPublicKey}>
					Public Key: {user.hexPublicKey}
					<div>Balance {user.balance}</div>
					<br />
				</div>
			);
		});
	} else {
		prinUsers = "";
	}

	// Dropdown menu to select sender
	const handleSelect = (e) => {
		setSender(e);
	};

	let senderDropdown;
	if (users) {
		let senderDropDownItem = users.map((user) => {
			return (
				<Dropdown.Item eventKey={user.hexPublicKey} key={user.hexPublicKey}>
					{JSON.stringify(user.hexPublicKey)}
				</Dropdown.Item>
			);
		});

		senderDropdown = (
			<DropdownButton
				id="dropdown-basic-button"
				title="Dropdown"
				onSelect={handleSelect}
			>
				{senderDropDownItem}
			</DropdownButton>
		);
	} else senderDropdown = "";

	// Dropdown menu to select recevier
	const handleSelectReceiver = (e) => {
		setReceiver(e);
	};

	let receiverDropdown;
	if (users) {
		let receiverDropDownItem = users.map((user) => {
			return (
				<Dropdown.Item eventKey={user.hexPublicKey} key={user.hexPublicKey}>
					{JSON.stringify(user.hexPublicKey)}
				</Dropdown.Item>
			);
		});

		receiverDropdown = (
			<DropdownButton
				id="dropdown-basic-button"
				title="Dropdown"
				onSelect={handleSelectReceiver}
			>
				{receiverDropDownItem}
			</DropdownButton>
		);
	} else receiverDropdown = "";

	// initiate a transaction. Sends the signed transaction to the server to get validated and confirmed
	const handleTransaction = (e) => {
		e.preventDefault();
		let message = {
			amount,
			receiver,
		};
		let userSending =
			users[users.findIndex((user) => user.hexPublicKey === sender)];
		let sig = createSignature(userSending, message);
		let keyToSend = userSending.hexPublicKey;
		let transaction = {
			message,
			sig,
			sender: keyToSend,
		};
		console.log(transaction, "transaction that is sent to server");
		sendTransaction(transaction);
	};

	// requests balances from the server. Balances include only confirmed transations.
	const handleGetBalances = async () => {
		let response = await getBalances();
		setBalances(response);
	};

	return (
		<div>
			<button onClick={addUser} className="margin">
				Add User
			</button>
			<div className="margin">{prinUsers} </div>
			<div className="margin">{senderDropdown}</div>
			<div className="margin">Sender: {sender}</div>
			<div className="margin">{receiverDropdown}</div>
			<div className="margin">Receiver: {receiver}</div>
			<form onSubmit={(e) => handleTransaction(e)} className="margin">
				<input
					value={amount}
					onChange={(e) => setAmount(e.target.value)}
					placeholder="amount"
					type="text"
				></input>
				<button type="submit">Submit Transaction</button>
			</form>
			<button onClick={handleGetBalances} className="margin">
				Refresh Balances
			</button>
			<div>{balances}</div>
		</div>
	);
};

export default App;
