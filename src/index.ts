import express from "express";
import cors from "cors";

import errorHandler from "./middlewares/errorHandler";
import routes from "./routes";
import cache from "./middlewares/cache";

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());

app.use(cache(3600));
app.use("/api/v1", routes);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log("Listening on port", PORT);
});
