var express = require("express");
var router = express.Router();
var fs = require("fs");
var userModel = require("../models/users");
const multer = require("multer");
var imageUpload = "";
var pathImageUpload = "";
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/uploads");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    imageUpload = uniqueSuffix + "-" + file.originalname;
    cb(null, uniqueSuffix + "-" + file.originalname);
  },
});

const upload = multer({ storage: storage });

var fileFilter = (req, file, cb) => {
  // reject a filer
  // if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
  //   cb(null, true);
  // } else {
  //   cb(null, false);
  // }
  cb(null, true);
};

//var upload = multer({ storage: storage });

/* GET users listing. */
router.get("/", function (req, res, next) {
  userModel.find({}, function (err, data) {
    res.json(data);
  });
});
//get user by id
router.get("/:id", function (req, res, next) {
  var id = req.params.id;
  console.log("get user by id " + id);
  userModel.find({ id: id }, function (err, data) {
    res.json(data);
  });
});
//get image by id

//get user by username
router.get("/account/:username", function (req, res, next) {
  var username = req.params.username;
  console.log("get user by username " + username);
  userModel.find({ "account.username": username }, function (err, data) {
    res.json(data);
  });
});
//delete user
router.delete("/:id", (req, res, next) => {
  console.log("Delete: " + req.params.id);
  userModel
    .remove({ id: req.params.id })
    .exec()
    .then((result) => {
      res.status(200).json(result);
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({
        error: err,
      });
    });
});

