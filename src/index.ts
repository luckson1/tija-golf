import express from "express";
import bookingsRoute from "./routes/booking";
import teesRoute from "./routes/tees";
import classesRoute from "./routes/classes";
import tournamentRoute from "./routes/tournaments";
import profileRoute from "./routes/profile";
import orgRoute from "./routes/organisation";
import paymentRoute from "./routes/payments";
import eventRoute from "./routes/events";
import partnerRoute from "./routes/partners";
import leadershipBoardRoute from "./routes/leadershipboard";
import attachmentRoute from "./routes/attachments";
import cartRoute from "./routes/cart";
import announcementRoute from "./routes/announcements";
import packagesRoute from "./routes/packages";
import packageGroupsRoute from "./routes/package-groups";

import { setupSwagger } from "./swagger";
const app = express();

const PORT = process.env.PORT || 4000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Setup Swagger
setupSwagger(app);
// Define your routes and handlers here
app.get("/", (req, res) =>
  res.send(
    ` Hello there and welcome: ${process.env.APPSETTING_AZURE_STORAGE_CONNECTION_STRING} `
  )
);
app.use("/api/tournaments", tournamentRoute);
app.use("/api/partners", partnerRoute);
app.use("/api/board", leadershipBoardRoute);
app.use("/api/bookings", bookingsRoute);
app.use("/api/classes", classesRoute);
app.use("/api/tee", teesRoute);
app.use("/api/events", eventRoute);
app.use("/api/profile", profileRoute);
app.use("/api/organization", orgRoute);
app.use("/api/payments", paymentRoute);
app.use("/api/attachments", attachmentRoute);
app.use("/api/cart", cartRoute);
app.use("/api/announcements", announcementRoute);
app.use("/api/packages", packagesRoute);
app.use("/api/packageGroups", packageGroupsRoute);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
