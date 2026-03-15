// src/services/_dbErrors.js
function isDuplicateKey(err) {
  return (
    err &&
    (err.code === "ER_DUP_ENTRY" ||
      String(err.message || "").includes("Duplicate entry"))
  );
}

// map theo constraint name (optional)
function duplicateMessage(err, fallback = "Duplicate data") {
  const msg = String(err.message || "");
  // có thể match theo uq name nếu bạn muốn cụ thể hơn
  return fallback;
}

module.exports = { isDuplicateKey, duplicateMessage };
