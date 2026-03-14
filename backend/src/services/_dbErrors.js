function isDuplicateKey(err) {
  return (
    err &&
    (err.code === "ER_DUP_ENTRY" ||
      String(err.message || "").includes("Duplicate entry"))
  );
}

function duplicateMessage(err, fallback = "Duplicate data") {
  const msg = String(err.message || "");
  return fallback;
}

module.exports = { isDuplicateKey, duplicateMessage };