const jwt = require("jsonwebtoken");
const { BlacklistModel } = require("../models/blacklist.model");
require("dotenv").config();

const auth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (token) {
      let existingToken = await BlacklistModel.find({
        blacklist: { $in: token },
      });
      if (existingToken.length > 0) {
        return res.status(400).send({ error: "Please Login again!!" });
      }

      const decoded = jwt.verify(token, process.env.secretKey);
      if (decoded) {
        req.body.userID = decoded.userID;
        req.body.firstName = decoded.username;
        next();
      } else {
        res.status(400).json({ msg: "Not Authorized!!" });
      }
    } else {
        res.status(400).json({ msg: "Please Login!!" });
    }
  } catch (err) {
    res.status(400).json({error: err.message});
  }
};

module.exports = {
    auth
}