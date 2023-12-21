
import express from 'express';
import tournamentRoute from './routes/tournaments';
import bookingsroute from './routes/booking';
import  teesRoute from './routes/tees'
import classesRoute from "./routes/classes"
const app = express();

const PORT= process.env.PORT || 5000

app.use(express.json());






// Define your routes and handlers here
app.get("/", (req, res)=> res.send("Hi there, welcome here!!"))
app.use('/api/tournaments', tournamentRoute);
app.use('/api/bookings', bookingsroute);
app.use('/api/classes', classesRoute);
app.use('/api/tee',  teesRoute);
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
