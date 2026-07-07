import dns from "node:dns";

dns.resolveSrv(
  "_mongodb._tcp.lostandfound.4dhsxwm.mongodb.net",
  (err, records) => {
    console.log("Error:", err);
    console.log("Records:", records);
  }
);