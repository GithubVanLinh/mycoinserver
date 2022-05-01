// Define blockchain core
const SHA256 = require("crypto-js/sha256");
const crypto = require("crypto");
const EC = require("elliptic").ec;
const ec = new EC("secp256k1");
const Log = require("../log");

// Transaction need to be signed before adding to the blockchain
class Transaction {
  constructor(fromAddress, toAddress, amount) {
    this.fromAddress = fromAddress;
    this.toAddress = toAddress;
    this.amount = amount;
  }

  calculateHash() {
    return crypto
      .createHash("sha256")
      .update(this.fromAddress + this.toAddress + this.amount)
      .digest("hex")
      .toString();
  }

  signingTransactionByPrivateKey(privateKey) {
    const key = ec.keyFromPrivate(privateKey, "hex");

    if (key.getPublic("hex") !== this.fromAddress) {
      throw new Error("You cannot sign transactions for other wallets!");
    }

    const signature = key.sign(this.calculateHash(), "base64");
    this.signature = signature.toDER("hex");
  }

  /**
   *
   * @param {EC.ec.KeyPair} signingKey
   */
  signingTransaction(signingKey) {
    if (signingKey.getPublic("hex") !== this.fromAddress) {
      throw new Error("You cannot sign transactions for other wallets!");
    }

    const hashTx = this.calculateHash();
    const sig = signingKey.sign(hashTx, "base64");
    this.signature = sig.toDER("hex");
  }

  isValid() {
    if (this.fromAddress === null) return true;

    if (!this.signature || this.signature.length === 0) {
      throw new Error("No signature in this transaction");
    }

    const publicKey = ec.keyFromPublic(this.fromAddress, "hex");
    return publicKey.verify(this.calculateHash(), this.signature);

    // return true;
  }

  toString() {
    return `
      fromAddress: ${this.fromAddress}
      toAddress: ${this.toAddress}
      amount: ${this.amount}
      signature: ${this.signature}
    `;
  }
}

class Block {
  constructor(index, timestamp, transactions, previousHash = "") {
    this.index = index;
    this.timestamp = timestamp;
    this.transactions = transactions;
    this.previousHash = previousHash;
    this.hash = this.calculateHash();
    this.nonce = 0;
  }

  calculateHash() {
    return SHA256(
      this.index +
        this.previousHash +
        this.timestamp +
        JSON.stringify(this.data) +
        this.nonce
    ).toString();
  }

  mineBlock(difficulty) {
    // promise mine block
    while (
      this.hash.substring(0, difficulty) !== Array(difficulty + 1).join("0")
    ) {
      this.nonce++;
      this.hash = this.calculateHash();
    }

    Log.message(`Block mined: ${this.toString()}`);
  }

  toString() {
    return `  Block - Number ${this.index}
      Timestamp: ${this.timestamp}
      Transactions: [
          ${this.transactions
            .map((tx) => tx.toString())
            .join("======================================================")}
      ]
      Previous Hash: ${this.previousHash}
      Hash: ${this.hash}
      Nonce: ${this.nonce}`;
  }
}

// --------------------blockchain--------------------
class Blockchain {
  constructor() {
    this.difficulty = 5;
    this.pendingTransactions = [];
    this.miningReward = 100;
    this.chain = [this.createGenesisBlock()];
  }

  // /**
  //  *
  //  * @param {Block} block
  //  */
  // addBlock(block) {
  //   block.previousHash = this.chain[this.chain.length - 1].hash;
  //   block.mineBlock(this.difficulty);
  //   this.chain.push(block);
  // }

  createGenesisBlock() {
    return new Block(0, Date.now(), [], "Genesis Block");
  }

  getLatestBlock() {
    return this.chain[this.chain.length - 1];
  }

  miningPendingTransactions(miningRewardAddress) {
    const rewardTx = new Transaction(
      null,
      miningRewardAddress,
      this.miningReward
    );
    this.pendingTransactions.push(rewardTx);

    const latestBlock = this.getLatestBlock();

    let block = new Block(
      latestBlock.index + 1,
      Date.now(),
      this.pendingTransactions,
      this.getLatestBlock().hash
    );
    block.mineBlock(this.difficulty);

    console.log("Block successfully mined!");
    this.chain.push(block);

    this.pendingTransactions = [];
  }

  /**
   * add transaction to pending transactions
   * transaction need to be signed before adding to the blockchain
   * @param {Transaction} transaction transaction to be added need to be signed
   */
  addTransaction(transaction) {
    if (!transaction.fromAddress || !transaction.toAddress) {
      throw new Error("Transaction must include from and to address");
    }

    if (!transaction.isValid()) {
      throw new Error("Cannot add invalid transaction to chain");
    }

    if (transaction.amount <= 0) {
      throw new Error("Transaction amount must be greater than 0");
    }

    if (
      this.getBalanceOfAddress(transaction.fromAddress) < transaction.amount
    ) {
      throw new Error("Not enough balance");
    }

    this.pendingTransactions.push(transaction);
  }

  //get balance of adress
  getBalanceOfAddress(address) {
    let balance = 0;

    for (const block of this.chain) {
      for (const transaction of block.transactions) {
        if (transaction.fromAddress === address) {
          balance -= transaction.amount;
        }

        if (transaction.toAddress === address) {
          balance += transaction.amount;
        }
      }
    }

    return balance;
  }

  //replace Chain
  replaceChain(newChain) {
    if (newChain.length <= this.chain.length) {
      console.log("Received chain is not longer than the current chain.");
      return;
    } else if (!this.isChainValid(newChain)) {
      console.log("The received chain is not valid.");
      return;
    }

    console.log("Replacing blockchain with the new chain.");
    this.chain = newChain;
    writeJsonToFile(this.chain);
  }

  //clear Transactions
  clearTransactions() {
    this.pendingTransactions = [];
  }

  isChainValid() {
    for (let i = 1; i < this.chain.length; i++) {
      const currentBlock = this.chain[i];
      const previousBlock = this.chain[i - 1];

      if (!currentBlock.hasValidTransaction()) {
        return false;
      }

      if (currentBlock.hash !== currentBlock.calculateHash()) {
        return false;
      }

      if (currentBlock.previousHash !== previousBlock.hash) {
        return false;
      }
    }
    return true;
  }

  toString() {
    let string = `Chain: ${this.chain.length} blocks\n`;
    this.chain.forEach((block) => {
      string += `=============================${block.index}=============================\n`;
      string += block.toString() + "\n";
    });
    return string;
  }

  fromJson(json) {
    this.chain = JSON.parse(json);
  }

  /**
   *
   * @param {Number} id
   * @returns {Block}
   */
  getBlock(id) {
    return this.chain.find((block) => block.index === id);
  }
}

module.exports = {
  Block,
  Blockchain,
  Transaction,
};
