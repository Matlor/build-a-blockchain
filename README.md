
RUN
run the react app inside the react-client folder (npm start). 
run the server (node index).
run the miner (node index).

The server receives transactions from the users and validates them (if enough funds, signature etc.) then pushes them to the mempool. 
The miner regularly requests the mempool and then tries to find a block to include the transactions into. 
Once found he sends that block to the server. A transaction requires only one confirmation. 
Upon receiving the block, the server updates the balances of the users. 
The users can request to see the updated balances by pressing the button in the react app.