//update user
router.patch("/:id", upload.single("linkAvt"), (req, res, next) => {
  var id = req.params.id;

  console.log(JSON.stringify(req.body));

  if (imageUpload !== "") {
    req.body.linkAvt = pathImageUpload;
    pathImageUpload = "";
  }
  userModel
    .updateOne({ id: id }, { $set: req.body })
    .exec()
    .then((result) => {
      result.message = "succeeded";
      res.status(200).json(result);
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({
        result: "failed",
        error: err,
      });
    });
});
//change password
router.patch("/:id/account", (req, res, next) => {
  var password = req.body.p;
  var rePassword = req.body.rp;

  if (password == rePassword) {
    res.status(200).json({
      message: "rePassword not matched",
    });
  } else {
    userModel
      .updateOne(
        { id: req.params.id },
        {
          $set: {
            "account.password": req.query.p,
            "account.created_at": new Date().toLocaleDateString("en-US"),
          },
        }
      )
      .exec()
      .then((result) => {
        result.message = "Password updated successfully";
        res.status(200).json(result);
      })
      .catch((err) => {
        console.log(err);
        res.status(500).json({
          error: err,
        });
      });
  }
});
//insert item cart
router.patch("/:idUser/cart", multer().none(), function (req, res, next) {
  var idUser = req.params.idUser;
  userModel
    .find({ id: idUser })
    .exec()
    .then((user) => {
      if (user.length < 1) {
        return res.status(401).json({
          message: "User not found",
        });
      } else {
        var idProduct = req.body.idProduct;
        var quantity = req.body.quantity;
        var size = req.body.size;
        var exists;
        for (var i = 0; i < user[0].cart.length; i++) {
          if (user[0].cart[i].id == idProduct && user[0].cart[i].size == size) {
            exists = i;
          }
        }
        if (exists !== undefined) {
          user[0].cart[exists].quantity =
            +user[0].cart[exists].quantity + +quantity;
        } else {
          user[0].cart.push({
            id: +idProduct,
            size: size,
            quantity: +quantity,
          });
        }
        userModel
          .updateOne(
            { id: idUser },
            {
              $set: {
                cart: user[0].cart,
              },
            }
          )
          .exec()
          .then((result) => {
            result.message = "Cart updated successfully";
            res.status(200).json(result);
          })
          .catch((err) => {
            console.log(err);
            res.status(500).json({
              error: err,
            });
          });
      }
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({
        error: err,
      });
    });
});
//Delete item Cart by index array
router.delete("/:idUser/cart/:index", function (req, res, next) {
  var idUser = req.params.idUser;
  userModel
    .find({ id: idUser })
    .exec()
    .then((user) => {
      if (user.length < 1) {
        return res.status(401).json({
          message: "User not found",
        });
      } else {
        console.log(user[0].cart);
        user[0].cart.splice(req.params.index, 1);
        userModel
          .updateOne(
            { id: idUser },
            {
              $set: {
                cart: user[0].cart,
              },
            }
          )
          .exec()
          .then((result) => {
            result.message = "Delete item cart successfully";
            res.status(200).json(result);
          })
          .catch((err) => {
            console.log(err);
            res.status(500).json({
              error: err,
            });
          });
      }
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({
        error: err,
      });
    });
});
//Update quantity on cart
router.patch("/:idUser/cart/:index", function (req, res, next) {
  var idUser = req.params.idUser;
  userModel
    .find({ id: idUser })
    .exec()
    .then((user) => {
      if (user.length < 1) {
        return res.status(401).json({
          message: "User not found",
        });
      } else {
        console.log(user[0].cart);
        user[0].cart[req.params.index].quantity = +req.query.quantity;
        userModel
          .updateOne(
            { id: idUser },
            {
              $set: {
                cart: user[0].cart,
              },
            }
          )
          .exec()
          .then((result) => {
            result.message = "Update quantity on item cart successfully";
            res.status(200).json(result);
          })
          .catch((err) => {
            console.log(err);
            res.status(500).json({
              error: err,
            });
          });
      }
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({
        error: err,
      });
    });
});
//insert item wishlist
router.patch("/:idUser/wishlist", function (req, res, next) {
  var idUser = req.params.idUser;
  userModel
    .find({ id: idUser })
    .exec()
    .then((user) => {
      if (user.length < 1) {
        return res.status(401).json({
          message: "User not found",
        });
      } else {
        var idProduct = req.query.idProduct;
        if (!user[0].wishlist.indexOf(idProduct) === true) {
          res.status(200).json({ message: "Product exists on wishlist" });
        } else {
          user[0].wishlist.push(+req.query.idProduct);
          userModel
            .updateOne(
              { id: idUser },
              {
                $set: {
                  wishlist: user[0].wishlist,
                },
              }
            )
            .exec()
            .then((result) => {
              result.message = "Wishlist updated successfully";
              res.status(200).json(result);
            })
            .catch((err) => {
              console.log(err);
              res.status(500).json({
                error: err,
              });
            });
        }
      }
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({
        error: err,
      });
    });
});
//Delete item wishlist by index array
router.delete("/:idUser/wishlist/:index", function (req, res, next) {
  var idUser = req.params.idUser;
  userModel
    .find({ id: idUser })
    .exec()
    .then((user) => {
      if (user.length < 1) {
        return res.status(401).json({
          message: "User not found",
        });
      } else {
        console.log(user[0].wishlist);
        user[0].wishlist.splice(req.params.index, 1);
        userModel
          .updateOne(
            { id: idUser },
            {
              $set: {
                wishlist: user[0].wishlist,
              },
            }
          )
          .exec()
          .then((result) => {
            result.message = "Delete item wishlist successfully";
            res.status(200).json(result);
          })
          .catch((err) => {
            console.log(err);
            res.status(500).json({
              error: err,
            });
          });
      }
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({
        error: err,
      });
    });
});
//update id ordered
router.patch("/:idUser/ordered", multer().none(), function (req, res, next) {
  var idUser = req.body.idUser;
  console.log("idUser: " + idUser);
  userModel
    .find({ id: idUser })
    .exec()
    .then((user) => {
      if (user.length < 1) {
        return res.status(401).json({
          message: "User not found",
        });
      } else {
        var idOrdered = req.body.io;
        console.log("idOrdered: " + idOrdered);
        if (!user[0].ordered.indexOf(idOrdered) === true) {
          res.status(200).json({ message: "Ordered exists" });
        } else {
          user[0].ordered.push(idOrdered);
          userModel
            .updateOne(
              { id: idUser },
              {
                $set: {
                  ordered: user[0].ordered,
                },
              }
            )
            .exec()
            .then((result) => {
              result.message = "Ordered updated successfully";
              res.status(200).json(result);
            })
            .catch((err) => {
              console.log(err);
              res.status(500).json({
                error: err,
              });
            });
        }
      }
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({
        error: err,
      });
    });
});

//get image of users
router.get("/:id/image", function (req, res, next) {
  var id = req.params.id;
  console.log("get IMAGE of users by id " + id);
  productModel.find({ id: id }, function (err, data) {
    console.log(data[0].link_image);
    let imageName = "./public/uploads/" + data[0].link_image;
    fs.readFile(imageName, (err, imageData) => {
      if (err) {
        res.json({ result: "failed", error: err });
      }
      res.writeHead(200, { "content-type": "image/jpeg" });
      res.end(imageData);
    });
  });
});
/* GET product in cart listing. */
// router.get("/:id/cart", function (req, res, next) {
//   console.log("get cart by id user");
//   var id = req.params.id;
//   userModel
//     .find({ id: id })
//     .exec()
//     .then((user) => {
//       if (user.length < 1) {
//         return res.status(401).json({
//           message: "User not found",
//         });
//       } else {
//        // console.log("cart: " +  JSON.stringify(user[0].cart[0]));
        
//         res.status(200).json(user[0].cart);
//       }
//     })
//     .catch((err) => {
//       console.log(err);
//       res.status(500).json({
//         error: err,
//       });
//     });
// });
module.exports = router;
