// require("dotenv").config({ path: "./env" });
import connectionDB from "./db/index.js";
import dotenv from "dotenv";
import { app } from "./app.js";
dotenv.config({
  path: "./env",
});

connectionDB()
  .then(() => {
    app.listen(process.env.PORT || 3000, () => {
      console.log(`Server is Running at Port: ${process.env.PORT}`);
    });
  })
  .catch((error) => {
    console.log("MongoDB Connection Failed", error);
  });

/*(async () => {
  try {
    await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`);
  } catch (error) {
    console.log("error");
  }
})();*/
