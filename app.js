const Log = require("./log");

require("dotenv").config();
const { Blockchain, Transaction } = require("./model/BlockchainCore");

const blockchain = new Blockchain();

const tx1 = new Transaction(process.env.PUBLIC_KEY, "address2", 100);
tx1.signingTransactionByPrivateKey(process.env.PRIVATE_KEY);

blockchain.addTransaction(tx1);

blockchain.miningPendingTransactions(process.env.PUBLIC_KEY);

Log.message(blockchain);

Log.message(
  "address 1: " + blockchain.getBalanceOfAddress(process.env.PUBLIC_KEY)
);

Log.message("address 2: " + blockchain.getBalanceOfAddress("address2"));
