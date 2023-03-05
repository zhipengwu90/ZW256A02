const express = require("express");
const port = 8888;
const fs = require("fs");
const morgan = require("morgan");
const pug = require("pug");
const pizzaData = "./data/pizzaorders.json";
const methodOverride = require("method-override");
const path = require("path");

const app = express();
const OUTLOG = fs.createWriteStream(
  path.join(__dirname, "logs", "access.log"),
  { flags: "a" }
);

const LOGDETAILS =
  "[:date[iso]] :method :url :status :res[content-length] - :response-time ms";
const LOGOPTIONS = {
  skip: (req, res) => {
    return req.originalUrl === "/favicon.ico";
  },
  stream: OUTLOG,
};

app.use(morgan(LOGDETAILS, LOGOPTIONS));
app.use(express.urlencoded({ extended: true }));

app.get("/favicon.ico", (req, res) => res.status(204).end());
app.set("view engine", "pug");
app.use(express.static(path.join(__dirname, "public")));

app.get("/success", (req, res) => {
  const message = req.query.message;
  res.render("success", { message });
});

app
  .route("/orders")
  .get((req, res) => {
    try {
      const orders = JSON.parse(fs.readFileSync(pizzaData, "utf-8"));
      orders.sort((a, b) => new Date(a.orderDate) - new Date(b.orderDate));
      res.render("mypizzas", { orders });
    } catch (err) {
      res.set("Content-Type", "text/html");
      res
        .status(500)
        .sendFile(path.join(__dirname, "errorpages", "error500.html"));
    }
  })
  .post((req, res) => {
    try {
      const orders = JSON.parse(fs.readFileSync(pizzaData, "utf-8"));
      let newOrderId =
        orders.reduce((acc, curr) => (curr.id > acc ? curr.id : acc), -1) + 1;
      const { type, crust, size, quantity, pricePer, orderDate } = req.body;

      const newOrder = {
        id: newOrderId,
        type: type,
        crust: crust,
        size: size,
        quantity: Number(quantity),
        pricePer: Number(pricePer),
        orderDate: orderDate.replace(/^(\d{4})-(\d{2})-(\d{2})$/, "$1/$2/$3"),
      };
      orders.push(newOrder);
      fs.writeFileSync(pizzaData, JSON.stringify(orders));
      res.redirect("/success?message=Your+order+has+been+placed+successfully");
    } catch (err) {
      res.set("Content-Type", "text/html");
      res
        .status(500)
        .sendFile(path.join(__dirname, "errorpages", "error500.html"));
    }
  });

app.use(methodOverride("_method"));
app
  .route("/orders/:id")
  .get((req, res) => {
    try {
      const id = req.params.id;
      const orders = JSON.parse(fs.readFileSync(pizzaData, "utf-8"));
      const order = orders.find((order) => order.id == id);
      res.render("singleOrder", { order });
    } catch (err) {
      res.set("Content-Type", "text/html");
      res
        .status(500)
        .sendFile(path.join(__dirname, "errorpages", "error500.html"));
    }
  })
  .put((req, res) => {
    try {
      const id = req.params.id;
      const orders = JSON.parse(fs.readFileSync(pizzaData, "utf-8"));
      const order = orders.find((order) => order.id == id);
      const index = orders.indexOf(order);
      const { type, crust, size, quantity, pricePer, orderDate } = req.body;
      const updateOrder = {
        id: Number(id),
        type: type,
        crust: crust,
        size: size,
        quantity: Number(quantity),
        pricePer: Number(pricePer),
        orderDate: orderDate.replace(/^(\d{4})-(\d{2})-(\d{2})$/, "$1/$2/$3"),
      };
      orders[index] = updateOrder;
      fs.writeFileSync(pizzaData, JSON.stringify(orders));
      res.redirect("/success?message=Your+order+has+been+updated+successfully");
    } catch (err) {
      res.set("Content-Type", "text/html");
      res
        .status(500)
        .sendFile(path.join(__dirname, "errorpages", "error500.html"));
    }
  })
  .delete((req, res) => {
    try {
      const id = req.params.id;
      const orders = JSON.parse(fs.readFileSync(pizzaData, "utf-8"));
      const order = orders.find((order) => order.id == id);
      const index = orders.indexOf(order);
      orders.splice(index, 1);
      fs.writeFileSync(pizzaData, JSON.stringify(orders));
      res.redirect("/success?message=Your+order+has+been+deleted+successfully");
    } catch (err) {
      res.set("Content-Type", "text/html");
      res
        .status(500)
        .sendFile(path.join(__dirname, "errorpages", "error500.html"));
    }
  });

app.use((req, res) => {
  res.set("Content-Type", "text/html");
  res.status(404).sendFile(path.join(__dirname, "errorpages", "error404.html"));
});

app.listen(port, () => {
  console.log(` app listening at http://localhost:${port}/orders`);
});
