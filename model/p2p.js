const ws = require("ws");
const { Blockchain, Transaction } = require("./BlockchainCore");
const Wallet = require("ethereumjs-wallet").default;
const EC = require("elliptic").ec;
const ec = new EC("secp256k1");

// P2P network interface
class P2P {
  constructor(port, blockchain) {
    this.port = port;
    /**
     * @type {Blockchain}
     */
    this.blockchain = blockchain;
    this.sockets = [];
  }

  // as server
  listen() {
    const server = new ws.Server({ port: this.port });
    server.on("connection", (socket) => this.connectSocket(socket));
    console.log(`Listening for peer-to-peer connections on: ${this.port}`);
  }

  registerSocket(socket) {
    //check socket readystate
    while (socket.readyState !== ws.OPEN) {
      console.log(".");
    }
    socket.send(JSON.stringify({ type: "request-chain" }));
    this.connectSocket(socket);
  }

  /**
   *
   * @param {ws} socket
   * @returns
   */
  connectSocket(socket) {
    if (this.sockets.includes(socket)) {
      return;
    }

    this.sockets.push(socket);
    console.log("Socket connected ");
    socket.on("message", (message) => this.messageHandler(message, socket));
    socket.on("close", () => this.disconnectSocket(socket));
    //request latest chain
    // socket.send(JSON.stringify({ type: "request-chain" }));
  }

  // register peer and broadcast
  // registerPeerAndBroadcast(peer) {
  //   this.connectPeer(peer);
  //   this.broadcastNewPeer(peer);
  // }

  // as client
  connectPeer(peer) {
    const socket = new ws(peer);
    socket.on("open", () => this.registerSocket(socket));
    //request latest chain
    // socket.send(JSON.stringify({ type: "request-chain" }));
  }

  connectAllPeers(peers) {
    peers.forEach((peer) => this.connectPeer(peer));
  }

  //broadcast new peer
  // broadcastNewPeer(peer) {
  //   this.sockets.forEach((socket) => {
  //     socket.send(JSON.stringify({ type: "register-peer", peer }));
  //   });
  // }

  messageHandler(message, socket) {
    const data = JSON.parse(message);
    console.log("model/p2p.js", "data", data.type);

    switch (data.type) {
      case "chain":
        this.blockchain.replaceChain(data.chain);
        break;
      case "transaction":
        this.blockchain.addTransaction(data.transaction);
        break;
      case "clear-transactions":
        this.blockchain.clearTransactions();
        break;
      case "request-chain":
        socket.send(
          JSON.stringify({ type: "chain", chain: this.blockchain.chain })
        );
        break;
      case "request-transactions":
        socket.send(
          JSON.stringify({
            type: "transactions",
            transactions: this.blockchain.transactions,
          })
        );
        break;
      // case "register-peer":
      //   this.connectPeer(data.peer);
      //   break;
      // case "peers":
      //   this.connectAllPeers(socket);
      case "message":
        console.log("model/p2p.js", "Message", data.data);
      case "generate-wallet":
        const key = ec.genKeyPair();

        socket.send(
          JSON.stringify({
            type: "key",
            key: {
              private_key: key.getPrivate("hex"),
              public_key: key.getPublic("hex"),
            },
          })
        );
        break;
      case "request-balance":
        const public_key = data.public_key;
        const balance = this.blockchain.getBalanceOfAddress(public_key);
        socket.send(JSON.stringify({ type: "balance", balance }));
        break;
      case "make-transaction":
        const { from, to, amount, private_key } = data;
        const transaction = new Transaction(from, to, amount);
        transaction.signingTransactionByPrivateKey(private_key);
        this.blockchain.addTransaction();
        break;
      default:
        break;
    }
  }

  broadcastMessage(message) {
    this.sockets.forEach((socket) => {
      socket.send(JSON.stringify(message));
    });
  }

  broadcastChain() {
    this.sockets.forEach((socket) => {
      socket.send(
        JSON.stringify({ type: "chain", chain: this.blockchain.chain })
      );
    });
  }

  broadcastTransaction(transaction) {
    this.sockets.forEach((socket) => {
      socket.send(JSON.stringify({ type: "transaction", transaction }));
    });
  }

  broadcastClearTransactions() {
    this.sockets.forEach((socket) => {
      socket.send(JSON.stringify({ type: "clear-transactions" }));
    });
  }

  disconnectSocket(socket) {
    this.sockets = this.sockets.filter((s) => s !== socket);
  }
}

module.exports.P2P = P2P;
