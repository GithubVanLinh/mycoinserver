const Log = require("./log");

// require("dotenv").config();
const { Blockchain, Transaction } = require("./model/BlockchainCore");
const { P2P } = require("./model/p2p");
const receiveAddress = require("./configs/address");

const p2pNetwork = new P2P(process.env.P2P_PORT, new Blockchain());
p2pNetwork.listen();

if (process.env.PEERS) {
  const peers = process.env.PEERS.split(",");
  p2pNetwork.connectAllPeers(peers);
}

p2pNetwork.blockchain.pendingTransactions.push(
  new Transaction(null, receiveAddress.PublicKey, 1000)
);

p2pNetwork.blockchain.miningPendingTransactions(receiveAddress.PublicKey);
