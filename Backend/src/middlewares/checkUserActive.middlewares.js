exports.checkUserActive = async (req, res, next) => {
    const { trangThai } = req.user;
    console.log("trangThai:", req.user.trangThai);
    if (trangThai !== "active") {
        return res.status(403).json({
        message: "User is not active"
        });
    }

    next();
};