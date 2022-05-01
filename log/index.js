const fs = require("fs");
const path = require("path");

const LOG_FILE_PATH = path.join(
  __dirname,
  `./data/${getCurrentDateString()}.txt`
);

function getCurrentDateString() {
  const date = new Date();
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

const WriteFileStream = fs.createWriteStream(LOG_FILE_PATH, {
  flags: "a",
});

module.exports.message = function (message) {
  console.log("[log]:", message);
  const timestamp = new Date().toLocaleTimeString();
  WriteFileStream.write(timestamp + "[LOG]: " + message + "\n");
};

module.exports.error = function (error) {
  console.error("[ERROR]:", error);
  const timestamp = new Date().toLocaleTimeString();
  WriteFileStream.write(timestamp + "[ERROR]: " + error + "\n");
};
