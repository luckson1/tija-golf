
import express from 'express';
import bookingsRoute from '../routes/booking';
import  teesRoute from '../routes/tees'
import classesRoute from "../routes/classes"
import profileRoute from 'routes/profile';
import tournamentRoute from 'routes/tournaments';
const app = express();

const PORT= process.env.PORT || 5000

app.use(express.json());






// Define your routes and handlers here
app.get("/", (req, res)=> res.send("Hi there, welcome here!!"))
app.use('/api/tournaments', tournamentRoute);
app.use('/api/bookings', bookingsRoute);
app.use('/api/classes', classesRoute);
app.use('/api/tee',  teesRoute);
app.use('/api/profile', profileRoute);
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
