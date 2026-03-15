const debtService = require("../services/debt.service");
exports.getDebts = async (req, res, next) => {
  try {
    res.json(
      await debtService.getDebts(
        req.pagination.page,
        req.pagination.limit,
        req.user,
      ),
    );
  } catch (err) {
    next(err);
  }
};
exports.getDebtsByMerchant = async (req, res, next) => {
  try {
    res.json(
      await debtService.getDebtsByMerchant(req.params.merchant_id, req.user),
    );
  } catch (err) {
    next(err);
  }
};
exports.getTotalDebt = async (req, res, next) => {
  try {
    res.json(await debtService.getTotalDebt(req.user));
  } catch (err) {
    next(err);
  }
};
exports.getTopDebtors = async (req, res, next) => {
  try {
    res.json(await debtService.getTopDebtors(req.user));
  } catch (err) {
    next(err);
  }
};
