import app from "./app.js";
import dotenv from "dotenv";
import { connectDB } from "./db/db.js";

dotenv.config({ path: ".env", override: true, quiet: true });

connectDB()
  .then(() => {
    app.listen(process.env.PORT, () => {
      console.log(`😊 Server is Running !! , at PORT ${process.env.PORT}`);
    });
  })
  .catch((error) => {
    console.log(`☠️ Server is Shut Down ${error}`);
  });
